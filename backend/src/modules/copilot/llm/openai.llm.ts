import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import type { LLMGenerateInput, LLMProvider, LLMResponse } from "./llm.provider.js";
import { MockLLMProvider } from "./mock.llm.js";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

export class OpenAICompatibleLLMProvider implements LLMProvider {
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

  async generateAnswer(input: LLMGenerateInput): Promise<LLMResponse> {
    const response = await fetch(this.chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    const body = (await response.json()) as OpenAIChatResponse;

    if (!response.ok) {
      const detail = body.error?.message ?? `HTTP ${response.status}`;
      throw new AppError(`AI answer generation failed (${this.providerName}): ${detail}`, 502);
    }

    const content = body.choices[0]?.message?.content?.trim() ?? "";

    return {
      content,
      usage: {
        inputTokens: body.usage?.prompt_tokens ?? null,
        outputTokens: body.usage?.completion_tokens ?? null,
        totalTokens: body.usage?.total_tokens ?? null,
      },
    };
  }
}

export class OpenAILLMProvider extends OpenAICompatibleLLMProvider {
  constructor(apiKey: string, modelName: string) {
    super({
      providerName: "openai",
      apiKey,
      modelName,
      chatUrl: OPENAI_CHAT_URL,
    });
  }
}

export function createLLMProvider(): LLMProvider {
  const provider = env.llmProvider.toLowerCase();

  if (provider === "groq") {
    if (!env.llmApiKey) {
      throw new AppError(
        "LLM_API_KEY or GROQ_API_KEY is required for Groq. Get a key at https://console.groq.com/keys",
        500,
      );
    }
    const model = resolveGroqModel(env.llmModel);
    return new OpenAICompatibleLLMProvider({
      providerName: "groq",
      apiKey: env.llmApiKey,
      modelName: model,
      chatUrl: GROQ_CHAT_URL,
    });
  }

  if (provider === "openai") {
    if (!env.llmApiKey) {
      throw new AppError("LLM_API_KEY is required for OpenAI provider", 500);
    }
    return new OpenAICompatibleLLMProvider({
      providerName: "openai",
      apiKey: env.llmApiKey,
      modelName: env.llmModel,
      chatUrl: OPENAI_CHAT_URL,
    });
  }

  return new MockLLMProvider();
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

let cachedLLM: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!cachedLLM) {
    cachedLLM = createLLMProvider();
  }
  return cachedLLM;
}

export function resetLLMProviderForTests(): void {
  cachedLLM = null;
}
