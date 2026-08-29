import type { FastifyReply, FastifyRequest } from "fastify";

import { authService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";
import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await authService.register(request.body);
    reply.status(201).send(successDataResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ success: false, message: error.message });
      return;
    }
    throw error;
  }
}

export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await authService.login(request.body);
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ success: false, message: error.message });
      return;
    }
    throw error;
  }
}

export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    if (!request.authUser) {
      reply.status(401).send({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await authService.getCurrentUser(request.authUser.userId);
    reply.status(200).send(successDataResponse(user));
  } catch (error) {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ success: false, message: error.message });
      return;
    }
    throw error;
  }
}

export async function logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.status(200).send(
    successDataResponse({
      message: "Logged out successfully",
    }),
  );
}
