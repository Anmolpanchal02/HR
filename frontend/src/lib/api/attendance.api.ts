import { apiClient } from "@/lib/api/client";
import type {
  AttendanceApiResponse,
  AttendanceRecord,
  PaginationMeta,
  TodayAttendanceSummary,
} from "@/types/attendance";

export async function getTodayAttendance(): Promise<
  AttendanceApiResponse<{ summary: TodayAttendanceSummary }>
> {
  return apiClient.get("/attendance/today", true);
}

export async function checkIn(): Promise<AttendanceApiResponse<{ record: AttendanceRecord }>> {
  return apiClient.post("/attendance/check-in", {}, true);
}

export async function checkOut(): Promise<AttendanceApiResponse<{ record: AttendanceRecord }>> {
  return apiClient.post("/attendance/check-out", {}, true);
}

export async function listMyAttendance(params: {
  page?: number;
  limit?: number;
} = {}): Promise<AttendanceApiResponse<{ records: AttendanceRecord[]; pagination: PaginationMeta }>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiClient.get(`/attendance/me${q ? `?${q}` : ""}`, true);
}

export async function listTeamAttendance(params: {
  page?: number;
  limit?: number;
} = {}): Promise<AttendanceApiResponse<{ records: AttendanceRecord[]; pagination: PaginationMeta }>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiClient.get(`/attendance/team${q ? `?${q}` : ""}`, true);
}

export async function listAllAttendance(params: {
  page?: number;
  limit?: number;
} = {}): Promise<AttendanceApiResponse<{ records: AttendanceRecord[]; pagination: PaginationMeta }>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiClient.get(`/attendance${q ? `?${q}` : ""}`, true);
}
