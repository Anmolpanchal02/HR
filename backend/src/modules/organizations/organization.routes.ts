import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { UserRole } from "../users/user.types.js";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "./organization.controller.js";
import {
  errorResponseSchema,
  updateOrganizationSettingsBodySchema,
} from "./organization.schema.js";

const authenticated = [authenticate];
const adminOrHr = [authenticate, requireRoles(UserRole.ADMIN, UserRole.HR)];

export async function organizationRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/settings",
    {
      preHandler: authenticated,
      schema: {
        response: { 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    getOrganizationSettings,
  );

  app.patch(
    "/settings",
    {
      preHandler: adminOrHr,
      schema: {
        body: updateOrganizationSettingsBodySchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    updateOrganizationSettings,
  );
}
