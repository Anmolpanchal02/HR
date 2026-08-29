import { env } from "../../../config/env.js";
import { INSUFFICIENT_CONTEXT_RESPONSE } from "../copilot.types.js";
import type { LLMGenerateInput, LLMProvider, LLMResponse } from "./llm.provider.js";

/**
 * Deterministic mock LLM for local dev/tests.
 * Summarizes retrieved context without external API calls.
 */
export class MockLLMProvider implements LLMProvider {
  readonly providerName = "mock";
  readonly modelName: string;

  constructor(modelName = env.llmModel) {
    this.modelName = modelName;
  }

  async generateAnswer(input: LLMGenerateInput): Promise<LLMResponse> {
    const contextMatch = input.userPrompt.match(
      /RETRIEVED DOCUMENT CONTENT[\s\S]*?:\n([\s\S]*)/,
    );
    const context = contextMatch?.[1]?.trim() ?? "";
    const questionMatch = input.userPrompt.match(/USER QUESTION:\n([\s\S]*?)\n\nRETRIEVED/);
    const question = questionMatch?.[1]?.trim() ?? input.userPrompt;

    if (!context || context === "(no relevant content retrieved)") {
      return {
        content: INSUFFICIENT_CONTEXT_RESPONSE,
        usage: { inputTokens: null, outputTokens: null, totalTokens: null },
      };
    }

    const contentBlocks = [...context.matchAll(/Content:\n([\s\S]*?)(?=\n\nSOURCE|\n*$)/g)]
      .map((match) => match[1]?.trim())
      .filter(Boolean);

    const relevant = contentBlocks.slice(0, 2).join(" ");
    const sentences = relevant.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
    const answer =
      sentences.slice(0, 2).join(" ") ||
      "Based on the available documents, here is what I found: " + relevant.slice(0, 400);

    return {
      content: answer.trim(),
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    };
  }
}
