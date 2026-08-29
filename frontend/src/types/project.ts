export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProjectOwner {
  id: string;
  name: string;
}

export interface TaskSummary {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
  BLOCKED: number;
  CANCELLED: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  key: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  owner?: ProjectOwner;
  startDate?: string;
  targetDate?: string;
}

export interface ProjectDetail extends ProjectListItem {
  organizationId: string;
  description?: string;
  createdBy: string;
  taskSummary: TaskSummary;
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

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  ownerId?: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  targetDate?: string;
  ownerId?: string;
}

export function canManageProjects(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}
