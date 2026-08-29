import { Organization, type IOrganization } from "./organization.model.js";

export async function createOrganization(
  name: string,
  slug: string,
): Promise<IOrganization> {
  return Organization.create({ name, slug });
}

export async function findOrganizationBySlug(
  slug: string,
): Promise<IOrganization | null> {
  return Organization.findOne({ slug });
}

export async function findOrganizationById(
  id: string,
): Promise<IOrganization | null> {
  return Organization.findById(id);
}
