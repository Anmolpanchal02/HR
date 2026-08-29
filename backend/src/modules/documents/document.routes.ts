import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

import { maxDocumentSizeBytes } from "../../config/env.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  archiveDocument,
  downloadDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  uploadDocument,
} from "./document.controller.js";
import {
  documentIdParamsSchema,
  errorResponseSchema,
  listDocumentsQuerySchema,
  searchDocumentsQuerySchema,
} from "./document.schema.js";

const authenticated = [authenticate];
const canUpload = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR, UserRole.ENGINEER)];
const canArchive = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: {
      fileSize: maxDocumentSizeBytes(),
      files: 1,
    },
  });

  app.get(
    "/",
    {
      preHandler: authenticated,
      schema: {
        querystring: listDocumentsQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listDocuments,
  );

  app.get(
    "/search",
    {
      preHandler: authenticated,
      schema: {
        querystring: searchDocumentsQuerySchema,
        response: { 400: errorResponseSchema, 401: errorResponseSchema },
      },
    },
    searchDocuments,
  );

  app.post(
    "/",
    {
      preHandler: canUpload,
      schema: {
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    uploadDocument,
  );

  app.get(
    "/:id",
    {
      preHandler: authenticated,
      schema: {
        params: documentIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getDocument,
  );

  app.get(
    "/:id/download",
    {
      preHandler: authenticated,
      schema: {
        params: documentIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    downloadDocument,
  );

  app.patch(
    "/:id/archive",
    {
      preHandler: canArchive,
      schema: {
        params: documentIdParamsSchema,
        response: { 401: errorResponseSchema, 403: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    archiveDocument,
  );
}
