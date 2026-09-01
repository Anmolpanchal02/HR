import {
  findEmployeeByUserIdAndOrganization,
  findEmployeeByIdAndOrganization,
  findDirectReportsByManager,
} from "../employees/employee.repository.js";
import { EmployeeStatus } from "../employees/employee.types.js";
import { UserRole, type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import { getEmployeeDisplayMap } from "../../utils/employee-lookup.js";
import type { ILeaveRequest } from "./leave.model.js";
import {
  createLeaveRequest,
  findLeaveRequestById,
  listLeaveRequests,
  listPendingForApprover,
  updateLeaveRequest,
} from "./leave.repository.js";
import {
  LeaveStatus,
  type CreateLeaveRequest,
  type LeaveListResult,
  type LeaveQueryParams,
  type LeaveRequestRecord,
  type ReviewLeaveRequest,
} from "./leave.types.js";

function canReviewAllLeave(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.HR;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function countLeaveDays(startDate: Date, endDate: Date): number {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  return Math.floor((end - start) / 86400000) + 1;
}

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new AppError("Invalid leave dates", 400);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

async function requireEmployeeProfile(authUser: AuthContext) {
  const employee = await findEmployeeByUserIdAndOrganization(
    authUser.userId,
    authUser.organizationId,
  );
  if (!employee) {
    throw new AppError(
      "Employee profile required. Ask HR to link your account, or log in as a user with an employee record.",
      400,
    );
  }
  return employee;
}

async function toLeaveRecord(
  request: ILeaveRequest,
  organizationId: string,
): Promise<LeaveRequestRecord> {
  const ids = [request.employeeId.toString()];
  if (request.approverId) ids.push(request.approverId.toString());
  const nameMap = await getEmployeeDisplayMap(organizationId, ids);

  return {
    id: request._id.toString(),
    organizationId: request.organizationId.toString(),
    employeeId: request.employeeId.toString(),
    employeeName: nameMap.get(request.employeeId.toString()) ?? "Unknown",
    leaveType: request.leaveType,
    startDate: formatDate(request.startDate),
    endDate: formatDate(request.endDate),
    totalDays: request.totalDays,
    reason: request.reason,
    status: request.status,
    approverId: request.approverId?.toString(),
    approverName: request.approverId
      ? nameMap.get(request.approverId.toString())
      : undefined,
    reviewedBy: request.reviewedBy?.toString(),
    reviewedAt: request.reviewedAt?.toISOString(),
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export class LeaveService {
  async createRequest(
    authUser: AuthContext,
    input: CreateLeaveRequest,
  ): Promise<LeaveRequestRecord> {
    const employee = await requireEmployeeProfile(authUser);
    const startDate = parseDateOnly(input.startDate);
    const endDate = parseDateOnly(input.endDate);

    if (endDate < startDate) {
      throw new AppError("End date must be on or after start date", 400);
    }

    const totalDays = countLeaveDays(startDate, endDate);
    const request = await createLeaveRequest({
      organizationId: authUser.organizationId,
      employeeId: employee._id.toString(),
      leaveType: input.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: input.reason.trim(),
      approverId: employee.managerId?.toString(),
    });

    return toLeaveRecord(request, authUser.organizationId);
  }

  async listMine(authUser: AuthContext, params: LeaveQueryParams): Promise<LeaveListResult> {
    const employee = await requireEmployeeProfile(authUser);
    return this.buildList(authUser.organizationId, {
      ...params,
      employeeId: employee._id.toString(),
    });
  }

  async listPending(authUser: AuthContext, params: LeaveQueryParams): Promise<LeaveListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    if (canReviewAllLeave(authUser.role)) {
      return this.buildList(authUser.organizationId, { ...params, status: LeaveStatus.PENDING });
    }

    const employee = await requireEmployeeProfile(authUser);
    const directReports = await findDirectReportsByManager(
      employee._id.toString(),
      authUser.organizationId,
    );
    if (directReports.length === 0) {
      return {
        requests: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const { requests, total } = await listPendingForApprover(
      authUser.organizationId,
      directReports.map((report) => report._id.toString()),
      params,
    );
    const mapped = await Promise.all(
      requests.map((request) => toLeaveRecord(request, authUser.organizationId)),
    );

    return {
      requests: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listAll(authUser: AuthContext, params: LeaveQueryParams): Promise<LeaveListResult> {
    if (!canReviewAllLeave(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }
    return this.buildList(authUser.organizationId, params);
  }

  async approve(
    authUser: AuthContext,
    requestId: string,
  ): Promise<LeaveRequestRecord> {
    const request = await this.getReviewableRequest(authUser, requestId);
    const updated = await updateLeaveRequest(request._id.toString(), authUser.organizationId, {
      status: LeaveStatus.APPROVED,
      reviewedBy: authUser.userId as never,
      reviewedAt: new Date(),
      rejectionReason: undefined,
    });
    if (!updated) throw new AppError("Leave request not found", 404);
    return toLeaveRecord(updated, authUser.organizationId);
  }

  async reject(
    authUser: AuthContext,
    requestId: string,
    input: ReviewLeaveRequest,
  ): Promise<LeaveRequestRecord> {
    const request = await this.getReviewableRequest(authUser, requestId);
    const updated = await updateLeaveRequest(request._id.toString(), authUser.organizationId, {
      status: LeaveStatus.REJECTED,
      reviewedBy: authUser.userId as never,
      reviewedAt: new Date(),
      rejectionReason: input.rejectionReason?.trim() || "Rejected by manager",
    });
    if (!updated) throw new AppError("Leave request not found", 404);
    return toLeaveRecord(updated, authUser.organizationId);
  }

  async cancel(authUser: AuthContext, requestId: string): Promise<LeaveRequestRecord> {
    const employee = await requireEmployeeProfile(authUser);
    const request = await findLeaveRequestById(requestId, authUser.organizationId);
    if (!request) throw new AppError("Leave request not found", 404);
    if (request.employeeId.toString() !== employee._id.toString()) {
      throw new AppError("Forbidden", 403);
    }
    if (request.status !== LeaveStatus.PENDING) {
      throw new AppError("Only pending requests can be cancelled", 400);
    }

    const updated = await updateLeaveRequest(requestId, authUser.organizationId, {
      status: LeaveStatus.CANCELLED,
    });
    if (!updated) throw new AppError("Leave request not found", 404);
    return toLeaveRecord(updated, authUser.organizationId);
  }

  private async getReviewableRequest(authUser: AuthContext, requestId: string) {
    const request = await findLeaveRequestById(requestId, authUser.organizationId);
    if (!request) throw new AppError("Leave request not found", 404);
    if (request.status !== LeaveStatus.PENDING) {
      throw new AppError("Leave request is no longer pending", 400);
    }

    if (canReviewAllLeave(authUser.role)) {
      return request;
    }

    const reviewer = await requireEmployeeProfile(authUser);
    const employee = await findEmployeeByIdAndOrganization(
      request.employeeId.toString(),
      authUser.organizationId,
    );
    if (!employee) throw new AppError("Employee not found", 404);

    const isManager = employee.managerId?.toString() === reviewer._id.toString();
    if (!isManager) throw new AppError("Forbidden", 403);
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new AppError("Cannot review leave for terminated employee", 400);
    }

    return request;
  }

  private async buildList(
    organizationId: string,
    params: LeaveQueryParams,
  ): Promise<LeaveListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { requests, total } = await listLeaveRequests(organizationId, params);
    const mapped = await Promise.all(requests.map((request) => toLeaveRecord(request, organizationId)));
    return {
      requests: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const leaveService = new LeaveService();
