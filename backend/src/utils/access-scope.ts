import { findEmployeeByUserIdAndOrganization } from "../modules/employees/employee.repository.js";
import { UserRole, type AuthContext } from "../modules/users/user.types.js";
import { AppError } from "./app-error.js";

export function isEmployeeRole(role: UserRole): boolean {
  return role === UserRole.EMPLOYEE;
}

export async function requireEmployeeId(authUser: AuthContext): Promise<string> {
  const employee = await findEmployeeByUserIdAndOrganization(
    authUser.userId,
    authUser.organizationId,
  );
  if (!employee) {
    throw new AppError("Employee profile required", 403);
  }
  return employee._id.toString();
}

export async function tryEmployeeId(authUser: AuthContext): Promise<string | undefined> {
  if (!isEmployeeRole(authUser.role)) return undefined;
  try {
    return await requireEmployeeId(authUser);
  } catch {
    return undefined;
  }
}
