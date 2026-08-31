import type { FilterQuery, Types } from "mongoose";

import { Employee, type IEmployee } from "./employee.model.js";
import { EmployeeStatus, type EmployeeQueryParams } from "./employee.types.js";
import { User } from "../users/user.model.js";

export interface CreateEmployeeInput {
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
  employmentType: IEmployee["employmentType"];
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  managerId?: Types.ObjectId | null;
  location?: string;
  employmentType?: IEmployee["employmentType"];
  status?: EmployeeStatus;
  dateOfJoining?: Date;
}

export async function createEmployeeRecord(input: CreateEmployeeInput): Promise<IEmployee> {
  return Employee.create(input);
}

export async function findEmployeeByIdAndOrganization(
  id: string,
  organizationId: string,
): Promise<IEmployee | null> {
  return Employee.findOne({ _id: id, organizationId });
}

export async function findEmployeeByUserIdAndOrganization(
  userId: string,
  organizationId: string,
): Promise<IEmployee | null> {
  return Employee.findOne({ userId, organizationId });
}

export async function updateEmployeeByIdAndOrganization(
  id: string,
  organizationId: string,
  updates: UpdateEmployeeInput,
): Promise<IEmployee | null> {
  return Employee.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listEmployeesByOrganization(
  organizationId: string,
  params: EmployeeQueryParams,
): Promise<{ employees: IEmployee[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IEmployee> = { organizationId };

  if (params.department) {
    filter.department = params.department;
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.search) {
    const regex = new RegExp(params.search.trim(), "i");
    const matchingUsers = await User.find({
      organizationId,
      email: regex,
    }).select("_id");
    const userIds = matchingUsers.map((user) => user._id);

    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { employeeCode: regex },
      { department: regex },
      ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);

  return { employees, total };
}

export async function listActiveEmployeesByOrganization(
  organizationId: string,
): Promise<IEmployee[]> {
  return Employee.find({
    organizationId,
    status: { $ne: EmployeeStatus.TERMINATED },
  }).sort({ firstName: 1, lastName: 1 });
}

export async function findDirectReportsByManager(
  managerId: string,
  organizationId: string,
): Promise<IEmployee[]> {
  return Employee.find({ organizationId, managerId }).sort({ firstName: 1, lastName: 1 });
}

export async function getEmployeeEmail(userId: Types.ObjectId): Promise<string | null> {
  const user = await User.findById(userId).select("email");
  return user?.email ?? null;
}

export async function getManagerName(
  managerId: Types.ObjectId | undefined,
  organizationId: string,
): Promise<string | undefined> {
  if (!managerId) {
    return undefined;
  }

  const manager = await Employee.findOne({ _id: managerId, organizationId }).select(
    "firstName lastName",
  );
  if (!manager) {
    return undefined;
  }

  return `${manager.firstName} ${manager.lastName}`;
}
