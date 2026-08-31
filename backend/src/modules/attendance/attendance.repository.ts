import type { FilterQuery } from "mongoose";

import { Attendance, type IAttendance } from "./attendance.model.js";
import type { AttendanceQueryParams, AttendanceStatus } from "./attendance.types.js";

export async function findAttendanceByEmployeeAndDate(
  organizationId: string,
  employeeId: string,
  date: string,
): Promise<IAttendance | null> {
  return Attendance.findOne({ organizationId, employeeId, date });
}

export async function createAttendanceRecord(input: {
  organizationId: string;
  employeeId: string;
  date: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  status: AttendanceStatus;
  lateMinutes?: number;
  workMinutes?: number;
  notes?: string;
}): Promise<IAttendance> {
  return Attendance.create(input);
}

export async function updateAttendanceRecord(
  id: string,
  organizationId: string,
  updates: Partial<IAttendance>,
): Promise<IAttendance | null> {
  return Attendance.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listAttendanceByOrganization(
  organizationId: string,
  params: AttendanceQueryParams,
): Promise<{ records: IAttendance[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IAttendance> = { organizationId };

  if (params.employeeId) filter.employeeId = params.employeeId;
  if (params.status) filter.status = params.status;
  if (params.from || params.to) {
    filter.date = {};
    if (params.from) filter.date.$gte = params.from;
    if (params.to) filter.date.$lte = params.to;
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1, checkInAt: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return { records, total };
}

export async function listAttendanceForEmployees(
  organizationId: string,
  employeeIds: string[],
  params: AttendanceQueryParams,
): Promise<{ records: IAttendance[]; total: number }> {
  if (employeeIds.length === 0) {
    return { records: [], total: 0 };
  }

  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IAttendance> = {
    organizationId,
    employeeId: { $in: employeeIds },
  };

  if (params.from || params.to) {
    filter.date = {};
    if (params.from) filter.date.$gte = params.from;
    if (params.to) filter.date.$lte = params.to;
  }
  if (params.status) filter.status = params.status;

  const [records, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return { records, total };
}
