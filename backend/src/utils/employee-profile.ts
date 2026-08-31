import type { Types } from "mongoose";

import { generateEmployeeCode } from "../modules/employees/employee-code.js";
import { createEmployeeRecord } from "../modules/employees/employee.repository.js";
import type { IEmployee } from "../modules/employees/employee.model.js";
import { EmploymentType } from "../modules/employees/employee.types.js";
import type { IUser } from "../modules/users/user.model.js";

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Employee";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

export async function provisionEmployeeProfileForUser(user: IUser): Promise<IEmployee> {
  const { firstName, lastName } = splitDisplayName(user.name);
  const employeeCode = await generateEmployeeCode(user.organizationId.toString());

  return createEmployeeRecord({
    organizationId: user.organizationId as Types.ObjectId,
    userId: user._id as Types.ObjectId,
    employeeCode,
    firstName,
    lastName,
    department: "General",
    jobTitle: "Employee",
    dateOfJoining: new Date(),
    employmentType: EmploymentType.FULL_TIME,
  });
}
