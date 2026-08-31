import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  CreateEmployeePayload,
  EmployeeListItem,
  EmployeeListParams,
  EmployeeProfile,
  EmployeeStatus,
  OrgChartNode,
  PaginationMeta,
} from "@/types/employee";

function buildQuery(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.department) searchParams.set("department", params.department);
  if (params.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listEmployees(
  params: EmployeeListParams = {},
): Promise<ApiDataResponse<{ employees: EmployeeListItem[]; pagination: PaginationMeta }>> {
  return apiClient.get(`/employees${buildQuery(params)}`, true);
}

export async function getEmployee(
  id: string,
): Promise<ApiDataResponse<{ employee: EmployeeProfile }>> {
  return apiClient.get(`/employees/${id}`, true);
}

export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<ApiDataResponse<{ employee: EmployeeProfile }>> {
  return apiClient.post("/employees", payload, true);
}

export async function updateEmployeeStatus(
  id: string,
  status: EmployeeStatus,
): Promise<ApiDataResponse<{ employee: EmployeeProfile }>> {
  return apiClient.patch(`/employees/${id}/status`, { status }, true);
}

export async function getOrgChart(): Promise<
  ApiDataResponse<{ roots: OrgChartNode[]; totalEmployees: number }>
> {
  return apiClient.get("/employees/org-chart", true);
}
