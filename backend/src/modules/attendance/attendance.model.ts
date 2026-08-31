import mongoose, { Schema, type Document, type Model } from "mongoose";

import { AttendanceStatus } from "./attendance.types.js";

export interface IAttendance extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  status: AttendanceStatus;
  lateMinutes: number;
  workMinutes: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    checkInAt: Date,
    checkOutAt: Date,
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.ABSENT,
    },
    lateMinutes: { type: Number, default: 0, min: 0 },
    workMinutes: { type: Number, default: 0, min: 0 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

attendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ organizationId: 1, date: 1 });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ?? mongoose.model<IAttendance>("Attendance", attendanceSchema);
