export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum ProjectPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

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

export interface ProjectListResult {
  projects: ProjectListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  ownerId?: string;
}

export function canCreateProject(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}

export function canUpdateProject(role: string): boolean {
  return canCreateProject(role);
}
