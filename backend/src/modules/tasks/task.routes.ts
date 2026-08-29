import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import { createTask, getTask, listTasks, updateTask } from "./task.controller.js";
import {
  createTaskBodySchema,
  errorResponseSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
} from "./task.schema.js";

const authenticated = [authenticate];
const canCreateTask = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR, UserRole.ENGINEER)];

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/",
    {
      preHandler: authenticated,
      schema: {
        querystring: listTasksQuerySchema,
        response: { 401: errorResponseSchema },
      },
    },
    listTasks,
  );

  app.post(
    "/",
    {
      preHandler: canCreateTask,
      schema: {
        body: createTaskBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createTask,
  );

  app.get(
    "/:id",
    {
      preHandler: authenticated,
      schema: {
        params: taskIdParamsSchema,
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getTask,
  );

  app.patch(
    "/:id",
    {
      preHandler: authenticated,
      schema: {
        params: taskIdParamsSchema,
        body: updateTaskBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateTask,
  );
}
