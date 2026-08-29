import mongoose from "mongoose";

import { chunkingService } from "./chunking/chunking.service.js";
import { getEmbeddingProvider } from "./embeddings/openai.embedding.js";
import { extractTextFromFile } from "./processors/index.js";
import {
  createDocumentChunks,
  deleteChunksByDocument,
} from "./document-chunk.repository.js";
import { updateDocumentByIdAndOrganization } from "./document.repository.js";
import { DocumentStatus, type AllowedMimeType } from "./document.types.js";
import { fileStorage } from "./storage/local.storage.js";
import { AppError } from "../../utils/app-error.js";

export class DocumentProcessorService {
  /**
   * Synchronous processing pipeline.
   * Later this method can be invoked from a background worker without changes to core logic.
   */
  async processDocument(params: {
    documentId: string;
    organizationId: string;
    storageKey: string;
    mimeType: AllowedMimeType;
  }): Promise<void> {
    await updateDocumentByIdAndOrganization(params.documentId, params.organizationId, {
      status: DocumentStatus.PROCESSING,
      processingError: undefined,
    });

    try {
      const buffer = await fileStorage.read(params.storageKey);
      const text = (await extractTextFromFile(buffer, params.mimeType)).trim();

      if (!text) {
        throw new AppError("Document contains no extractable text", 400);
      }

      const chunks = chunkingService.chunkText(text);
      if (chunks.length === 0) {
        throw new AppError("Document contains no extractable text", 400);
      }

      const embeddingProvider = getEmbeddingProvider();
      const embeddings = await embeddingProvider.generateEmbeddings(
        chunks.map((chunk) => chunk.content),
      );

      await deleteChunksByDocument(params.documentId, params.organizationId);

      await createDocumentChunks(
        chunks.map((chunk, index) => {
          const embedding = embeddings[index];
          if (!embedding) {
            throw new AppError("Embedding generation failed", 502);
          }
          return {
            organizationId: new mongoose.Types.ObjectId(params.organizationId),
            documentId: new mongoose.Types.ObjectId(params.documentId),
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding,
            tokenCount: chunk.tokenCount,
            metadata: {
              charCount: chunk.content.length,
            },
          };
        }),
      );

      await updateDocumentByIdAndOrganization(params.documentId, params.organizationId, {
        status: DocumentStatus.READY,
        processingError: undefined,
        metadata: {
          chunkCount: chunks.length,
          extractedCharCount: text.length,
        },
      });
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : "Document processing failed";

      await updateDocumentByIdAndOrganization(params.documentId, params.organizationId, {
        status: DocumentStatus.FAILED,
        processingError: message.slice(0, 500),
      });
    }
  }
}

export const documentProcessorService = new DocumentProcessorService();
