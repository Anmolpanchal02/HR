export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

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

export interface TaskListResult {
  tasks: TaskListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export function canCreateTask(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}

export function canFullyUpdateTask(role: string): boolean {
  return canCreateTask(role);
}

export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
  [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.DONE]: [],
  [TaskStatus.CANCELLED]: [],
};

export function isValidTaskTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return TASK_STATUS_TRANSITIONS[from].includes(to);
}

export type TaskSummary = {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
  BLOCKED: number;
  CANCELLED: number;
};

export function emptyTaskSummary(): TaskSummary {
  return {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    BLOCKED: 0,
    CANCELLED: 0,
  };
}
