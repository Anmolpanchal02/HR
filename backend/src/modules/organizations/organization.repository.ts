import { Organization, type IOrganization } from "./organization.model.js";
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  type OrganizationSettings,
} from "./organization.types.js";

export async function createOrganization(name: string, slug: string): Promise<IOrganization> {
  return Organization.create({ name, slug, settings: DEFAULT_ORGANIZATION_SETTINGS });
}

export async function findOrganizationBySlug(slug: string): Promise<IOrganization | null> {
  return Organization.findOne({ slug });
}

export async function findOrganizationById(id: string): Promise<IOrganization | null> {
  return Organization.findById(id);
}

export async function updateOrganizationSettings(
  organizationId: string,
  settings: OrganizationSettings,
): Promise<IOrganization | null> {
  return Organization.findByIdAndUpdate(
    organizationId,
    { settings },
    { new: true, runValidators: true },
  );
}

export function resolveOrganizationSettings(org: IOrganization): OrganizationSettings {
  return {
    workHours: {
      ...DEFAULT_ORGANIZATION_SETTINGS.workHours,
      ...org.settings?.workHours,
    },
    leavePolicy: {
      ...DEFAULT_ORGANIZATION_SETTINGS.leavePolicy,
      ...org.settings?.leavePolicy,
    },
  };
}
