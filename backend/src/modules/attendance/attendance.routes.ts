import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  listAllAttendance,
  listMyAttendance,
  listTeamAttendance,
} from "./attendance.controller.js";
import { errorResponseSchema, listAttendanceQuerySchema } from "./attendance.schema.js";

const authenticated = [authenticate];
const adminOrHr = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];

export async function attendanceRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/today",
    {
      preHandler: authenticated,
      schema: { response: { 401: errorResponseSchema } },
    },
    getTodayAttendance,
  );

  app.post(
    "/check-in",
    {
      preHandler: authenticated,
      schema: {
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    checkIn,
  );

  app.post(
    "/check-out",
    {
      preHandler: authenticated,
      schema: {
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    checkOut,
  );

  app.get(
    "/me",
    {
      preHandler: authenticated,
      schema: {
        querystring: listAttendanceQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listMyAttendance,
  );

  app.get(
    "/team",
    {
      preHandler: authenticated,
      schema: {
        querystring: listAttendanceQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listTeamAttendance,
  );

  app.get(
    "/",
    {
      preHandler: adminOrHr,
      schema: {
        querystring: listAttendanceQuerySchema,
        response: { 401: errorResponseSchema, 403: errorResponseSchema },
      },
    },
    listAllAttendance,
  );
}
