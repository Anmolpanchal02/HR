import type { ApiDataResponse } from "@/types/auth";

export type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "UNPAID" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type LeaveApiResponse<T> = ApiDataResponse<T>;
