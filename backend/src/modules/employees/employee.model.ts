import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

import { EmployeeStatus, EmploymentType } from "./employee.types.js";

export interface IEmployee extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department: string;
  jobTitle: string;
  dateOfJoining: Date;
  managerId?: Types.ObjectId;
  location?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    dateOfJoining: {
      type: Date,
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, department: 1 });
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ organizationId: 1, lastName: 1, firstName: 1 });

export const Employee: Model<IEmployee> =
  mongoose.models.Employee ?? mongoose.model<IEmployee>("Employee", employeeSchema);

interface IEmployeeSequence extends Document {
  organizationId: Types.ObjectId;
  seq: number;
}

const employeeSequenceSchema = new Schema<IEmployeeSequence>({
  organizationId: { type: Schema.Types.ObjectId, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const EmployeeSequence: Model<IEmployeeSequence> =
  mongoose.models.EmployeeSequence ??
  mongoose.model<IEmployeeSequence>("EmployeeSequence", employeeSequenceSchema);
