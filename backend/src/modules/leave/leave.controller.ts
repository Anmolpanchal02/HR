import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";
import { leaveService } from "./leave.service.js";
import type { CreateLeaveRequest, LeaveQueryParams, ReviewLeaveRequest } from "./leave.types.js";

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

export async function createLeaveRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const leaveRequest = await leaveService.createRequest(
      getAuthUser(request),
      request.body as CreateLeaveRequest,
    );
    reply.status(201).send(successDataResponse({ request: leaveRequest }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listMyLeaveRequests(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await leaveService.listMine(
      getAuthUser(request),
      request.query as LeaveQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listPendingLeaveRequests(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await leaveService.listPending(
      getAuthUser(request),
      request.query as LeaveQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listAllLeaveRequests(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await leaveService.listAll(
      getAuthUser(request),
      request.query as LeaveQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function approveLeaveRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const leaveRequest = await leaveService.approve(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ request: leaveRequest }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function rejectLeaveRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const leaveRequest = await leaveService.reject(
      getAuthUser(request),
      id,
      request.body as ReviewLeaveRequest,
    );
    reply.status(200).send(successDataResponse({ request: leaveRequest }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function cancelLeaveRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const leaveRequest = await leaveService.cancel(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ request: leaveRequest }));
  } catch (error) {
    handleError(error, reply);
  }
}
