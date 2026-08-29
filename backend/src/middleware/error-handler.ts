import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { env } from "../config/env.js";
import { errorResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(errorResponse(error.message));
    return;
  }

  if (error.validation) {
    reply.status(400).send(errorResponse("Validation error"));
    return;
  }

  if (!env.isProduction) {
    console.error(error);
  }

  reply.status(error.statusCode ?? 500).send(errorResponse("Something went wrong"));
}

export function notFoundHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  reply.status(404).send(errorResponse("Route not found"));
}
