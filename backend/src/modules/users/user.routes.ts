import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "./user.types.js";
import {
  createMember,
  getMember,
  listMembers,
  updateMember,
  updateMemberStatus,
} from "./user.controller.js";
import {
  createMemberBodySchema,
  errorResponseSchema,
  listMembersResponseSchema,
  memberResponseSchema,
  updateMemberBodySchema,
  updateMemberStatusBodySchema,
  userIdParamsSchema,
} from "./user.schema.js";

const adminOrHr = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/",
    {
      preHandler: adminOrHr,
      schema: {
        response: {
          200: listMembersResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listMembers,
  );

  app.post(
    "/",
    {
      preHandler: adminOrHr,
      schema: {
        body: createMemberBodySchema,
        response: {
          201: memberResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createMember,
  );

  app.get(
    "/:id",
    {
      preHandler: adminOrHr,
      schema: {
        params: userIdParamsSchema,
        response: {
          200: memberResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getMember,
  );

  app.patch(
    "/:id",
    {
      preHandler: adminOrHr,
      schema: {
        params: userIdParamsSchema,
        body: updateMemberBodySchema,
        response: {
          200: memberResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateMember,
  );

  app.patch(
    "/:id/status",
    {
      preHandler: adminOrHr,
      schema: {
        params: userIdParamsSchema,
        body: updateMemberStatusBodySchema,
        response: {
          200: memberResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateMemberStatus,
  );
}
