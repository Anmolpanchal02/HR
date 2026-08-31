export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  CASUAL = "CASUAL",
  UNPAID = "UNPAID",
  OTHER = "OTHER",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface LeaveRequestRecord {
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

export interface LeaveListResult {
  requests: LeaveRequestRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaveQueryParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employeeId?: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ReviewLeaveRequest {
  rejectionReason?: string;
}
