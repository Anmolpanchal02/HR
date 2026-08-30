import { documentServiceApi } from "../../../documents/document.service.js";
import { env } from "../../../../config/env.js";
import {
  filterChunksByMinScore,
  retrieveRelevantChunks,
} from "../../../documents/retrieval/retriever.js";
import { chunksToCitations } from "../../retrieval/context-builder.js";
import type { ToolContext, ToolResult } from "../tool.types.js";
import { sanitizeToolInput } from "../tool.types.js";
import { toolFailure, toolFailureFromError, toolSuccess } from "../tool-result.js";

function toAuthContext(context: ToolContext) {
  return {
    userId: context.userId,
    organizationId: context.organizationId,
    role: context.role,
  };
}

export const searchDocumentsTool = {
  definition: {
    name: "search_documents",
    description:
      "Semantic search across organization documents (policies, handbooks). Use for questions about content.",
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

export const listDocumentsTool = {
  definition: {
    name: "list_documents",
    description: "List uploaded documents by name/status (metadata, not content search)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter by document name" },
        status: {
          type: "string",
          description: "Filter by processing status if known (e.g. READY, UPLOADED)",
        },
      },
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    const status = typeof args.status === "string" ? args.status.trim() : undefined;

    try {
      const result = await documentServiceApi.listDocuments(toAuthContext(context), {
        search: query || undefined,
        status: status as never,
        limit: 15,
      });
      const documents = result.documents.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        mimeType: d.mimeType,
        size: d.size,
        uploadedBy: d.uploadedBy?.name,
        createdAt: d.createdAt,
      }));
      return toolSuccess(
        { documents, count: documents.length },
        documents.length
          ? `Found ${documents.length} document(s)`
          : "No documents found",
      );
    } catch (error) {
      return toolFailureFromError(error, "List documents failed");
    }
  },
};

export const getDocumentTool = {
  definition: {
    name: "get_document",
    description: "Get document metadata by ID (not file contents — use search_documents for content)",
    inputSchema: {
      type: "object",
      properties: { documentId: { type: "string" } },
      required: ["documentId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const documentId = typeof args.documentId === "string" ? args.documentId : "";
    if (!documentId) return toolFailure("VALIDATION_ERROR", "documentId is required");

    try {
      const document = await documentServiceApi.getDocument(toAuthContext(context), documentId);
      return toolSuccess(
        {
          id: document.id,
          name: document.name,
          status: document.status,
          mimeType: document.mimeType,
          size: document.size,
          uploadedBy: document.uploadedBy?.name,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
        `Retrieved document ${document.name}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Document not found");
    }
  },
};
