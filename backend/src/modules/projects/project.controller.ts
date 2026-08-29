import type { FastifyReply, FastifyRequest } from "fastify";

import type { CreateProjectRequest, UpdateProjectRequest } from "./project.service.js";
import { projectService } from "./project.service.js";
import type { ProjectQueryParams } from "./project.types.js";
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

export async function listProjects(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const result = await projectService.listProjects(
      getAuthUser(request),
      request.query as ProjectQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function getProject(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const project = await projectService.getProject(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ project }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function createProject(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const project = await projectService.createProject(
      getAuthUser(request),
      request.body as CreateProjectRequest,
    );
    reply.status(201).send(successDataResponse({ project }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function updateProject(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const project = await projectService.updateProject(
      getAuthUser(request),
      id,
      request.body as UpdateProjectRequest,
    );
    reply.status(200).send(successDataResponse({ project }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function archiveProject(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const project = await projectService.archiveProject(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ project }));
  } catch (error) {
    handleError(error, reply);
  }
}
