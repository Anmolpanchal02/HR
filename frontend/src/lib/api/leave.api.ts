import { apiClient } from "@/lib/api/client";
import type {
  CreateLeavePayload,
  LeaveApiResponse,
  LeaveRequest,
  PaginationMeta,
} from "@/types/leave";

export async function createLeaveRequest(
  payload: CreateLeavePayload,
): Promise<LeaveApiResponse<{ request: LeaveRequest }>> {
  return apiClient.post("/leave/requests", payload, true);
}

export async function listMyLeaveRequests(params: {
  page?: number;
  limit?: number;
} = {}): Promise<LeaveApiResponse<{ requests: LeaveRequest[]; pagination: PaginationMeta }>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiClient.get(`/leave/requests/me${q ? `?${q}` : ""}`, true);
}

export async function listPendingLeaveRequests(params: {
  page?: number;
  limit?: number;
} = {}): Promise<LeaveApiResponse<{ requests: LeaveRequest[]; pagination: PaginationMeta }>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiClient.get(`/leave/requests/pending${q ? `?${q}` : ""}`, true);
}

export async function approveLeaveRequest(
  id: string,
): Promise<LeaveApiResponse<{ request: LeaveRequest }>> {
  return apiClient.patch(`/leave/requests/${id}/approve`, {}, true);
}

export async function rejectLeaveRequest(
  id: string,
  rejectionReason?: string,
): Promise<LeaveApiResponse<{ request: LeaveRequest }>> {
  return apiClient.patch(`/leave/requests/${id}/reject`, { rejectionReason }, true);
}

export async function cancelLeaveRequest(
  id: string,
): Promise<LeaveApiResponse<{ request: LeaveRequest }>> {
  return apiClient.patch(`/leave/requests/${id}/cancel`, {}, true);
}
