import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import type { EmbeddingProvider } from "./embedding.provider.js";
import { MockEmbeddingProvider } from "./mock.embedding.js";

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = env.embeddingDimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text]);
    if (!embedding) {
      throw new AppError("Embedding generation failed", 502);
    }
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new AppError("Embedding generation failed", 502);
    }

    const body = (await response.json()) as OpenAIEmbeddingResponse;
    return body.data.map((item) => item.embedding);
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = env.embeddingProvider.toLowerCase();

  if (provider === "openai") {
    if (!env.embeddingApiKey) {
      throw new AppError("EMBEDDING_API_KEY is required for OpenAI embeddings", 500);
    }
    return new OpenAIEmbeddingProvider(env.embeddingApiKey, env.embeddingModel);
  }

  return new MockEmbeddingProvider();
}

let cachedProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!cachedProvider) {
    cachedProvider = createEmbeddingProvider();
  }
  return cachedProvider;
}

export function resetEmbeddingProviderForTests(): void {
  cachedProvider = null;
}
