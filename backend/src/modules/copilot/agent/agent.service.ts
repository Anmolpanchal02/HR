import mongoose from "mongoose";

import { getAgentMaxToolCalls } from "./agent.config.js";
import { AppError } from "../../../utils/app-error.js";
import type { AuthContext } from "../../users/user.types.js";
import type { CopilotCitation } from "../copilot.types.js";
import { AgentRunStatus } from "./agent.types.js";
import { createAgentRun, completeAgentRun } from "./agent-run.model.js";
import { recordAgentToolCall } from "./agent-tool-call.model.js";
import { AGENT_SYSTEM_PROMPT } from "./agent.config.js";
import { getAgentLLMProvider } from "./llm/openai-agent.llm.js";
import type { AgentMessage } from "./llm/agent-llm.provider.js";
import type { LLMUsage } from "../llm/llm.provider.js";
import { getToolByName, getToolDefinitions, isKnownTool } from "../tools/tool-registry.js";
import { isToolDeniedAtAgentLayer } from "../tools/tool-permissions.js";
import { toolFailure, toolErrorMessage } from "../tools/tool-result.js";
import type { ToolCallSummary, ToolContext, ToolResult } from "../tools/tool.types.js";
import { sanitizeToolInput } from "../tools/tool.types.js";
import { validateToolInput } from "../tools/tool-validation.js";

export interface AgentRunResult {
  content: string;
  citations: CopilotCitation[];
  toolCalls: ToolCallSummary[];
  usage: LLMUsage;
  provider: string;
  model: string;
}

function toToolContext(authUser: AuthContext): ToolContext {
  return {
    userId: authUser.userId,
    organizationId: authUser.organizationId,
    role: authUser.role,
  };
}

function extractCitationsFromToolResults(messages: AgentMessage[]): CopilotCitation[] {
  const citations: CopilotCitation[] = [];
  for (const msg of messages) {
    if (msg.role !== "tool" || msg.name !== "search_documents") continue;
    try {
      const parsed = JSON.parse(msg.content) as ToolResult;
      const docCitations = (parsed.data?.citations as CopilotCitation[] | undefined) ?? [];
      citations.push(...docCitations);
    } catch {
      // ignore malformed tool payloads
    }
  }
  return citations;
}

function emptyUsage(): LLMUsage {
  return { inputTokens: null, outputTokens: null, totalTokens: null };
}

function mergeUsage(total: LLMUsage, next: LLMUsage): LLMUsage {
  const add = (a: number | null, b: number | null) =>
    a !== null && b !== null ? a + b : a ?? b;
  return {
    inputTokens: add(total.inputTokens, next.inputTokens),
    outputTokens: add(total.outputTokens, next.outputTokens),
    totalTokens: add(total.totalTokens, next.totalTokens),
  };
}

function logAgentEvent(event: Record<string, unknown>): void {
  console.info(JSON.stringify({ component: "agent", ...event }));
}

