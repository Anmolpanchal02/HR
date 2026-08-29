import mongoose from "mongoose";

import {
  countActiveAdmins,
  createUser,
  findUserByIdAndOrganization,
  findUsersByOrganization,
  updateUserByIdAndOrganization,
  updateUserStatusByIdAndOrganization,
} from "./user.repository.js";
import {
  canManageMember,
  canViewMembers,
  getCreatableRoles,
  type AuthContext,
  type MemberRole,
  type MemberUser,
  UserRole,
} from "./user.types.js";
import { AppError } from "../../utils/app-error.js";
import { hashPassword, validatePasswordStrength } from "../../utils/password.js";
import type { IUser } from "./user.model.js";

export interface CreateMemberInput {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
}

export interface UpdateMemberInput {
  name?: string;
  role?: MemberRole;
}

export interface UpdateMemberStatusInput {
  isActive: boolean;
}

function toMemberUser(user: IUser): MemberUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

function assertMemberRole(role: UserRole): asserts role is MemberRole {
  if (role === UserRole.ADMIN) {
    throw new AppError("ADMIN role cannot be assigned through this endpoint", 400);
  }
}

function assertCanAssignRole(actor: AuthContext, role: UserRole): void {
  const creatableRoles = getCreatableRoles(actor.role);

  if (role === UserRole.ADMIN) {
    throw new AppError("ADMIN role cannot be assigned through this endpoint", 400);
  }

  if (!creatableRoles.includes(role as MemberRole)) {
    throw new AppError("You are not allowed to assign this role", 403);
  }
}

function assertCanManageTarget(actor: AuthContext, target: IUser): void {
  if (target.organizationId.toString() !== actor.organizationId) {
    throw new AppError("User not found", 404);
  }

  if (!canManageMember(actor.role, target.role)) {
    throw new AppError("You are not allowed to manage this user", 403);
  }
}

async function assertCanDeactivateAdmin(
  organizationId: string,
  target: IUser,
  isActive: boolean,
): Promise<void> {
  if (target.role !== UserRole.ADMIN || isActive) {
    return;
  }

  const activeAdminCount = await countActiveAdmins(organizationId);
  if (activeAdminCount <= 1) {
    throw new AppError("Cannot deactivate the last active administrator", 400);
  }
}

function handleDuplicateEmailError(error: unknown): never {
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    throw new AppError(
      "A user with this email already exists in your organization",
      409,
    );
  }

  throw error;
}

export class UserService {
  async listMembers(authUser: AuthContext): Promise<MemberUser[]> {
    if (!canViewMembers(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const users = await findUsersByOrganization(authUser.organizationId);
    return users.map(toMemberUser);
  }

  async getMember(authUser: AuthContext, userId: string): Promise<MemberUser> {
    if (!canViewMembers(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const user = await findUserByIdAndOrganization(userId, authUser.organizationId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toMemberUser(user);
  }

  async createMember(authUser: AuthContext, input: CreateMemberInput): Promise<MemberUser> {
    const creatableRoles = getCreatableRoles(authUser.role);
    if (creatableRoles.length === 0) {
      throw new AppError("Forbidden", 403);
    }

    assertMemberRole(input.role);
    assertCanAssignRole(authUser, input.role);

    const passwordError = validatePasswordStrength(input.password);
    if (passwordError) {
      throw new AppError(passwordError, 400);
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await createUser({
        organizationId: new mongoose.Types.ObjectId(authUser.organizationId),
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: input.role,
      });

      return toMemberUser(user);
    } catch (error) {
      handleDuplicateEmailError(error);
    }
  }

  async updateMember(
    authUser: AuthContext,
    userId: string,
    input: UpdateMemberInput,
  ): Promise<MemberUser> {
    if (!canViewMembers(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const target = await findUserByIdAndOrganization(userId, authUser.organizationId);
    if (!target) {
      throw new AppError("User not found", 404);
    }

    assertCanManageTarget(authUser, target);

    if (input.role !== undefined) {
      assertMemberRole(input.role);
      assertCanAssignRole(authUser, input.role);
    }

    const updates: UpdateMemberInput = {};
    if (input.name !== undefined) {
      updates.name = input.name.trim();
    }
    if (input.role !== undefined) {
      updates.role = input.role;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    const updated = await updateUserByIdAndOrganization(
      userId,
      authUser.organizationId,
      updates,
    );

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    return toMemberUser(updated);
  }

  async updateMemberStatus(
    authUser: AuthContext,
    userId: string,
    input: UpdateMemberStatusInput,
  ): Promise<MemberUser> {
    if (!canViewMembers(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const target = await findUserByIdAndOrganization(userId, authUser.organizationId);
    if (!target) {
      throw new AppError("User not found", 404);
    }

    assertCanManageTarget(authUser, target);
    await assertCanDeactivateAdmin(authUser.organizationId, target, input.isActive);

    const updated = await updateUserStatusByIdAndOrganization(
      userId,
      authUser.organizationId,
      input.isActive,
    );

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    return toMemberUser(updated);
  }
}

export const userService = new UserService();
