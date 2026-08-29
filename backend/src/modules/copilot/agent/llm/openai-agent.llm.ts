import { env } from "../../../../config/env.js";
import { AppError } from "../../../../utils/app-error.js";
import type { AgentLLMProvider, AgentMessage, AgentTurnResult } from "./agent-llm.provider.js";
import type { ToolCallRequest, ToolDefinition } from "../../tools/tool.types.js";
import { MockAgentLLMProvider } from "./mock-agent.llm.js";

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function toOpenAIMessages(messages: AgentMessage[]) {
  const result: Array<Record<string, unknown>> = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      if (msg.toolCalls?.length) {
        result.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        });
      } else {
        result.push({ role: "assistant", content: msg.content });
      }
    } else if (msg.role === "tool") {
      result.push({ role: "tool", tool_call_id: msg.toolCallId, content: msg.content });
    }
  }
  return result;
}

export class OpenAIAgentLLMProvider implements AgentLLMProvider {
  readonly providerName = "openai";
  readonly modelName: string;
  private readonly apiKey: string;

  constructor(apiKey: string, modelName: string) {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async runTurn(input: {
    systemPrompt: string;
    messages: AgentMessage[];
    tools: ToolDefinition[];
  }): Promise<AgentTurnResult> {
    const openaiTools = input.tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [{ role: "system", content: input.systemPrompt }, ...toOpenAIMessages(input.messages)],
        tools: openaiTools,
        tool_choice: "auto",
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new AppError("Agent LLM request failed", 502);
    }

    const body = (await response.json()) as OpenAIChatResponse;
    const choice = body.choices[0]?.message;
    const usage = {
      inputTokens: body.usage?.prompt_tokens ?? null,
      outputTokens: body.usage?.completion_tokens ?? null,
      totalTokens: body.usage?.total_tokens ?? null,
    };

    if (choice?.tool_calls?.length) {
      const toolCalls: ToolCallRequest[] = choice.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>,
      }));
      return { type: "tool_calls", toolCalls, usage };
    }

    return {
      type: "message",
      content: choice?.content?.trim() ?? "",
      usage,
    };
  }
}

export function createAgentLLMProvider(): AgentLLMProvider {
  if (env.llmProvider.toLowerCase() === "openai") {
    if (!env.llmApiKey) {
      throw new AppError("LLM_API_KEY is required for OpenAI agent", 500);
    }
    return new OpenAIAgentLLMProvider(env.llmApiKey, env.llmModel);
  }
  return new MockAgentLLMProvider();
}

let cachedAgentLLM: AgentLLMProvider | null = null;

export function getAgentLLMProvider(): AgentLLMProvider {
  if (!cachedAgentLLM) {
    cachedAgentLLM = createAgentLLMProvider();
  }
  return cachedAgentLLM;
}

export function resetAgentLLMProviderForTests(): void {
  cachedAgentLLM = null;
}
