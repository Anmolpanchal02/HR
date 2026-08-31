import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusRequest,
} from "./employee.service.js";
import { employeeService } from "./employee.service.js";
import type { EmployeeQueryParams } from "./employee.types.js";
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

export async function listEmployees(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const query = request.query as EmployeeQueryParams;
    const result = await employeeService.listEmployees(getAuthUser(request), query);
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function getEmployee(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const employee = await employeeService.getEmployee(getAuthUser(request), id);
    reply.status(200).send(successDataResponse({ employee }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function createEmployee(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const body = request.body as CreateEmployeeRequest;
    const employee = await employeeService.createEmployee(getAuthUser(request), body);
    reply.status(201).send(successDataResponse({ employee }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function updateEmployee(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateEmployeeRequest;
    const employee = await employeeService.updateEmployee(getAuthUser(request), id, body);
    reply.status(200).send(successDataResponse({ employee }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function updateEmployeeStatus(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateEmployeeStatusRequest;
    const employee = await employeeService.updateEmployeeStatus(
      getAuthUser(request),
      id,
      body,
    );
    reply.status(200).send(successDataResponse({ employee }));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function getOrgChart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const chart = await employeeService.getOrgChart(getAuthUser(request));
    reply.status(200).send(successDataResponse(chart));
  } catch (error) {
    handleServiceError(error, reply);
  }
}

export async function getDirectReports(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { id } = request.params as { id: string };
    const result = await employeeService.getDirectReports(getAuthUser(request), id);
    reply.status(200).send(successDataResponse(result));
  } catch (error) {
    handleServiceError(error, reply);
  }
}
