export type ToolConfirmationPolicy = "none" | "future_required";

const CONFIRMATION_POLICIES: Record<string, ToolConfirmationPolicy> = {
  search_employees: "none",
  get_employee: "none",
  search_projects: "none",
  get_project: "none",
  search_tasks: "none",
  get_task: "none",
  search_documents: "none",
  create_task: "none",
  update_task: "none",
  create_project: "none",
  update_project: "none",
  delete_task: "future_required",
  delete_project: "future_required",
  terminate_employee: "future_required",
  change_user_role: "future_required",
};

export function getToolConfirmationPolicy(toolName: string): ToolConfirmationPolicy {
  return CONFIRMATION_POLICIES[toolName] ?? "future_required";
}

export function isToolRegisteredForConfirmation(toolName: string): boolean {
  return toolName in CONFIRMATION_POLICIES;
}
