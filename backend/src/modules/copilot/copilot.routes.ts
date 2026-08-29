import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import {
  chat,
  deleteConversationHandler,
  getConversation,
  listConversations,
} from "./copilot.controller.js";
import {
  chatBodySchema,
  conversationIdParamsSchema,
  errorResponseSchema,
} from "./copilot.schema.js";

const authenticated = [authenticate];

export async function copilotRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/chat",
    {
      preHandler: authenticated,
      schema: {
        body: chatBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
        },
      },
    },
    chat,
  );

  app.get(
    "/conversations",
    {
      preHandler: authenticated,
      schema: { response: { 401: errorResponseSchema } },
    },
    listConversations,
  );

  app.get(
    "/conversations/:id",
    {
      preHandler: authenticated,
      schema: {
        params: conversationIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getConversation,
  );

  app.delete(
    "/conversations/:id",
    {
      preHandler: authenticated,
      schema: {
        params: conversationIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    deleteConversationHandler,
  );
}
