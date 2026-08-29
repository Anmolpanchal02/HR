import type { IUser } from "../users/user.model.js";
import {
  createOrganization,
  findOrganizationById,
  findOrganizationBySlug,
} from "../organizations/organization.repository.js";
import { createUser, findUserById, findUsersByEmail } from "../users/user.repository.js";
import { UserRole, type SafeUser } from "../users/user.types.js";
import type { RegisterInput, LoginInput, AuthResult } from "./auth.types.js";
import { AppError } from "../../utils/app-error.js";
import { signToken } from "../../utils/jwt.js";
import { comparePassword, hashPassword, validatePasswordStrength } from "../../utils/password.js";
import { generateSlug } from "../../utils/slug.js";

function toSafeUser(user: IUser, organizationName?: string): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId.toString(),
    organizationName,
    employeeId: user.employeeId?.toString(),
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const passwordError = validatePasswordStrength(input.password);
    if (passwordError) {
      throw new AppError(passwordError, 400);
    }

    const slug = generateSlug(input.organizationName);
    if (!slug) {
      throw new AppError("Organization name is invalid", 400);
    }

    const existingOrg = await findOrganizationBySlug(slug);
    if (existingOrg) {
      throw new AppError("Organization already exists", 409);
    }

    const organization = await createOrganization(input.organizationName.trim(), slug);
    const passwordHash = await hashPassword(input.password);

    let user: IUser;
    try {
      user = await createUser({
        organizationId: organization._id,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: UserRole.ADMIN,
      });
    } catch (error) {
      await organization.deleteOne();
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError("User already exists in this organization", 409);
      }
      throw error;
    }

    const token = signToken({
      userId: user._id.toString(),
      organizationId: organization._id.toString(),
      role: user.role,
    });

    return {
      user: toSafeUser(user, organization.name),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();
    const users = await findUsersByEmail(email);

    if (users.length !== 1) {
      throw new AppError("Invalid email or password", 401);
    }

    const user = users[0]!;

    if (!user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordMatch = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const organization = await findOrganizationById(user.organizationId.toString());
    const token = signToken({
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    });

    return {
      user: toSafeUser(user, organization?.name),
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("Unauthorized", 401);
    }

    const organization = await findOrganizationById(user.organizationId.toString());
    return toSafeUser(user, organization?.name);
  }
}

export const authService = new AuthService();
