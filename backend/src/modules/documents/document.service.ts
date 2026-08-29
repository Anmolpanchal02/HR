import { createHash } from "node:crypto";
import mongoose from "mongoose";
import path from "node:path";

import { maxDocumentSizeBytes, env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { AuthContext } from "../users/user.types.js";
import { documentProcessorService } from "./document-processor.service.js";
import {
  createDocumentRecord,
  findDocumentByIdAndOrganization,
  listDocumentsByOrganization,
  updateDocumentByIdAndOrganization,
  type CreateDocumentInput,
} from "./document.repository.js";
import type { IDocument } from "./document.model.js";
import {
  canArchiveDocuments,
  canUploadDocuments,
  DocumentStatus,
  type DocumentDetail,
  type DocumentListItem,
  type DocumentListResult,
  type DocumentQueryParams,
  type DocumentSearchResult,
} from "./document.types.js";
import { detectMimeType as detectMimeFromFile } from "./processors/file-type.js";
import { retrieveRelevantChunks } from "./retrieval/retriever.js";
import { fileStorage } from "./storage/local.storage.js";

export interface UploadDocumentInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

function toListItem(
  document: IDocument,
  uploaderName?: string,
): DocumentListItem {
  return {
    id: document._id.toString(),
    name: document.name,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    version: document.version,
    uploadedBy: uploaderName
      ? { id: document.uploadedBy.toString(), name: uploaderName }
      : undefined,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function toDetail(document: IDocument, uploaderName?: string): DocumentDetail {
  return {
    ...toListItem(document, uploaderName),
    checksum: document.checksum,
    metadata: document.metadata,
    processingError: document.processingError,
  };
}

async function resolveUploaderName(uploadedBy: mongoose.Types.ObjectId): Promise<string | undefined> {
  const { User: UserModel } = await import("../users/user.model.js");
  const user = await UserModel.findById(uploadedBy).select("name");
  return user?.name;
}

export class DocumentService {
  async listDocuments(
    authUser: AuthContext,
    params: DocumentQueryParams,
  ): Promise<DocumentListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { documents, total } = await listDocumentsByOrganization(
      authUser.organizationId,
      params,
    );

    const uploaderIds = [...new Set(documents.map((d) => d.uploadedBy.toString()))];
    const { User: UserModel } = await import("../users/user.model.js");
    const uploaders = await UserModel.find({ _id: { $in: uploaderIds } }).select("name");
    const uploaderMap = new Map(uploaders.map((u) => [u._id.toString(), u.name]));

    return {
      documents: documents.map((doc) =>
        toListItem(doc, uploaderMap.get(doc.uploadedBy.toString())),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getDocument(authUser: AuthContext, documentId: string): Promise<DocumentDetail> {
    const document = await findDocumentByIdAndOrganization(documentId, authUser.organizationId);
    if (!document) {
      throw new AppError("Document not found", 404);
    }
    const uploaderName = await resolveUploaderName(document.uploadedBy);
    return toDetail(document, uploaderName);
  }

  async uploadDocument(
    authUser: AuthContext,
    input: UploadDocumentInput,
  ): Promise<DocumentDetail> {
    if (!canUploadDocuments(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    if (input.buffer.length > maxDocumentSizeBytes()) {
      throw new AppError(`File exceeds maximum size of ${env.maxDocumentSizeMb} MB`, 400);
    }

    if (input.buffer.length === 0) {
      throw new AppError("Empty file", 400);
    }

    const mimeType = detectMimeFromFile(input.fileName, input.mimeType);
    const checksum = createHash("sha256").update(input.buffer).digest("hex");
    const displayName = path.basename(input.fileName);

    const stored = await fileStorage.save({
      organizationId: authUser.organizationId,
      fileName: input.fileName,
      buffer: input.buffer,
    });

    const record: CreateDocumentInput = {
      organizationId: new mongoose.Types.ObjectId(authUser.organizationId),
      uploadedBy: new mongoose.Types.ObjectId(authUser.userId),
      name: displayName,
      originalName: displayName,
      mimeType,
      size: stored.size,
      storageKey: stored.storageKey,
      status: DocumentStatus.UPLOADED,
      version: 1,
      checksum,
    };

    const document = await createDocumentRecord(record);

    await documentProcessorService.processDocument({
      documentId: document._id.toString(),
      organizationId: authUser.organizationId,
      storageKey: document.storageKey,
      mimeType,
    });

    const refreshed = await findDocumentByIdAndOrganization(
      document._id.toString(),
      authUser.organizationId,
    );
    if (!refreshed) {
      throw new AppError("Document not found after upload", 500);
    }

    const uploaderName = await resolveUploaderName(refreshed.uploadedBy);
    return toDetail(refreshed, uploaderName);
  }

  async downloadDocument(
    authUser: AuthContext,
    documentId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const document = await findDocumentByIdAndOrganization(documentId, authUser.organizationId);
    if (!document || document.status === DocumentStatus.ARCHIVED) {
      throw new AppError("Document not found", 404);
    }

    const buffer = await fileStorage.read(document.storageKey);
    return {
      buffer,
      fileName: document.originalName,
      mimeType: document.mimeType,
    };
  }

  async archiveDocument(authUser: AuthContext, documentId: string): Promise<DocumentDetail> {
    if (!canArchiveDocuments(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const document = await findDocumentByIdAndOrganization(documentId, authUser.organizationId);
    if (!document) {
      throw new AppError("Document not found", 404);
    }

    const updated = await updateDocumentByIdAndOrganization(
      documentId,
      authUser.organizationId,
      { status: DocumentStatus.ARCHIVED },
    );
    if (!updated) {
      throw new AppError("Document not found", 404);
    }

    const uploaderName = await resolveUploaderName(updated.uploadedBy);
    return toDetail(updated, uploaderName);
  }

  async searchDocuments(authUser: AuthContext, query: string): Promise<DocumentSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new AppError("Search query is required", 400);
    }

    const results = await retrieveRelevantChunks({
      organizationId: authUser.organizationId,
      query: trimmed,
      topK: env.vectorSearchTopK,
    });

    return { results, query: trimmed };
  }
}

export const documentService = new DocumentService();

export const documentServiceApi = {
  searchDocuments: (authUser: AuthContext, query: string) =>
    documentService.searchDocuments(authUser, query),
  getDocument: (authUser: AuthContext, id: string) => documentService.getDocument(authUser, id),
  listDocuments: (authUser: AuthContext, params: DocumentQueryParams) =>
    documentService.listDocuments(authUser, params),
};
