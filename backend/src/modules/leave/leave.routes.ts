import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  listAllLeaveRequests,
  listMyLeaveRequests,
  listPendingLeaveRequests,
  rejectLeaveRequest,
} from "./leave.controller.js";
import {
  createLeaveRequestBodySchema,
  errorResponseSchema,
  leaveIdParamsSchema,
  listLeaveQuerySchema,
  rejectLeaveRequestBodySchema,
} from "./leave.schema.js";

const authenticated = [authenticate];
const adminOrHr = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];

export async function leaveRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/requests",
    {
      preHandler: authenticated,
      schema: {
        body: createLeaveRequestBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    createLeaveRequest,
  );

  app.get(
    "/requests/me",
    {
      preHandler: authenticated,
      schema: {
        querystring: listLeaveQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listMyLeaveRequests,
  );

  app.get(
    "/requests/pending",
    {
      preHandler: authenticated,
      schema: {
        querystring: listLeaveQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listPendingLeaveRequests,
  );

  app.get(
    "/requests",
    {
      preHandler: adminOrHr,
      schema: {
        querystring: listLeaveQuerySchema,
        response: { 401: errorResponseSchema, 403: errorResponseSchema },
      },
    },
    listAllLeaveRequests,
  );

  app.patch(
    "/requests/:id/approve",
    {
      preHandler: authenticated,
      schema: {
        params: leaveIdParamsSchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    approveLeaveRequest,
  );

  app.patch(
    "/requests/:id/reject",
    {
      preHandler: authenticated,
      schema: {
        params: leaveIdParamsSchema,
        body: rejectLeaveRequestBodySchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    rejectLeaveRequest,
  );

  app.patch(
    "/requests/:id/cancel",
    {
      preHandler: authenticated,
      schema: {
        params: leaveIdParamsSchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    cancelLeaveRequest,
  );
}
