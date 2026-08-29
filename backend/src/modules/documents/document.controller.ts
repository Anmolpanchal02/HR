import type { FastifyReply, FastifyRequest } from "fastify";

import { documentService } from "./document.service.js";
import type { DocumentQueryParams } from "./document.types.js";
import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";

function getAuthUser(request: FastifyRequest) {
  if (!request.authUser) throw new AppError("Unauthorized", 401);
  return request.authUser;
}

function handleError(error: unknown, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ success: false, message: error.message });
    return;
  }
  throw error;
}

export async function listDocuments(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const result = await documentService.listDocuments(
      getAuthUser(request),
      request.query as DocumentQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function getDocument(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const document = await documentService.getDocument(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ document }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function uploadDocument(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const file = await request.file();
    if (!file) {
      throw new AppError("File is required", 400);
    }

    const buffer = await file.toBuffer();
    const document = await documentService.uploadDocument(getAuthUser(request), {
      fileName: file.filename,
      mimeType: file.mimetype,
      buffer,
    });

    reply.status(201).send(successDataResponse({ document }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function downloadDocument(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const file = await documentService.downloadDocument(getAuthUser(request), id);

    reply
      .header("Content-Type", file.mimeType)
      .header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.fileName)}"`)
      .status(200)
      .send(file.buffer);
  } catch (error) {
    handleError(error, reply);
  }
}

export async function archiveDocument(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const document = await documentService.archiveDocument(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ document }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function searchDocuments(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { q } = request.query as { q: string };
    const result = await documentService.searchDocuments(getAuthUser(request), q);
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}
