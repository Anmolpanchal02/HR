import { env } from "../../../config/env.js";
import type { DocumentSearchResultItem } from "../document.types.js";
import { getEmbeddingProvider } from "../embeddings/openai.embedding.js";
import { getVectorSearchProvider } from "./vector-search.js";

export interface RetrieveChunksParams {
  organizationId: string;
  query: string;
  topK?: number;
}

/**
 * Reusable RAG retrieval — used by document search API and Copilot.
 * Does NOT duplicate vector-search logic.
 */
export async function retrieveRelevantChunks(
  params: RetrieveChunksParams,
): Promise<DocumentSearchResultItem[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  const embeddingProvider = getEmbeddingProvider();
  const queryEmbedding = await embeddingProvider.generateEmbedding(trimmed);
  const vectorSearch = getVectorSearchProvider();

  return vectorSearch.search({
    organizationId: params.organizationId,
    queryEmbedding,
    topK: params.topK ?? env.ragTopK,
  });
}

export function filterChunksByMinScore(
  chunks: DocumentSearchResultItem[],
  minScore: number,
): DocumentSearchResultItem[] {
  return chunks.filter((chunk) => chunk.score >= minScore);
}
