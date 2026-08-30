import { env } from "../../../../config/env.js";
import { AppError } from "../../../../utils/app-error.js";
import type { AgentLLMProvider, AgentMessage, AgentTurnResult } from "./agent-llm.provider.js";
import type { ToolCallRequest, ToolDefinition } from "../../tools/tool.types.js";
import { MockAgentLLMProvider } from "./mock-agent.llm.js";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
/** Free-tier default; Llama IDs vary by account — gpt-oss supports tools. */
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

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
  error?: { message?: string };
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

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** OpenAI-compatible chat completions (OpenAI + Groq). */
export class OpenAICompatibleAgentLLMProvider implements AgentLLMProvider {
  readonly providerName: string;
  readonly modelName: string;
  private readonly apiKey: string;
  private readonly chatUrl: string;

  constructor(input: {
    providerName: string;
    apiKey: string;
    modelName: string;
    chatUrl: string;
  }) {
    this.providerName = input.providerName;
    this.apiKey = input.apiKey;
    this.modelName = input.modelName;
    this.chatUrl = input.chatUrl;
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

    const response = await fetch(this.chatUrl, {
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

    const body = (await response.json()) as OpenAIChatResponse;

    if (!response.ok) {
      const detail = body.error?.message ?? `HTTP ${response.status}`;
      throw new AppError(`Agent LLM request failed (${this.providerName}): ${detail}`, 502);
    }

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
        arguments: parseToolArguments(tc.function.arguments),
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

/** @deprecated Use OpenAICompatibleAgentLLMProvider — kept as alias for clarity. */
export class OpenAIAgentLLMProvider extends OpenAICompatibleAgentLLMProvider {
  constructor(apiKey: string, modelName: string) {
    super({
      providerName: "openai",
      apiKey,
      modelName,
      chatUrl: OPENAI_CHAT_URL,
    });
  }
}

export function createAgentLLMProvider(): AgentLLMProvider {
  const provider = env.llmProvider.toLowerCase();

  if (provider === "groq") {
    if (!env.llmApiKey) {
      throw new AppError(
        "LLM_API_KEY or GROQ_API_KEY is required for Groq (free Llama). Get a key at https://console.groq.com/keys",
        500,
      );
    }
    const model = resolveGroqModel(env.llmModel);
    return new OpenAICompatibleAgentLLMProvider({
      providerName: "groq",
      apiKey: env.llmApiKey,
      modelName: model,
      chatUrl: GROQ_CHAT_URL,
    });
  }

  if (provider === "openai") {
    if (!env.llmApiKey) {
      throw new AppError("LLM_API_KEY is required for OpenAI agent", 500);
    }
    return new OpenAICompatibleAgentLLMProvider({
      providerName: "openai",
      apiKey: env.llmApiKey,
      modelName: env.llmModel,
      chatUrl: OPENAI_CHAT_URL,
    });
  }

  return new MockAgentLLMProvider();
}

function resolveGroqModel(configured: string | undefined): string {
  const model = configured?.trim();
  if (
    !model ||
    model === "gpt-4o-mini" ||
    model === "llama-3.3-70b-versatile" ||
    model === "llama-3.1-8b-instant" ||
    model === "llama-3.1-70b-versatile"
  ) {
    return DEFAULT_GROQ_MODEL;
  }
  return model;
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
