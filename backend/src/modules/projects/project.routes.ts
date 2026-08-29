import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "./project.controller.js";
import {
  createProjectBodySchema,
  errorResponseSchema,
  listProjectsQuerySchema,
  projectIdParamsSchema,
  updateProjectBodySchema,
} from "./project.schema.js";

const authenticated = [authenticate];
const canCreateProject = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR, UserRole.ENGINEER)];

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/",
    {
      preHandler: authenticated,
      schema: {
        querystring: listProjectsQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listProjects,
  );

  app.post(
    "/",
    {
      preHandler: canCreateProject,
      schema: {
        body: createProjectBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createProject,
  );

  app.get(
    "/:id",
    {
      preHandler: authenticated,
      schema: {
        params: projectIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getProject,
  );

  app.patch(
    "/:id",
    {
      preHandler: canCreateProject,
      schema: {
        params: projectIdParamsSchema,
        body: updateProjectBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateProject,
  );

  app.patch(
    "/:id/archive",
    {
      preHandler: canCreateProject,
      schema: {
        params: projectIdParamsSchema,
        response: { 401: errorResponseSchema, 403: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    archiveProject,
  );
}
