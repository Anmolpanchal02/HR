import { UserRole } from "../../users/user.types.js";

export type ToolPermission = "allowed" | "denied" | "limited";

const TOOL_PERMISSIONS: Record<string, Record<UserRole, ToolPermission>> = {
  search_employees: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "denied",
    [UserRole.EMPLOYEE]: "denied",
  },
  get_employee: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "limited",
    [UserRole.EMPLOYEE]: "limited",
  },
  create_employee: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "denied",
    [UserRole.EMPLOYEE]: "denied",
  },
  update_employee: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "denied",
    [UserRole.EMPLOYEE]: "denied",
  },
  search_projects: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "allowed",
  },
  get_project: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "allowed",
  },
  create_project: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "denied",
  },
  update_project: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "denied",
  },
  search_tasks: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "limited",
  },
  get_task: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "limited",
  },
  create_task: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "denied",
  },
  update_task: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "limited",
  },
  search_documents: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "allowed",
  },
  list_documents: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "allowed",
  },
  get_document: {
    [UserRole.ADMIN]: "allowed",
    [UserRole.HR]: "allowed",
    [UserRole.ENGINEER]: "allowed",
    [UserRole.EMPLOYEE]: "allowed",
  },
};

export function getToolPermission(toolName: string, role: UserRole): ToolPermission {
  return TOOL_PERMISSIONS[toolName]?.[role] ?? "denied";
}

export function isToolDeniedAtAgentLayer(toolName: string, role: UserRole): boolean {
  return getToolPermission(toolName, role) === "denied";
}
