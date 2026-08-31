import type { FilterQuery } from "mongoose";

import { LeaveRequest, type ILeaveRequest } from "./leave.model.js";
import type { LeaveQueryParams, LeaveStatus } from "./leave.types.js";

export async function createLeaveRequest(input: {
  organizationId: string;
  employeeId: string;
  leaveType: ILeaveRequest["leaveType"];
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  approverId?: string;
}): Promise<ILeaveRequest> {
  return LeaveRequest.create(input);
}

export async function findLeaveRequestById(
  id: string,
  organizationId: string,
): Promise<ILeaveRequest | null> {
  return LeaveRequest.findOne({ _id: id, organizationId });
}

export async function updateLeaveRequest(
  id: string,
  organizationId: string,
  updates: Partial<ILeaveRequest>,
): Promise<ILeaveRequest | null> {
  return LeaveRequest.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listLeaveRequests(
  organizationId: string,
  params: LeaveQueryParams,
): Promise<{ requests: ILeaveRequest[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ILeaveRequest> = { organizationId };
  if (params.employeeId) filter.employeeId = params.employeeId;
  if (params.status) filter.status = params.status;

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return { requests, total };
}

export async function listPendingForApprover(
  organizationId: string,
  approverEmployeeId: string,
  directReportEmployeeIds: string[],
  params: LeaveQueryParams,
): Promise<{ requests: ILeaveRequest[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const scopeFilter: FilterQuery<ILeaveRequest>[] = [{ approverId: approverEmployeeId }];
  if (directReportEmployeeIds.length > 0) {
    scopeFilter.push({ employeeId: { $in: directReportEmployeeIds } });
  }

  const filter: FilterQuery<ILeaveRequest> = {
    organizationId,
    status: "PENDING" as LeaveStatus,
    $or: scopeFilter,
  };

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return { requests, total };
}
