import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateMemberInput,
  UpdateMemberInput,
  UpdateMemberStatusInput,
} from "./user.service.js";
import { userService } from "./user.service.js";
import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";

function getAuthUser(request: FastifyRequest) {
  if (!request.authUser) {
    throw new AppError("Unauthorized", 401);
  }
  return request.authUser;
}

function handleServiceError(error: unknown, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ success: false, message: error.message });
    return;
  }
  throw error;
}

export async function listMembers(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const users = await userService.listMembers(getAuthUser(request));
    reply.status(200).send(successDataResponse({ users }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function getMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const user = await userService.getMember(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ user }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function createMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const body = request.body as CreateMemberInput;
    const user = await userService.createMember(getAuthUser(request), body);
    reply.status(201).send(successDataResponse({ user }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function updateMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateMemberInput;
    const user = await userService.updateMember(getAuthUser(request), id, body);
    reply.status(200).send(successDataResponse({ user }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function updateMemberStatus(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateMemberStatusInput;
    const user = await userService.updateMemberStatus(getAuthUser(request), id, body);
    reply.status(200).send(successDataResponse({ user }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}
