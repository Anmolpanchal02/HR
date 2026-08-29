import type { InjectOptions } from "light-my-request";

import type { buildApp } from "../../src/app.js";
import { UserRole } from "../../src/modules/users/user.types.js";

export const validPassword = "StrongPassword123";

type App = Awaited<ReturnType<typeof buildApp>>;

export interface RegisteredUser {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export async function registerOrganization(
  app: App,
  overrides: {
    organizationName?: string;
    name?: string;
    email?: string;
    password?: string;
  } = {},
): Promise<RegisteredUser> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      organizationName: overrides.organizationName ?? "Test Organization",
      name: overrides.name ?? "Admin User",
      email: overrides.email ?? `admin-${Date.now()}@example.com`,
      password: overrides.password ?? validPassword,
    },
  });

  const body = response.json();
  return {
    token: body.data.token,
    user: body.data.user,
  };
}

export function authHeader(token: string): InjectOptions["headers"] {
  return { authorization: `Bearer ${token}` };
}

export async function createMemberViaApi(
  app: App,
  token: string,
  payload: {
    name: string;
    email: string;
    password?: string;
    role: string;
    organizationId?: string;
  },
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/users",
    headers: authHeader(token),
    payload: {
      password: validPassword,
      ...payload,
    },
  });
}
