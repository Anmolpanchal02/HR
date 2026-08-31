import { apiClient } from "@/lib/api/client";
import type { OrganizationApiResponse, OrganizationSettings } from "@/types/organization";

export async function getOrganizationSettings(): Promise<
  OrganizationApiResponse<{ settings: OrganizationSettings }>
> {
  return apiClient.get("/organization/settings", true);
}

export async function updateOrganizationSettings(
  settings: Partial<OrganizationSettings>,
): Promise<OrganizationApiResponse<{ settings: OrganizationSettings }>> {
  return apiClient.patch("/organization/settings", settings, true);
}
