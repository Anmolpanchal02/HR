import type { FastifyReply, FastifyRequest } from "fastify";

import type { HealthResponse } from "./health.schema.js";

export async function getHealth(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const response: HealthResponse = {
    success: true,
    message: "AI HR Copilot API is running",
    timestamp: new Date().toISOString(),
  };

  reply.status(200).send(response);
}
