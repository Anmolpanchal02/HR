import type { UserRole } from "@/types/auth";

export type MemberRole = "HR" | "ENGINEER" | "EMPLOYEE";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
}

export interface UpdateMemberPayload {
  name?: string;
  role?: MemberRole;
}

export interface UpdateMemberStatusPayload {
  isActive: boolean;
}

export function getAssignableRoles(role: UserRole): MemberRole[] {
  if (role === "ADMIN") {
    return ["HR", "ENGINEER", "EMPLOYEE"];
  }

  if (role === "HR") {
    return ["ENGINEER", "EMPLOYEE"];
  }

  return [];
}

export function canManageMembers(role: UserRole): boolean {
  return role === "ADMIN" || role === "HR";
}
