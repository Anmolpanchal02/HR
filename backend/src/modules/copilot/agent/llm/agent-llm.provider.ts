import type { LLMUsage } from "../../llm/llm.provider.js";
import type { ToolCallRequest, ToolDefinition } from "../../tools/tool.types.js";

export type AgentMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCallRequest[] }
  | { role: "tool"; toolCallId: string; name: string; content: string };

export interface AgentTurnResult {
  type: "message" | "tool_calls";
  content?: string;
  toolCalls?: ToolCallRequest[];
  usage: LLMUsage;
}

export interface AgentLLMProvider {
  readonly providerName: string;
  readonly modelName: string;
  runTurn(input: {
    systemPrompt: string;
    messages: AgentMessage[];
    tools: ToolDefinition[];
  }): Promise<AgentTurnResult>;
}
