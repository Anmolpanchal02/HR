import { employeeService } from "../../../employees/employee.service.js";
import { EmploymentType, EmployeeStatus } from "../../../employees/employee.types.js";
import type { ToolContext, ToolResult } from "../tool.types.js";
import { sanitizeToolInput } from "../tool.types.js";
import { toolFailure, toolFailureFromError, toolSuccess } from "../tool-result.js";

function toAuthContext(context: ToolContext) {
  return {
    userId: context.userId,
    organizationId: context.organizationId,
    role: context.role,
  };
}

function employeeSummary(employee: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  status?: string;
  employeeCode?: string;
}) {
  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    department: employee.department,
    jobTitle: employee.jobTitle,
    ...(employee.status ? { status: employee.status } : {}),
    ...(employee.employeeCode ? { employeeCode: employee.employeeCode } : {}),
  };
}

const EMPLOYMENT_TYPES = Object.values(EmploymentType);
const EMPLOYEE_STATUSES = Object.values(EmployeeStatus);

export const searchEmployeesTool = {
  definition: {
    name: "search_employees",
    description:
      "Search or list employees by name, email, department, or status. Omit query to list (optionally filter by department/status).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term for name, email, or department" },
        department: { type: "string", description: "Filter by department" },
        status: {
          type: "string",
          enum: EMPLOYEE_STATUSES,
          description: "Filter by employee status",
        },
      },
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    const department = typeof args.department === "string" ? args.department.trim() : "";
    const status =
      typeof args.status === "string" && EMPLOYEE_STATUSES.includes(args.status as EmployeeStatus)
        ? (args.status as EmployeeStatus)
        : undefined;

    try {
      const result = await employeeService.listEmployees(toAuthContext(context), {
        search: query || undefined,
        department: department || undefined,
        status,
        limit: 15,
      });
      const employees = result.employees.map(employeeSummary);
      const label = query
        ? `matching "${query}"`
        : department
          ? `in ${department}`
          : status
            ? `with status ${status}`
            : "in the organization";
      return toolSuccess(
        { employees, count: employees.length },
        employees.length
          ? `Found ${employees.length} employee(s) ${label}`
          : `No employees found ${label}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Search failed");
    }
  },
};

export const getEmployeeTool = {
  definition: {
    name: "get_employee",
    description: "Get full employee profile by ID (use after search_employees)",
    inputSchema: {
      type: "object",
      properties: {
        employeeId: { type: "string" },
      },
      required: ["employeeId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const employeeId = typeof args.employeeId === "string" ? args.employeeId : "";
    if (!employeeId) return toolFailure("VALIDATION_ERROR", "employeeId is required");

    try {
      const employee = await employeeService.getEmployee(toAuthContext(context), employeeId);
      return toolSuccess(
        {
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          jobTitle: employee.jobTitle,
          status: employee.status,
          employmentType: employee.employmentType,
          dateOfJoining: employee.dateOfJoining,
          location: employee.location,
          managerId: employee.managerId,
          managerName: employee.managerName,
        },
        `Retrieved employee ${employee.firstName} ${employee.lastName}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Employee not found");
    }
  },
};

export const createEmployeeTool = {
  definition: {
    name: "create_employee",
    description:
      "Create a new employee record (ADMIN/HR only). Creates a linked user with EMPLOYEE role.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        department: { type: "string" },
        jobTitle: { type: "string" },
        dateOfJoining: { type: "string", description: "ISO date YYYY-MM-DD" },
        employmentType: {
          type: "string",
          enum: EMPLOYMENT_TYPES,
          description: "FULL_TIME, PART_TIME, CONTRACT, or INTERN",
        },
        phone: { type: "string" },
        location: { type: "string" },
        managerId: { type: "string", description: "Employee ID of manager" },
      },
      required: [
        "firstName",
        "lastName",
        "email",
        "department",
        "jobTitle",
        "dateOfJoining",
        "employmentType",
      ],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const firstName = typeof args.firstName === "string" ? args.firstName.trim() : "";
    const lastName = typeof args.lastName === "string" ? args.lastName.trim() : "";
    const email = typeof args.email === "string" ? args.email.trim() : "";
    const department = typeof args.department === "string" ? args.department.trim() : "";
    const jobTitle = typeof args.jobTitle === "string" ? args.jobTitle.trim() : "";
    const dateOfJoining =
      typeof args.dateOfJoining === "string" ? args.dateOfJoining.trim() : "";
    const employmentType =
      typeof args.employmentType === "string" ? args.employmentType.trim() : "";

    if (!firstName || !lastName || !email || !department || !jobTitle || !dateOfJoining) {
      return toolFailure(
        "VALIDATION_ERROR",
        "firstName, lastName, email, department, jobTitle, and dateOfJoining are required",
      );
    }
    if (!EMPLOYMENT_TYPES.includes(employmentType as EmploymentType)) {
      return toolFailure(
        "VALIDATION_ERROR",
        `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}`,
      );
    }

    try {
      const employee = await employeeService.createEmployee(toAuthContext(context), {
        firstName,
        lastName,
        email,
        department,
        jobTitle,
        dateOfJoining,
        employmentType: employmentType as EmploymentType,
        phone: typeof args.phone === "string" ? args.phone : undefined,
        location: typeof args.location === "string" ? args.location : undefined,
        managerId: typeof args.managerId === "string" ? args.managerId : undefined,
      });
      return toolSuccess(
        employeeSummary(employee),
        `Created employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Create employee failed");
    }
  },
};

export const updateEmployeeTool = {
  definition: {
    name: "update_employee",
    description:
      "Update an employee profile fields (ADMIN/HR only). For status-only changes prefer update_employee_status.",
    inputSchema: {
      type: "object",
      properties: {
        employeeId: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        phone: { type: "string" },
        department: { type: "string" },
        jobTitle: { type: "string" },
        location: { type: "string" },
        employmentType: { type: "string", enum: EMPLOYMENT_TYPES },
        managerId: { type: "string", description: "Employee ID of manager, or empty to clear" },
        dateOfJoining: { type: "string" },
      },
      required: ["employeeId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const employeeId = typeof args.employeeId === "string" ? args.employeeId : "";
    if (!employeeId) return toolFailure("VALIDATION_ERROR", "employeeId is required");

    const updates: Record<string, unknown> = {};
    if (typeof args.firstName === "string") updates.firstName = args.firstName;
    if (typeof args.lastName === "string") updates.lastName = args.lastName;
    if (typeof args.phone === "string") updates.phone = args.phone;
    if (typeof args.department === "string") updates.department = args.department;
    if (typeof args.jobTitle === "string") updates.jobTitle = args.jobTitle;
    if (typeof args.location === "string") updates.location = args.location;
    if (typeof args.dateOfJoining === "string") updates.dateOfJoining = args.dateOfJoining;
    if (
      typeof args.employmentType === "string" &&
      EMPLOYMENT_TYPES.includes(args.employmentType as EmploymentType)
    ) {
      updates.employmentType = args.employmentType;
    }
    if (typeof args.managerId === "string") {
      updates.managerId = args.managerId === "" ? null : args.managerId;
    }

    if (Object.keys(updates).length === 0) {
      return toolFailure("VALIDATION_ERROR", "Provide at least one field to update");
    }

    try {
      const employee = await employeeService.updateEmployee(
        toAuthContext(context),
        employeeId,
        updates as never,
      );
      return toolSuccess(
        employeeSummary(employee),
        `Updated employee ${employee.firstName} ${employee.lastName}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Update employee failed");
    }
  },
};
