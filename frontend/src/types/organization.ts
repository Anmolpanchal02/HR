import type { ApiDataResponse } from "@/types/auth";

export interface WorkHoursSettings {
  startTime: string;
  endTime: string;
  timezone: string;
  workDays: number[];
  graceMinutes: number;
}

export interface LeavePolicySettings {
  annualLeaveDays: number;
  sickLeaveDays: number;
  casualLeaveDays: number;
}

export interface OrganizationSettings {
  workHours: WorkHoursSettings;
  leavePolicy: LeavePolicySettings;
}

export type OrganizationApiResponse<T> = ApiDataResponse<T>;
