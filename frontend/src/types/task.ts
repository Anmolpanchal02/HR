export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface TaskProjectRef {
  id: string;
  name: string;
  key: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  project?: TaskProjectRef;
  assignee?: TaskAssignee;
  dueDate?: string;
}

export interface TaskDetail extends TaskListItem {
  organizationId: string;
  projectId: string;
  description?: string;
  assigneeId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateTaskPayload {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export function canCreateTasks(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}
