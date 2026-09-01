import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  createEmployee,
  getDirectReports,
  getEmployee,
  getOrgChart,
  listEmployees,
  resetEmployeePassword,
  updateEmployee,
  updateEmployeeStatus,
} from "./employee.controller.js";
import {
  createEmployeeBodySchema,
  employeeIdParamsSchema,
  errorResponseSchema,
  listEmployeesQuerySchema,
  resetEmployeePasswordBodySchema,
  updateEmployeeBodySchema,
  updateEmployeeStatusBodySchema,
} from "./employee.schema.js";

const adminOrHr = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];
const authenticated = [authenticate];

export async function employeeRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/",
    {
      preHandler: adminOrHr,
      schema: {
        querystring: listEmployeesQuerySchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listEmployees,
  );

  app.post(
    "/",
    {
      preHandler: adminOrHr,
      schema: {
        body: createEmployeeBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createEmployee,
  );

  app.post(
    "/:id/reset-password",
    {
      preHandler: adminOrHr,
      schema: {
        params: employeeIdParamsSchema,
        body: resetEmployeePasswordBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    resetEmployeePassword,
  );

  app.get(
    "/org-chart",
    {
      preHandler: authenticated,
      schema: {
        response: { 401: errorResponseSchema },
      },
    },
    getOrgChart,
  );

  app.get(
    "/:id/reports",
    {
      preHandler: authenticated,
      schema: {
        params: employeeIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getDirectReports,
  );

  app.get(
    "/:id",
    {
      preHandler: authenticated,
      schema: {
        params: employeeIdParamsSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getEmployee,
  );

  app.patch(
    "/:id",
    {
      preHandler: adminOrHr,
      schema: {
        params: employeeIdParamsSchema,
        body: updateEmployeeBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateEmployee,
  );

  app.patch(
    "/:id/status",
    {
      preHandler: adminOrHr,
      schema: {
        params: employeeIdParamsSchema,
        body: updateEmployeeStatusBodySchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateEmployeeStatus,
  );
}
