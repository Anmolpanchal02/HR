import mongoose, { Schema, type Document, type Model } from "mongoose";

import { LeaveStatus, LeaveType } from "./leave.types.js";

export interface ILeaveRequest extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approverId?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
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
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
      index: true,
    },
    approverId: { type: Schema.Types.ObjectId, ref: "Employee" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
leaveRequestSchema.index({ organizationId: 1, approverId: 1, status: 1 });

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ??
  mongoose.model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);
