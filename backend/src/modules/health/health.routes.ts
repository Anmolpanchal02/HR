import type { FastifyInstance } from "fastify";

import { getHealth } from "./health.controller.js";
import { healthResponseSchema } from "./health.schema.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    getHealth,
  );
}
