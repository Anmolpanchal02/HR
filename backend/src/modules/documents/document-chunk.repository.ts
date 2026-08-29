import type { Types } from "mongoose";

import { DocumentChunkModel } from "./document-chunk.model.js";

export interface CreateDocumentChunkInput {
  organizationId: Types.ObjectId;
  documentId: Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[];
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export async function createDocumentChunks(
  chunks: CreateDocumentChunkInput[],
): Promise<void> {
  if (chunks.length === 0) return;
  await DocumentChunkModel.insertMany(chunks);
}

export async function deleteChunksByDocument(
  documentId: string,
  organizationId: string,
): Promise<void> {
  await DocumentChunkModel.deleteMany({ documentId, organizationId });
}

export async function countChunksByDocument(
  documentId: string,
  organizationId: string,
): Promise<number> {
  return DocumentChunkModel.countDocuments({ documentId, organizationId });
}
