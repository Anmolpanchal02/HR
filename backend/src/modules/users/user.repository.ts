import type { Types } from "mongoose";

import { User, type IUser } from "./user.model.js";
import type { UserRole } from "./user.types.js";

export interface CreateUserInput {
  organizationId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  employeeId?: Types.ObjectId;
}

export async function createUser(input: CreateUserInput): Promise<IUser> {
  return User.create(input);
}

export async function findUserById(id: string): Promise<IUser | null> {
  return User.findById(id);
}

export async function findUsersByEmail(email: string): Promise<IUser[]> {
  return User.find({ email: email.toLowerCase() }).select("+passwordHash");
}

export async function findUserByIdWithPassword(id: string): Promise<IUser | null> {
  return User.findById(id).select("+passwordHash");
}

export async function findUsersByOrganization(organizationId: string): Promise<IUser[]> {
  return User.find({ organizationId }).sort({ createdAt: -1 });
}

export async function findUserByIdAndOrganization(
  id: string,
  organizationId: string,
): Promise<IUser | null> {
  return User.findOne({ _id: id, organizationId });
}

export async function updateUserByIdAndOrganization(
  id: string,
  organizationId: string,
  updates: UpdateUserInput,
): Promise<IUser | null> {
  return User.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function updateUserStatusByIdAndOrganization(
  id: string,
  organizationId: string,
  isActive: boolean,
): Promise<IUser | null> {
  return User.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive },
    { new: true, runValidators: true },
  );
}

export async function countActiveAdmins(organizationId: string): Promise<number> {
  return User.countDocuments({
    organizationId,
    role: "ADMIN",
    isActive: true,
  });
}

export async function userExistsWithEmailInOrganization(
  email: string,
  organizationId: string,
): Promise<boolean> {
  const user = await User.findOne({
    email: email.toLowerCase(),
    organizationId,
  }).select("_id");
  return Boolean(user);
}
