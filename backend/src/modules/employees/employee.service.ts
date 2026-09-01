import mongoose from "mongoose";

import {
  createEmployeeRecord,
  findEmployeeByIdAndOrganization,
  findEmployeeByUserIdAndOrganization,
  getEmployeeEmail,
  getManagerName,
  listEmployeesByOrganization,
  listActiveEmployeesByOrganization,
  findDirectReportsByManager,
  updateEmployeeByIdAndOrganization,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "./employee.repository.js";
import { generateEmployeeCode, generateTemporaryPassword } from "./employee-code.js";
import {
  EmployeeStatus,
  EmploymentType,
  type EmployeeListItem,
  type EmployeeListResult,
  type EmployeeProfile,
  type EmployeeQueryParams,
  type DirectReportItem,
  type OrgChartNode,
  type CreateEmployeeResult,
} from "./employee.types.js";
import type { IEmployee } from "./employee.model.js";
import { createUser, findUserByIdAndOrganization, updateUserByIdAndOrganization, updateUserPasswordByIdAndOrganization, updateUserStatusByIdAndOrganization } from "../users/user.repository.js";
import { UserRole, type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import { hashPassword, validatePasswordStrength } from "../../utils/password.js";

function resolveEmployeePassword(customPassword?: string): string {
  const trimmed = customPassword?.trim();
  if (trimmed) {
    const passwordError = validatePasswordStrength(trimmed);
    if (passwordError) {
      throw new AppError(passwordError, 400);
    }
    return trimmed;
  }
  return generateTemporaryPassword();
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  managerId?: string;
  location?: string;
  password?: string;
}

export interface ResetEmployeePasswordRequest {
  password?: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  managerId?: string | null;
  location?: string;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
  dateOfJoining?: string;
}

export interface UpdateEmployeeStatusRequest {
  status: EmployeeStatus;
}

function canManageEmployees(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.HR;
}

function canViewEmployee(authUser: AuthContext, employee: IEmployee): boolean {
  if (canManageEmployees(authUser.role)) {
    return true;
  }

  if (authUser.role === UserRole.ENGINEER || authUser.role === UserRole.EMPLOYEE) {
    return employee.userId.toString() === authUser.userId;
  }

  return false;
}

function countOrgChartNodes(node: OrgChartNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countOrgChartNodes(child), 0);
}

function findOrgChartNode(roots: OrgChartNode[], employeeId: string): OrgChartNode | undefined {
  for (const root of roots) {
    if (root.id === employeeId) return root;
    const nested = findOrgChartNode(root.children, employeeId);
    if (nested) return nested;
  }
  return undefined;
}

function buildSelfAndManagerChain(
  nodes: Map<string, OrgChartNode>,
  employeeId: string,
): OrgChartNode[] {
  const chain: OrgChartNode[] = [];
  let currentId: string | undefined = employeeId;

  while (currentId) {
    const node = nodes.get(currentId);
    if (!node) break;
    chain.unshift({ ...node, children: [] });
    currentId = node.managerId;
  }

  for (let index = 0; index < chain.length - 1; index += 1) {
    const current = chain[index];
    const next = chain[index + 1];
    if (current && next) {
      current.children = [next];
    }
  }

  const root = chain[0];
  return root ? [root] : [];
}

async function toEmployeeProfile(
  employee: IEmployee,
  organizationId: string,
): Promise<EmployeeProfile> {
  const email = (await getEmployeeEmail(employee.userId)) ?? "";
  const managerName = await getManagerName(employee.managerId, organizationId);

  return {
    id: employee._id.toString(),
    organizationId: employee.organizationId.toString(),
    userId: employee.userId.toString(),
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email,
    phone: employee.phone,
    department: employee.department,
    jobTitle: employee.jobTitle,
    dateOfJoining: employee.dateOfJoining.toISOString().split("T")[0] ?? "",
    managerId: employee.managerId?.toString(),
    managerName,
    location: employee.location,
    employmentType: employee.employmentType,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

async function toEmployeeListItem(employee: IEmployee): Promise<EmployeeListItem> {
  const email = (await getEmployeeEmail(employee.userId)) ?? "";

  return {
    id: employee._id.toString(),
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email,
    department: employee.department,
    jobTitle: employee.jobTitle,
    status: employee.status,
  };
}

async function validateManager(
  managerId: string | undefined,
  organizationId: string,
  employeeId?: string,
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!managerId) {
    return undefined;
  }

  if (employeeId && managerId === employeeId) {
    throw new AppError("Employee cannot be their own manager", 400);
  }

  const manager = await findEmployeeByIdAndOrganization(managerId, organizationId);
  if (!manager) {
    throw new AppError("Manager not found in your organization", 400);
  }

  if (manager.status === EmployeeStatus.TERMINATED) {
    throw new AppError("Terminated employee cannot be assigned as manager", 400);
  }

  return manager._id;
}

function handleDuplicateError(error: unknown): never {
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

export class EmployeeService {
  async listEmployees(
    authUser: AuthContext,
    params: EmployeeQueryParams,
  ): Promise<EmployeeListResult> {
    if (!canManageEmployees(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { employees, total } = await listEmployeesByOrganization(
      authUser.organizationId,
      params,
    );

    const listItems = await Promise.all(employees.map(toEmployeeListItem));

    return {
      employees: listItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getEmployee(authUser: AuthContext, employeeId: string): Promise<EmployeeProfile> {
    const employee = await findEmployeeByIdAndOrganization(
      employeeId,
      authUser.organizationId,
    );

    if (!employee || !canViewEmployee(authUser, employee)) {
      throw new AppError("Employee not found", 404);
    }

    return toEmployeeProfile(employee, authUser.organizationId);
  }

  async resetEmployeePassword(
    authUser: AuthContext,
    employeeId: string,
    input: ResetEmployeePasswordRequest = {},
  ): Promise<{ email: string; temporaryPassword: string }> {
    if (!canManageEmployees(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const employee = await findEmployeeByIdAndOrganization(employeeId, authUser.organizationId);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const user = await findUserByIdAndOrganization(
      employee.userId.toString(),
      authUser.organizationId,
    );
    if (!user) {
      throw new AppError("Linked user account not found", 404);
    }
    if (!user.isActive) {
      throw new AppError("Cannot reset password for a deactivated account", 400);
    }

    const temporaryPassword = resolveEmployeePassword(input.password);
    const passwordHash = await hashPassword(temporaryPassword);
    await updateUserPasswordByIdAndOrganization(
      user._id.toString(),
      authUser.organizationId,
      passwordHash,
    );

    const email = (await getEmployeeEmail(employee.userId)) ?? user.email;
    return { email, temporaryPassword };
  }

  async createEmployee(
    authUser: AuthContext,
    input: CreateEmployeeRequest,
  ): Promise<CreateEmployeeResult> {
    if (!canManageEmployees(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const managerObjectId = await validateManager(
      input.managerId,
      authUser.organizationId,
    );

    const organizationObjectId = new mongoose.Types.ObjectId(authUser.organizationId);
    const temporaryPassword = resolveEmployeePassword(input.password);
    const passwordHash = await hashPassword(temporaryPassword);
    const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;

    let createdUser = null;
    let createdEmployee = null;

    try {
      const employeeCode = await generateEmployeeCode(authUser.organizationId);

      createdUser = await createUser({
        organizationId: organizationObjectId,
        name: fullName,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: UserRole.EMPLOYEE,
      });

      const employeeInput: CreateEmployeeInput = {
        organizationId: organizationObjectId,
        userId: createdUser._id,
        employeeCode,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        department: input.department.trim(),
        jobTitle: input.jobTitle.trim(),
        dateOfJoining: new Date(input.dateOfJoining),
        managerId: managerObjectId,
        location: input.location?.trim(),
        employmentType: input.employmentType,
      };

      createdEmployee = await createEmployeeRecord(employeeInput);

      const { User } = await import("../users/user.model.js");
      await User.findOneAndUpdate(
        { _id: createdUser._id, organizationId: organizationObjectId },
        { employeeId: createdEmployee._id },
      );

      return {
        employee: await toEmployeeProfile(createdEmployee, authUser.organizationId),
        temporaryPassword,
      };
    } catch (error) {
      if (createdEmployee) {
        await createdEmployee.deleteOne();
      }
      if (createdUser) {
        await createdUser.deleteOne();
      }
      handleDuplicateError(error);
    }
  }

  async updateEmployee(
    authUser: AuthContext,
    employeeId: string,
    input: UpdateEmployeeRequest,
  ): Promise<EmployeeProfile> {
    if (!canManageEmployees(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const existing = await findEmployeeByIdAndOrganization(
      employeeId,
      authUser.organizationId,
    );
    if (!existing) {
      throw new AppError("Employee not found", 404);
    }

    const updates: UpdateEmployeeInput = {};

    if (input.firstName !== undefined) updates.firstName = input.firstName.trim();
    if (input.lastName !== undefined) updates.lastName = input.lastName.trim();
    if (input.phone !== undefined) updates.phone = input.phone.trim();
    if (input.department !== undefined) updates.department = input.department.trim();
    if (input.jobTitle !== undefined) updates.jobTitle = input.jobTitle.trim();
    if (input.location !== undefined) updates.location = input.location.trim();
    if (input.employmentType !== undefined) updates.employmentType = input.employmentType;
    if (input.dateOfJoining !== undefined) {
      updates.dateOfJoining = new Date(input.dateOfJoining);
    }

    if (input.managerId !== undefined) {
      if (input.managerId === null || input.managerId === "") {
        updates.managerId = null;
      } else {
        updates.managerId = await validateManager(
          input.managerId,
          authUser.organizationId,
          employeeId,
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    const updated = await updateEmployeeByIdAndOrganization(
      employeeId,
      authUser.organizationId,
      updates,
    );

    if (!updated) {
      throw new AppError("Employee not found", 404);
    }

    if (updates.firstName || updates.lastName) {
      const fullName = `${updated.firstName} ${updated.lastName}`;
      await updateUserByIdAndOrganization(updated.userId.toString(), authUser.organizationId, {
        name: fullName,
      });
    }

    return toEmployeeProfile(updated, authUser.organizationId);
  }

  async updateEmployeeStatus(
    authUser: AuthContext,
    employeeId: string,
    input: UpdateEmployeeStatusRequest,
  ): Promise<EmployeeProfile> {
    if (!canManageEmployees(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const existing = await findEmployeeByIdAndOrganization(
      employeeId,
      authUser.organizationId,
    );
    if (!existing) {
      throw new AppError("Employee not found", 404);
    }

    const updated = await updateEmployeeByIdAndOrganization(
      employeeId,
      authUser.organizationId,
      { status: input.status },
    );

    if (!updated) {
      throw new AppError("Employee not found", 404);
    }

    const isActive = input.status !== EmployeeStatus.TERMINATED;
    await updateUserStatusByIdAndOrganization(
      updated.userId.toString(),
      authUser.organizationId,
      isActive,
    );

    return toEmployeeProfile(updated, authUser.organizationId);
  }

  async getOrgChart(authUser: AuthContext): Promise<{ roots: OrgChartNode[]; totalEmployees: number }> {
    const employees = await listActiveEmployeesByOrganization(authUser.organizationId);
    const emailMap = new Map<string, string>();
    await Promise.all(
      employees.map(async (employee) => {
        const email = (await getEmployeeEmail(employee.userId)) ?? "";
        emailMap.set(employee._id.toString(), email);
      }),
    );

    const nodes = new Map<string, OrgChartNode>();
    for (const employee of employees) {
      nodes.set(employee._id.toString(), {
        id: employee._id.toString(),
        name: `${employee.firstName} ${employee.lastName}`,
        jobTitle: employee.jobTitle,
        department: employee.department,
        managerId: employee.managerId?.toString(),
        status: employee.status,
        children: [],
      });
    }

    const roots: OrgChartNode[] = [];
    for (const employee of employees) {
      const node = nodes.get(employee._id.toString());
      if (!node) continue;
      const managerId = employee.managerId?.toString();
      if (managerId && nodes.has(managerId)) {
        nodes.get(managerId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    if (canManageEmployees(authUser.role)) {
      return { roots, totalEmployees: employees.length };
    }

    const viewer = await findEmployeeByUserIdAndOrganization(
      authUser.userId,
      authUser.organizationId,
    );
    if (!viewer) {
      throw new AppError("Employee profile required", 403);
    }

    const viewerId = viewer._id.toString();
    const directReports = await findDirectReportsByManager(viewerId, authUser.organizationId);
    if (directReports.length > 0) {
      const subtree = findOrgChartNode(roots, viewerId);
      return {
        roots: subtree ? [subtree] : [],
        totalEmployees: subtree ? countOrgChartNodes(subtree) : 0,
      };
    }

    const scopedRoots = buildSelfAndManagerChain(nodes, viewerId);
    return {
      roots: scopedRoots,
      totalEmployees: scopedRoots[0] ? countOrgChartNodes(scopedRoots[0]) : 0,
    };
  }

  async getDirectReports(
    authUser: AuthContext,
    employeeId: string,
  ): Promise<{ reports: DirectReportItem[] }> {
    const employee = await findEmployeeByIdAndOrganization(employeeId, authUser.organizationId);
    if (!employee) throw new AppError("Employee not found", 404);

    if (!canManageEmployees(authUser.role)) {
      const viewer = await findEmployeeByUserIdAndOrganization(
        authUser.userId,
        authUser.organizationId,
      );
      if (!viewer) throw new AppError("Employee not found", 404);

      const isSelf = viewer._id.toString() === employeeId;
      const isTheirManager = employee.managerId?.toString() === viewer._id.toString();
      if (!isSelf && !isTheirManager) {
        throw new AppError("Employee not found", 404);
      }
    }

    const reports = await findDirectReportsByManager(employeeId, authUser.organizationId);
    return {
      reports: reports.map((report) => ({
        id: report._id.toString(),
        name: `${report.firstName} ${report.lastName}`,
        jobTitle: report.jobTitle,
        department: report.department,
        status: report.status,
      })),
    };
  }
}

export const employeeService = new EmployeeService();
