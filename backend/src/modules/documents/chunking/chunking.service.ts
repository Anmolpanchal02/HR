import { env } from "../../../config/env.js";

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

/**
 * Character-based chunking with overlap.
 * Trade-off: characters are fast and deterministic; token-based chunking aligns
 * better with LLM context windows but requires a tokenizer dependency.
 */
export class ChunkingService {
  private readonly chunkSize: number;
  private readonly overlap: number;

  constructor(
    chunkSize = env.documentChunkSize,
    overlap = env.documentChunkOverlap,
  ) {
    this.chunkSize = chunkSize;
    this.overlap = Math.min(overlap, chunkSize - 1);
  }

  chunkText(text: string): TextChunk[] {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) return [];

    const chunks: TextChunk[] = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < normalized.length) {
      const end = Math.min(start + this.chunkSize, normalized.length);
      const content = normalized.slice(start, end).trim();
      if (content) {
        chunks.push({
          chunkIndex,
          content,
          tokenCount: Math.ceil(content.length / 4),
        });
        chunkIndex += 1;
      }

      if (end >= normalized.length) break;
      start = end - this.overlap;
    }

    return chunks;
  }
}

export const chunkingService = new ChunkingService();
