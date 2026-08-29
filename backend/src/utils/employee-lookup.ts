import { Employee } from "../modules/employees/employee.model.js";
import { EmployeeStatus } from "../modules/employees/employee.types.js";

export async function getEmployeeDisplayMap(
  organizationId: string,
  employeeIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(employeeIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const employees = await Employee.find({
    _id: { $in: uniqueIds },
    organizationId,
  }).select("firstName lastName");

  const map = new Map<string, string>();
  for (const employee of employees) {
    map.set(employee._id.toString(), `${employee.firstName} ${employee.lastName}`);
  }
  return map;
}

export async function validateEmployeeInOrganization(
  employeeId: string,
  organizationId: string,
): Promise<void> {
  const employee = await Employee.findOne({
    _id: employeeId,
    organizationId,
    status: { $ne: EmployeeStatus.TERMINATED },
  }).select("_id");

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }
}