export class AgentService {
  async run(
    authUser: AuthContext,
    userMessage: string,
    conversationId?: mongoose.Types.ObjectId,
    priorHistory: AgentMessage[] = [],
  ): Promise<AgentRunResult> {
    const startMs = Date.now();
    const llm = getAgentLLMProvider();
    const toolContext = toToolContext(authUser);
    const tools = getToolDefinitions();

    const agentRun = await createAgentRun({
      organizationId: new mongoose.Types.ObjectId(authUser.organizationId),
      userId: new mongoose.Types.ObjectId(authUser.userId),
      conversationId,
      llmModel: llm.modelName,
    });

    const messages: AgentMessage[] = [...priorHistory, { role: "user", content: userMessage }];
    const toolCallSummaries: ToolCallSummary[] = [];
    let toolCallCount = 0;
    let totalUsage = emptyUsage();
    let runFinished = false;

    logAgentEvent({
      event: "agent_run_started",
      agentRunId: agentRun._id.toString(),
      organizationId: authUser.organizationId,
      userId: authUser.userId,
      model: llm.modelName,
    });

    try {
      for (let step = 0; step <= getAgentMaxToolCalls(); step += 1) {
        const turn = await llm.runTurn({
          systemPrompt: AGENT_SYSTEM_PROMPT,
          messages,
          tools,
        });

        totalUsage = mergeUsage(totalUsage, turn.usage);

        if (turn.type === "message" || !turn.toolCalls?.length) {
          const content = turn.content?.trim() || "I was unable to generate a response.";
          await completeAgentRun(agentRun._id, {
            status: AgentRunStatus.COMPLETED,
            toolCallCount,
            latencyMs: Date.now() - startMs,
          });
          runFinished = true;

          logAgentEvent({
            event: "agent_run_completed",
            agentRunId: agentRun._id.toString(),
            organizationId: authUser.organizationId,
            userId: authUser.userId,
            toolCallCount,
            totalLatencyMs: Date.now() - startMs,
            model: llm.modelName,
          });

          return {
            content,
            citations: extractCitationsFromToolResults(messages),
            toolCalls: toolCallSummaries,
            usage: totalUsage,
            provider: llm.providerName,
            model: llm.modelName,
          };
        }

        if (toolCallCount + turn.toolCalls.length > getAgentMaxToolCalls()) {
          await completeAgentRun(agentRun._id, {
            status: AgentRunStatus.LIMIT_REACHED,
            toolCallCount,
            latencyMs: Date.now() - startMs,
          });
          runFinished = true;
          throw new AppError("Agent tool call limit reached", 429);
        }

        messages.push({
          role: "assistant",
          content: turn.content ?? "",
          toolCalls: turn.toolCalls,
        });

        for (const call of turn.toolCalls) {
          toolCallCount += 1;
          const toolStartMs = Date.now();

          if (!isKnownTool(call.name)) {
            const errorResult = toolFailure("VALIDATION_ERROR", "Unknown tool");
            toolCallSummaries.push({ tool: call.name, status: "error", summary: "Unknown tool" });
            messages.push({
              role: "tool",
              toolCallId: call.id,
              name: call.name,
              content: JSON.stringify(errorResult),
            });
            continue;
          }

          if (isToolDeniedAtAgentLayer(call.name, toolContext.role)) {
            const errorResult = toolFailure("FORBIDDEN", "Permission denied");
            toolCallSummaries.push({
              tool: call.name,
              status: "error",
              summary: "Permission denied",
            });
            messages.push({
              role: "tool",
              toolCallId: call.id,
              name: call.name,
              content: JSON.stringify(errorResult),
            });
            await recordAgentToolCall({
              agentRunId: agentRun._id,
              organizationId: agentRun.organizationId,
              userId: agentRun.userId,
              toolName: call.name,
              status: "error",
              summary: "Permission denied",
              latencyMs: Date.now() - toolStartMs,
            });
            continue;
          }

          const tool = getToolByName(call.name)!;
          const sanitized = sanitizeToolInput(call.arguments);
          const validation = validateToolInput(tool.definition.inputSchema, sanitized);

          if (!validation.valid) {
            const errorResult = toolFailure("VALIDATION_ERROR", validation.message);
            toolCallSummaries.push({
              tool: call.name,
              status: "error",
              summary: validation.message,
            });
            messages.push({
              role: "tool",
              toolCallId: call.id,
              name: call.name,
              content: JSON.stringify(errorResult),
            });
            await recordAgentToolCall({
              agentRunId: agentRun._id,
              organizationId: agentRun.organizationId,
              userId: agentRun.userId,
              toolName: call.name,
              status: "error",
              summary: validation.message,
              latencyMs: Date.now() - toolStartMs,
            });
            continue;
          }

          const result = await tool.execute(validation.normalized, toolContext);
          const latencyMs = Date.now() - toolStartMs;

          toolCallSummaries.push({
            tool: call.name,
            status: result.success ? "success" : "error",
            summary: result.summary ?? toolErrorMessage(result),
          });

          messages.push({
            role: "tool",
            toolCallId: call.id,
            name: call.name,
            content: JSON.stringify(result),
          });

          await recordAgentToolCall({
            agentRunId: agentRun._id,
            organizationId: agentRun.organizationId,
            userId: agentRun.userId,
            toolName: call.name,
            status: result.success ? "success" : "error",
            summary: result.summary ?? toolErrorMessage(result),
            latencyMs,
          });

          logAgentEvent({
            event: "tool_executed",
            agentRunId: agentRun._id.toString(),
            organizationId: authUser.organizationId,
            userId: authUser.userId,
            toolName: call.name,
            toolStatus: result.success ? "success" : "error",
            toolLatencyMs: latencyMs,
          });
        }
      }

      await completeAgentRun(agentRun._id, {
        status: AgentRunStatus.LIMIT_REACHED,
        toolCallCount,
        latencyMs: Date.now() - startMs,
      });
      runFinished = true;
      throw new AppError("Agent tool call limit reached", 429);
    } catch (error) {
      if (!runFinished) {
        await completeAgentRun(agentRun._id, {
          status: AgentRunStatus.FAILED,
          toolCallCount,
          latencyMs: Date.now() - startMs,
        });
      }
      throw error;
    }
  }
}

export const agentService = new AgentService();
