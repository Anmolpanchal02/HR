import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";
import { organizationService } from "./organization.service.js";
import type { OrganizationSettings } from "./organization.types.js";

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

export async function getOrganizationSettings(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const settings = await organizationService.getSettings(getAuthUser(request));
    reply.status(200).send(successDataResponse({ settings }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function updateOrganizationSettings(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const settings = await organizationService.updateSettings(
      getAuthUser(request),
      request.body as Partial<OrganizationSettings>,
    );
    reply.status(200).send(successDataResponse({ settings }));
  } catch (error) {
    handleError(error, reply);
  }
}
