import { env } from "../../../config/env.js";
import type { EmbeddingProvider } from "./embedding.provider.js";

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

/**
 * Deterministic local embedding for development/tests.
 * Uses character/word hashing — not LLM-quality, but supports real cosine similarity.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;

  constructor(dimensions = env.embeddingDimensions) {
    this.dimensions = dimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();
    if (!normalized) return vector;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i += 1) {
        hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
      }
      const index = hash % this.dimensions;
      const secondary = (index + 7) % this.dimensions;
      vector[index] = (vector[index] ?? 0) + 1;
      vector[secondary] = (vector[secondary] ?? 0) + 0.5;
    }

    for (let i = 0; i < normalized.length; i += 1) {
      const charIndex = normalized.charCodeAt(i) % this.dimensions;
      vector[charIndex] = (vector[charIndex] ?? 0) + 0.1;
    }

    return normalize(vector);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }
}

export const mockEmbeddingProvider = new MockEmbeddingProvider();
