import { env } from "../../../../config/env.js";
import {
  filterChunksByMinScore,
  retrieveRelevantChunks,
} from "../../../documents/retrieval/retriever.js";
import { chunksToCitations } from "../../retrieval/context-builder.js";
import type { ToolContext, ToolResult } from "../tool.types.js";
import { sanitizeToolInput } from "../tool.types.js";
import { toolFailure, toolSuccess } from "../tool-result.js";

export const searchDocumentsTool = {
  definition: {
    name: "search_documents",
    description: "Search organization documents for relevant policy or handbook content",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) return toolFailure("VALIDATION_ERROR", "query is required");

    const chunks = filterChunksByMinScore(
      await retrieveRelevantChunks({
        organizationId: context.organizationId,
        query,
        topK: env.ragTopK,
      }),
      env.ragMinScore,
    );

    const citations = chunksToCitations(chunks);

    return toolSuccess(
      {
        results: chunks.map((c) => ({
          documentId: c.documentId,
          documentName: c.documentName,
          chunkId: c.chunkId,
          content: c.content.slice(0, 500),
          score: c.score,
        })),
        count: chunks.length,
        citations,
      },
      chunks.length
        ? `Found ${chunks.length} relevant document excerpt(s)`
        : "No relevant documents found",
    );
  },
};
