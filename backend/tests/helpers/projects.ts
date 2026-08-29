import type { InjectOptions } from "light-my-request";

import type { buildApp } from "../../src/app.js";

type App = Awaited<ReturnType<typeof buildApp>>;

export const defaultProjectPayload = {
  name: "Payment Platform",
  key: "PAY",
  description: "Payment system modernization",
  status: "PLANNING" as const,
  priority: "HIGH" as const,
  startDate: "2026-09-01",
  targetDate: "2026-12-01",
};

export async function createProjectViaApi(
  app: App,
  token: string,
  overrides: Partial<typeof defaultProjectPayload & { ownerId?: string }> = {},
  headers?: InjectOptions["headers"],
) {
  const key = overrides.key ?? `P${Date.now().toString().slice(-4)}`;

  return app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: { authorization: `Bearer ${token}`, ...headers },
    payload: {
      ...defaultProjectPayload,
      ...overrides,
      key,
    },
  });
}

export const defaultTaskPayload = {
  title: "Fix payment API",
  description: "Investigate timeout issue",
  priority: "HIGH" as const,
  dueDate: "2026-09-15",
};

export async function createTaskViaApi(
  app: App,
  token: string,
  projectId: string,
  overrides: Partial<typeof defaultTaskPayload & { assigneeId?: string }> = {},
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/tasks",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      ...defaultTaskPayload,
      ...overrides,
      projectId,
    },
  });
}
