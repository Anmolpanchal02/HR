import { UserRole, type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import {
  findOrganizationById,
  resolveOrganizationSettings,
  updateOrganizationSettings,
} from "./organization.repository.js";
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  type OrganizationSettings,
  type WorkHoursSettings,
} from "./organization.types.js";

function canManageSettings(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.HR;
}

function validateTime(value: string, field: string): void {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new AppError(`${field} must be in HH:mm format`, 400);
  }
}

function validateWorkHours(input: Partial<WorkHoursSettings>): WorkHoursSettings {
  const base = DEFAULT_ORGANIZATION_SETTINGS.workHours;
  const startTime = input.startTime ?? base.startTime;
  const endTime = input.endTime ?? base.endTime;
  validateTime(startTime, "startTime");
  validateTime(endTime, "endTime");

  const workDays = input.workDays ?? base.workDays;
  if (!Array.isArray(workDays) || workDays.length === 0) {
    throw new AppError("workDays must include at least one day", 400);
  }

  return {
    startTime,
    endTime,
    timezone: input.timezone?.trim() || base.timezone,
    workDays,
    graceMinutes:
      typeof input.graceMinutes === "number" && input.graceMinutes >= 0
        ? Math.floor(input.graceMinutes)
        : base.graceMinutes,
  };
}

export class OrganizationService {
  async getSettings(authUser: AuthContext): Promise<OrganizationSettings> {
    const org = await findOrganizationById(authUser.organizationId);
    if (!org) throw new AppError("Organization not found", 404);
    return resolveOrganizationSettings(org);
  }

  async updateSettings(
    authUser: AuthContext,
    input: Partial<OrganizationSettings>,
  ): Promise<OrganizationSettings> {
    if (!canManageSettings(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const org = await findOrganizationById(authUser.organizationId);
    if (!org) throw new AppError("Organization not found", 404);

    const current = resolveOrganizationSettings(org);
    const next: OrganizationSettings = {
      workHours: validateWorkHours({ ...current.workHours, ...input.workHours }),
      leavePolicy: {
        ...current.leavePolicy,
        ...input.leavePolicy,
      },
    };

    const updated = await updateOrganizationSettings(authUser.organizationId, next);
    if (!updated) throw new AppError("Failed to update settings", 500);
    return resolveOrganizationSettings(updated);
  }
}

export const organizationService = new OrganizationService();
