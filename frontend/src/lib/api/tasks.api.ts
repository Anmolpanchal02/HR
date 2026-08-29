import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  CreateTaskPayload,
  PaginationMeta,
  TaskDetail,
  TaskListItem,
  TaskListParams,
  TaskStatus,
} from "@/types/task";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function listTasks(
  params: TaskListParams = {},
): Promise<ApiDataResponse<{ tasks: TaskListItem[]; pagination: PaginationMeta }>> {
  return apiClient.get(`/tasks${buildQuery(params as Record<string, string | number | undefined>)}`, true);
}

export async function getTask(id: string): Promise<ApiDataResponse<{ task: TaskDetail }>> {
  return apiClient.get(`/tasks/${id}`, true);
}

export async function createTask(
  payload: CreateTaskPayload,
): Promise<ApiDataResponse<{ task: TaskDetail }>> {
  return apiClient.post("/tasks", payload, true);
}

export async function updateTask(
  id: string,
  payload: Partial<CreateTaskPayload & { status: TaskStatus }>,
): Promise<ApiDataResponse<{ task: TaskDetail }>> {
  return apiClient.patch(`/tasks/${id}`, payload, true);
}

export type { TaskStatus };
