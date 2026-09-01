import {
  findOrganizationById,
  resolveOrganizationSettings,
} from "../organizations/organization.repository.js";
import { findEmployeeByUserIdAndOrganization } from "../employees/employee.repository.js";
import { Employee } from "../employees/employee.model.js";
import { EmployeeStatus } from "../employees/employee.types.js";
import { UserRole, type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import { getEmployeeDisplayMap } from "../../utils/employee-lookup.js";
import type { IAttendance } from "./attendance.model.js";
import {
  createAttendanceRecord,
  findAttendanceByEmployeeAndDate,
  listAttendanceByOrganization,
  listAttendanceForEmployees,
  updateAttendanceRecord,
} from "./attendance.repository.js";
import {
  AttendanceStatus,
  type AttendanceListResult,
  type AttendanceQueryParams,
  type AttendanceRecord,
  type TodayAttendanceSummary,
} from "./attendance.types.js";

function canViewAllAttendance(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.HR;
}

function getDateInTimezone(timezone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

function getWeekdayInTimezone(timezone: string, date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 1;
}

function getMinutesInTimezone(timezone: string, date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function computeLateMinutes(
  checkInAt: Date,
  startTime: string,
  timezone: string,
  graceMinutes: number,
): number {
  const actual = getMinutesInTimezone(timezone, checkInAt);
  const expected = parseTimeToMinutes(startTime);
  const diff = actual - expected - graceMinutes;
  return diff > 0 ? diff : 0;
}

function computeWorkMinutes(checkInAt: Date, checkOutAt: Date): number {
  return Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000));
}

async function requireEmployeeProfile(authUser: AuthContext) {
  const employee = await findEmployeeByUserIdAndOrganization(
    authUser.userId,
    authUser.organizationId,
  );
  if (!employee) {
    throw new AppError("Employee profile required for attendance", 400);
  }
  return employee;
}

async function getOrgWorkHours(organizationId: string) {
  const org = await findOrganizationById(organizationId);
  if (!org) throw new AppError("Organization not found", 404);
  return resolveOrganizationSettings(org).workHours;
}

async function toAttendanceRecord(
  record: IAttendance,
  organizationId: string,
): Promise<AttendanceRecord> {
  const nameMap = await getEmployeeDisplayMap(organizationId, [record.employeeId.toString()]);
  return {
    id: record._id.toString(),
    organizationId: record.organizationId.toString(),
    employeeId: record.employeeId.toString(),
    employeeName: nameMap.get(record.employeeId.toString()) ?? "Unknown",
    date: record.date,
    checkInAt: record.checkInAt?.toISOString(),
    checkOutAt: record.checkOutAt?.toISOString(),
    status: record.status,
    lateMinutes: record.lateMinutes,
    workMinutes: record.workMinutes,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class AttendanceService {
  async getToday(authUser: AuthContext): Promise<TodayAttendanceSummary> {
    const employee = await requireEmployeeProfile(authUser);
    const workHours = await getOrgWorkHours(authUser.organizationId);
    const date = getDateInTimezone(workHours.timezone);
    const record = await findAttendanceByEmployeeAndDate(
      authUser.organizationId,
      employee._id.toString(),
      date,
    );

    const mapped = record
      ? await toAttendanceRecord(record, authUser.organizationId)
      : undefined;

    return {
      date,
      record: mapped,
      workHours: {
        startTime: workHours.startTime,
        endTime: workHours.endTime,
        timezone: workHours.timezone,
      },
      canCheckIn: !record?.checkInAt,
      canCheckOut: Boolean(record?.checkInAt && !record.checkOutAt),
    };
  }

  async checkIn(authUser: AuthContext): Promise<AttendanceRecord> {
    const employee = await requireEmployeeProfile(authUser);
    const workHours = await getOrgWorkHours(authUser.organizationId);
    const now = new Date();
    const date = getDateInTimezone(workHours.timezone, now);
    const weekday = getWeekdayInTimezone(workHours.timezone, now);

    if (!workHours.workDays.includes(weekday)) {
      throw new AppError("Today is not a configured work day", 400);
    }

    const existing = await findAttendanceByEmployeeAndDate(
      authUser.organizationId,
      employee._id.toString(),
      date,
    );
    if (existing?.checkInAt) {
      throw new AppError("Already checked in for today", 409);
    }

    const lateMinutes = computeLateMinutes(
      now,
      workHours.startTime,
      workHours.timezone,
      workHours.graceMinutes,
    );
    const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const record = existing
      ? await updateAttendanceRecord(existing._id.toString(), authUser.organizationId, {
          checkInAt: now,
          status,
          lateMinutes,
        })
      : await createAttendanceRecord({
          organizationId: authUser.organizationId,
          employeeId: employee._id.toString(),
          date,
          checkInAt: now,
          status,
          lateMinutes,
        });

    if (!record) throw new AppError("Failed to check in", 500);
    return toAttendanceRecord(record, authUser.organizationId);
  }

  async checkOut(authUser: AuthContext): Promise<AttendanceRecord> {
    const employee = await requireEmployeeProfile(authUser);
    const workHours = await getOrgWorkHours(authUser.organizationId);
    const now = new Date();
    const date = getDateInTimezone(workHours.timezone, now);

    const existing = await findAttendanceByEmployeeAndDate(
      authUser.organizationId,
      employee._id.toString(),
      date,
    );
    if (!existing?.checkInAt) {
      throw new AppError("You must check in before checking out", 400);
    }
    if (existing.checkOutAt) {
      throw new AppError("Already checked out for today", 409);
    }

    const workMinutes = computeWorkMinutes(existing.checkInAt, now);
    const updated = await updateAttendanceRecord(existing._id.toString(), authUser.organizationId, {
      checkOutAt: now,
      workMinutes,
    });
    if (!updated) throw new AppError("Failed to check out", 500);
    return toAttendanceRecord(updated, authUser.organizationId);
  }

  async listMine(authUser: AuthContext, params: AttendanceQueryParams): Promise<AttendanceListResult> {
    const employee = await requireEmployeeProfile(authUser);
    return this.listForEmployee(authUser.organizationId, employee._id.toString(), params);
  }

  async listTeam(authUser: AuthContext, params: AttendanceQueryParams): Promise<AttendanceListResult> {
    const employee = await requireEmployeeProfile(authUser);
    const reports = await Employee.find({
      organizationId: authUser.organizationId,
      managerId: employee._id,
      status: { $ne: EmployeeStatus.TERMINATED },
    }).select("_id");

    if (reports.length === 0 && !canViewAllAttendance(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const employeeIds = reports.map((r) => r._id.toString());
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { records, total } = await listAttendanceForEmployees(
      authUser.organizationId,
      employeeIds,
      params,
    );

    const mapped = await Promise.all(
      records.map((record) => toAttendanceRecord(record, authUser.organizationId)),
    );

    return {
      records: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listAll(authUser: AuthContext, params: AttendanceQueryParams): Promise<AttendanceListResult> {
    if (!canViewAllAttendance(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { records, total } = await listAttendanceByOrganization(authUser.organizationId, params);
    const mapped = await Promise.all(
      records.map((record) => toAttendanceRecord(record, authUser.organizationId)),
    );

    return {
      records: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private async listForEmployee(
    organizationId: string,
    employeeId: string,
    params: AttendanceQueryParams,
  ): Promise<AttendanceListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { records, total } = await listAttendanceByOrganization(organizationId, {
      ...params,
      employeeId,
    });
    const mapped = await Promise.all(
      records.map((record) => toAttendanceRecord(record, organizationId)),
    );
    return {
      records: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const attendanceService = new AttendanceService();
