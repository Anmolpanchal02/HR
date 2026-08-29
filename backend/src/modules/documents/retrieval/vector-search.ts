import { env } from "../../../config/env.js";
import type { DocumentSearchResultItem } from "../document.types.js";

export interface VectorSearchParams {
  organizationId: string;
  queryEmbedding: number[];
  topK: number;
}

export interface VectorSearchProvider {
  search(params: VectorSearchParams): Promise<DocumentSearchResultItem[]>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i += 1) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dot += aVal * bVal;
    magA += aVal * aVal;
    magB += bVal * bVal;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Local development vector search: loads org-scoped chunks and ranks by cosine similarity.
 * Suitable for dev/test. Production should use MongoDB Atlas Vector Search.
 */
export class LocalVectorSearchProvider implements VectorSearchProvider {
  async search(params: VectorSearchParams): Promise<DocumentSearchResultItem[]> {
    const { DocumentChunkModel } = await import("../document-chunk.model.js");
    const { DocumentModel } = await import("../document.model.js");
    const { DocumentStatus } = await import("../document.types.js");

    const readyDocuments = await DocumentModel.find({
      organizationId: params.organizationId,
      status: DocumentStatus.READY,
    }).select("_id name");

    const readyIds = readyDocuments.map((doc) => doc._id);
    if (readyIds.length === 0) return [];

    const chunks = await DocumentChunkModel.find({
      organizationId: params.organizationId,
      documentId: { $in: readyIds },
    }).limit(5000);

    const docNameMap = new Map(
      readyDocuments.map((doc) => [doc._id.toString(), doc.name]),
    );

    const ranked = chunks
      .map((chunk) => ({
        documentId: chunk.documentId.toString(),
        documentName: docNameMap.get(chunk.documentId.toString()) ?? "Unknown",
        chunkId: chunk._id.toString(),
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        score: cosineSimilarity(params.queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, params.topK);

    return ranked;
  }
}

/**
 * Atlas Vector Search via $vectorSearch aggregation.
 * Requires a vector index on DocumentChunk.embedding with organizationId filter field.
 */
export class AtlasVectorSearchProvider implements VectorSearchProvider {
  constructor(private readonly indexName: string) {}

  async search(params: VectorSearchParams): Promise<DocumentSearchResultItem[]> {
    const { DocumentChunkModel } = await import("../document-chunk.model.js");
    const { DocumentModel } = await import("../document.model.js");
    const { DocumentStatus } = await import("../document.types.js");

    const pipeline = [
      {
        $vectorSearch: {
          index: this.indexName,
          path: "embedding",
          queryVector: params.queryEmbedding,
          numCandidates: Math.max(params.topK * 20, 100),
          limit: params.topK,
          filter: {
            organizationId: params.organizationId,
          },
        },
      },
      {
        $lookup: {
          from: "documents",
          localField: "documentId",
          foreignField: "_id",
          as: "document",
        },
      },
      { $unwind: "$document" },
      {
        $match: {
          "document.status": DocumentStatus.READY,
          "document.organizationId": params.organizationId,
        },
      },
      {
        $project: {
          documentId: { $toString: "$documentId" },
          documentName: "$document.name",
          chunkId: { $toString: "$_id" },
          content: 1,
          chunkIndex: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await DocumentChunkModel.aggregate(pipeline);
    return results as DocumentSearchResultItem[];
  }
}

export function createVectorSearchProvider(): VectorSearchProvider {
  if (env.vectorSearchMode === "atlas") {
    return new AtlasVectorSearchProvider(env.atlasVectorIndexName);
  }

  return new LocalVectorSearchProvider();
}

let cachedVectorSearch: VectorSearchProvider | null = null;

export function getVectorSearchProvider(): VectorSearchProvider {
  if (!cachedVectorSearch) {
    cachedVectorSearch = createVectorSearchProvider();
  }
  return cachedVectorSearch;
}

export function resetVectorSearchProviderForTests(): void {
  cachedVectorSearch = null;
}
