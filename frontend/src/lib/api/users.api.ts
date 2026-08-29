import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  CreateMemberPayload,
  MemberUser,
  UpdateMemberPayload,
  UpdateMemberStatusPayload,
} from "@/types/users";

export async function listMembers(): Promise<ApiDataResponse<{ users: MemberUser[] }>> {
  return apiClient.get<ApiDataResponse<{ users: MemberUser[] }>>("/users", true);
}

export async function getMember(id: string): Promise<ApiDataResponse<{ user: MemberUser }>> {
  return apiClient.get<ApiDataResponse<{ user: MemberUser }>>(`/users/${id}`, true);
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<ApiDataResponse<{ user: MemberUser }>> {
  return apiClient.post<ApiDataResponse<{ user: MemberUser }>>("/users", payload, true);
}

export async function updateMember(
  id: string,
  payload: UpdateMemberPayload,
): Promise<ApiDataResponse<{ user: MemberUser }>> {
  return apiClient.patch<ApiDataResponse<{ user: MemberUser }>>(`/users/${id}`, payload, true);
}

export async function updateMemberStatus(
  id: string,
  payload: UpdateMemberStatusPayload,
): Promise<ApiDataResponse<{ user: MemberUser }>> {
  return apiClient.patch<ApiDataResponse<{ user: MemberUser }>>(
    `/users/${id}/status`,
    payload,
    true,
  );
}
