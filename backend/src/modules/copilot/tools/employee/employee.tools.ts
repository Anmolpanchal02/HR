import { employeeService } from "../../../employees/employee.service.js";
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
}) {
  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    department: employee.department,
    jobTitle: employee.jobTitle,
  };
}

export const searchEmployeesTool = {
  definition: {
    name: "search_employees",
    description: "Search employees in the organization by name, email, or department",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term" },
      },
      required: ["query"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) return toolFailure("VALIDATION_ERROR", "query is required");

    try {
      const result = await employeeService.listEmployees(toAuthContext(context), {
        search: query,
        limit: 10,
      });
      const employees = result.employees.map(employeeSummary);
      return toolSuccess(
        { employees, count: employees.length },
        employees.length
          ? `Found ${employees.length} employee(s) matching "${query}"`
          : `No employees found matching "${query}"`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Search failed");
    }
  },
};

export const getEmployeeTool = {
  definition: {
    name: "get_employee",
    description: "Get employee details by ID",
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
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department,
          jobTitle: employee.jobTitle,
          status: employee.status,
        },
        `Retrieved employee ${employee.firstName} ${employee.lastName}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Employee not found");
    }
  },
};
