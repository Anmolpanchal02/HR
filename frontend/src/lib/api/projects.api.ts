import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  CreateProjectPayload,
  PaginationMeta,
  ProjectDetail,
  ProjectListItem,
  ProjectListParams,
  ProjectStatus,
} from "@/types/project";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function listProjects(
  params: ProjectListParams = {},
): Promise<ApiDataResponse<{ projects: ProjectListItem[]; pagination: PaginationMeta }>> {
  return apiClient.get(`/projects${buildQuery(params as Record<string, string | number | undefined>)}`, true);
}

export async function getProject(id: string): Promise<ApiDataResponse<{ project: ProjectDetail }>> {
  return apiClient.get(`/projects/${id}`, true);
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<ApiDataResponse<{ project: ProjectDetail }>> {
  return apiClient.post("/projects", payload, true);
}

export async function updateProject(
  id: string,
  payload: Partial<CreateProjectPayload>,
): Promise<ApiDataResponse<{ project: ProjectDetail }>> {
  return apiClient.patch(`/projects/${id}`, payload, true);
}

export async function archiveProject(
  id: string,
): Promise<ApiDataResponse<{ project: ProjectDetail }>> {
  return apiClient.patch(`/projects/${id}/archive`, {}, true);
}

export type { ProjectStatus };
