import type { FastifyReply, FastifyRequest } from "fastify";

import { copilotService } from "./copilot.service.js";
import type { ChatRequest } from "./copilot.types.js";
import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";

function getAuthUser(request: FastifyRequest) {
  if (!request.authUser) throw new AppError("Unauthorized", 401);
  return request.authUser;
}

function handleError(error: unknown, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ success: false, message: error.message });
    return;
  }
  throw error;
}

export async function chat(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const result = await copilotService.chat(getAuthUser(request), request.body as ChatRequest);
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listConversations(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const conversations = await copilotService.listConversations(getAuthUser(request));
    reply.status(200).send(successDataResponse({ conversations }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function getConversation(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const conversation = await copilotService.getConversation(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ conversation }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function deleteConversationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    await copilotService.deleteConversation(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ deleted: true }));
  } catch (error) {
    handleError(error, reply);
  }
}
