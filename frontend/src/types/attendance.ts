import type { ApiDataResponse } from "@/types/auth";

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY";

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  lateMinutes: number;
  workMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodayAttendanceSummary {
  date: string;
  record?: AttendanceRecord;
  workHours: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type AttendanceApiResponse<T> = ApiDataResponse<T>;
