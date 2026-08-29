import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import type { LLMGenerateInput, LLMProvider, LLMResponse } from "./llm.provider.js";
import { MockLLMProvider } from "./mock.llm.js";

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class OpenAILLMProvider implements LLMProvider {
  readonly providerName = "openai";
  readonly modelName: string;
  private readonly apiKey: string;

  constructor(apiKey: string, modelName: string) {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateAnswer(input: LLMGenerateInput): Promise<LLMResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!response.ok) {
      throw new AppError("AI answer generation failed", 502);
    }

    const body = (await response.json()) as OpenAIChatResponse;
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

export function createLLMProvider(): LLMProvider {
  const provider = env.llmProvider.toLowerCase();

  if (provider === "openai") {
    if (!env.llmApiKey) {
      throw new AppError("LLM_API_KEY is required for OpenAI provider", 500);
    }
    return new OpenAILLMProvider(env.llmApiKey, env.llmModel);
  }

  return new MockLLMProvider();
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
