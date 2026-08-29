import type { InjectOptions } from "light-my-request";

import type { buildApp } from "../../src/app.js";
import { hashPassword } from "../../src/utils/password.js";
import { User } from "../../src/modules/users/user.model.js";

type App = Awaited<ReturnType<typeof buildApp>>;

export const defaultEmployeePayload = {
  firstName: "Rahul",
  lastName: "Sharma",
  email: "rahul@example.com",
  phone: "9876543210",
  department: "Engineering",
  jobTitle: "Software Engineer",
  dateOfJoining: "2026-08-29",
  employmentType: "FULL_TIME" as const,
};

export async function createEmployeeViaApi(
  app: App,
  token: string,
  overrides: Partial<typeof defaultEmployeePayload & { managerId?: string }> = {},
  headers?: InjectOptions["headers"],
) {
  const email = overrides.email ?? `employee-${Date.now()}@example.com`;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/employees",
    headers: { authorization: `Bearer ${token}`, ...headers },
    payload: {
      ...defaultEmployeePayload,
      ...overrides,
      email,
    },
  });

  return response;
}

export async function createEmployeeWithKnownPassword(
  app: App,
  adminToken: string,
  email: string,
  password: string,
) {
  const response = await createEmployeeViaApi(app, adminToken, { email });
  if (response.statusCode === 201) {
    const passwordHash = await hashPassword(password);
    await User.updateOne({ email }, { passwordHash });
  }
  return response;
}

export async function loginViaApi(app: App, email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  return response.json().data.token as string;
}
