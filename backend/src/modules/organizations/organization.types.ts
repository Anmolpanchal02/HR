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

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  workHours: {
    startTime: "10:00",
    endTime: "19:00",
    timezone: "Asia/Kolkata",
    workDays: [1, 2, 3, 4, 5],
    graceMinutes: 15,
  },
  leavePolicy: {
    annualLeaveDays: 18,
    sickLeaveDays: 10,
    casualLeaveDays: 5,
  },
};
