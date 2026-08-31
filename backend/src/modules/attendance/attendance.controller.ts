import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../utils/app-error.js";
import { successDataResponse } from "../../utils/api-response.js";
import { attendanceService } from "./attendance.service.js";
import type { AttendanceQueryParams } from "./attendance.types.js";

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

export async function getTodayAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const summary = await attendanceService.getToday(getAuthUser(request));
    reply.status(200).send(successDataResponse({ summary }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function checkIn(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const record = await attendanceService.checkIn(getAuthUser(request));
    reply.status(201).send(successDataResponse({ record }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function checkOut(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const record = await attendanceService.checkOut(getAuthUser(request));
    reply.status(200).send(successDataResponse({ record }));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listMyAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await attendanceService.listMine(
      getAuthUser(request),
      request.query as AttendanceQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listTeamAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await attendanceService.listTeam(
      getAuthUser(request),
      request.query as AttendanceQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}

export async function listAllAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await attendanceService.listAll(
      getAuthUser(request),
      request.query as AttendanceQueryParams,
    );
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleError(error, reply);
  }
}
