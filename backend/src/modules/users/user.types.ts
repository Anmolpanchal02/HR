export enum UserRole {
  ADMIN = "ADMIN",
  HR = "HR",
  ENGINEER = "ENGINEER",
  EMPLOYEE = "EMPLOYEE",
}

export const MEMBER_ROLES = [UserRole.HR, UserRole.ENGINEER, UserRole.EMPLOYEE] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  employeeId?: string;
  hasDirectReports?: boolean;
}

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export function getCreatableRoles(actorRole: UserRole): MemberRole[] {
  if (actorRole === UserRole.ADMIN) {
    return [UserRole.HR, UserRole.ENGINEER, UserRole.EMPLOYEE];
  }

  if (actorRole === UserRole.HR) {
    return [UserRole.ENGINEER, UserRole.EMPLOYEE];
  }

  return [];
}

export function canManageMember(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === UserRole.ADMIN) {
    return targetRole !== UserRole.ADMIN;
  }

  if (actorRole === UserRole.HR) {
    return targetRole === UserRole.ENGINEER || targetRole === UserRole.EMPLOYEE;
  }

  return false;
}

export function canViewMembers(actorRole: UserRole): boolean {
  return actorRole === UserRole.ADMIN || actorRole === UserRole.HR;
}
