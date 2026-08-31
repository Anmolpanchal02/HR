export enum AttendanceStatus {
  PRESENT = "PRESENT",
  LATE = "LATE",
  ABSENT = "ABSENT",
  HALF_DAY = "HALF_DAY",
  ON_LEAVE = "ON_LEAVE",
  HOLIDAY = "HOLIDAY",
}

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

export interface AttendanceListResult {
  records: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
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
