import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";

import { buildApp } from "../src/app.js";
import { Task } from "../src/modules/tasks/task.model.js";
import { UserRole } from "../src/modules/users/user.types.js";
import {
  createEmployeeViaApi,
  createEmployeeWithKnownPassword,
  loginViaApi,
} from "./helpers/employees.js";
import {
  createProjectViaApi,
  createTaskViaApi,
} from "./helpers/projects.js";
import {
  authHeader,
  createMemberViaApi,
  registerOrganization,
  validPassword,
} from "./helpers/users.js";
import {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./helpers/database.js";

describe("Tasks API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    await setupTestDatabase();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  async function setupProject(adminToken: string, key = "PAY") {
    const response = await createProjectViaApi(app, adminToken, { key });
    expect(response.statusCode).toBe(201);
    return response.json().data.project.id as string;
  }

  async function createEngineerToken(adminToken: string, email: string) {
    await createMemberViaApi(app, adminToken, {
      name: "Engineer",
      email,
      role: UserRole.ENGINEER,
    });
    return loginViaApi(app, email, validPassword);
  }

  describe("POST /api/v1/tasks", () => {
    it("allows ADMIN to create task", async () => {
      const admin = await registerOrganization(app, { email: "admin@task.com" });
      const projectId = await setupProject(admin.token);

      const response = await createTaskViaApi(app, admin.token, projectId);
      expect(response.statusCode).toBe(201);
      expect(response.json().data.task.title).toBe("Fix payment API");
      expect(response.json().data.task.status).toBe("TODO");
    });

    it("allows HR to create task", async () => {
      const admin = await registerOrganization(app, { email: "admin@hr-task.com" });
      const projectId = await setupProject(admin.token);
      await createMemberViaApi(app, admin.token, {
        name: "HR",
        email: "hr@hr-task.com",
        role: UserRole.HR,
      });
      const hrToken = await loginViaApi(app, "hr@hr-task.com", validPassword);

      const response = await createTaskViaApi(app, hrToken, projectId);
      expect(response.statusCode).toBe(201);
    });

    it("allows ENGINEER to create task", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-task.com" });
      const projectId = await setupProject(admin.token);
      const engToken = await createEngineerToken(admin.token, "eng@eng-task.com");

      const response = await createTaskViaApi(app, engToken, projectId);
      expect(response.statusCode).toBe(201);
    });

    it("returns 403 for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-task.com" });
      const projectId = await setupProject(admin.token);
      await createEmployeeWithKnownPassword(app, admin.token, "emp@emp-task.com", validPassword);
      const empToken = await loginViaApi(app, "emp@emp-task.com", validPassword);

      const response = await createTaskViaApi(app, empToken, projectId);
      expect(response.statusCode).toBe(403);
    });

    it("blocks invalid project", async () => {
      const admin = await registerOrganization(app, { email: "admin@bad-proj.com" });
      const fakeProjectId = new mongoose.Types.ObjectId().toString();

      const response = await createTaskViaApi(app, admin.token, fakeProjectId);
      expect(response.statusCode).toBe(400);
    });

    it("blocks cross-tenant project", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Task Org A",
        email: "admin@taska.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Task Org B",
        email: "admin@taskb.com",
      });
      const projectB = await setupProject(orgB.token, "B");

      const response = await createTaskViaApi(app, orgA.token, projectB);
      expect(response.statusCode).toBe(400);
    });

    it("blocks invalid assignee", async () => {
      const admin = await registerOrganization(app, { email: "admin@bad-assign.com" });
      const projectId = await setupProject(admin.token);

      const response = await createTaskViaApi(app, admin.token, projectId, {
        assigneeId: new mongoose.Types.ObjectId().toString(),
      });
      expect(response.statusCode).toBe(400);
    });

    it("blocks cross-tenant assignee", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Assign Org A",
        email: "admin@assigna.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Assign Org B",
        email: "admin@assignb.com",
      });
      const projectId = await setupProject(orgA.token);
      const employeeB = await createEmployeeViaApi(app, orgB.token, { email: "assign@orgb.com" });
      const assigneeId = employeeB.json().data.employee.id;

      const response = await createTaskViaApi(app, orgA.token, projectId, { assigneeId });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("enforces tenant isolation", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "List Task Org A",
        email: "admin@lista-task.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "List Task Org B",
        email: "admin@listb-task.com",
      });
      const projectA = await setupProject(orgA.token, "A");
      const projectB = await setupProject(orgB.token, "B");
      await createTaskViaApi(app, orgA.token, projectA, { title: "Task A" });
      await createTaskViaApi(app, orgB.token, projectB, { title: "Task B" });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/tasks",
        headers: authHeader(orgA.token),
      });

      expect(response.json().data.tasks).toHaveLength(1);
      expect(response.json().data.tasks[0].title).toBe("Task A");
    });

    it("supports filters and search", async () => {
      const admin = await registerOrganization(app, { email: "admin@filter-task.com" });
      const projectId = await setupProject(admin.token);
      const employee = await createEmployeeViaApi(app, admin.token, { email: "rahul@filter.com" });
      const assigneeId = employee.json().data.employee.id;

      await createTaskViaApi(app, admin.token, projectId, {
        title: "Fix payment API",
        priority: "HIGH",
        assigneeId,
      });
      await createTaskViaApi(app, admin.token, projectId, {
        title: "Update docs",
        priority: "LOW",
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/tasks?search=payment&priority=HIGH&projectId=${projectId}&assigneeId=${assigneeId}`,
        headers: authHeader(admin.token),
      });

      expect(response.json().data.tasks).toHaveLength(1);
      expect(response.json().data.tasks[0].title).toBe("Fix payment API");
    });

    it("supports pagination", async () => {
      const admin = await registerOrganization(app, { email: "admin@page-task.com" });
      const projectId = await setupProject(admin.token);
      for (let i = 0; i < 3; i += 1) {
        await createTaskViaApi(app, admin.token, projectId, { title: `Task ${i}` });
      }

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/tasks?page=1&limit=2",
        headers: authHeader(admin.token),
      });

      const body = response.json().data;
      expect(body.tasks).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
    });

    it("returns only assigned tasks for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-list-task.com" });
      const projectId = await setupProject(admin.token);
      const employeeRes = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "emp@emp-list-task.com",
        validPassword,
      );
      const assigneeId = employeeRes.json().data.employee.id as string;
      const empToken = await loginViaApi(app, "emp@emp-list-task.com", validPassword);

      await createTaskViaApi(app, admin.token, projectId, {
        title: "Assigned to employee",
        assigneeId,
      });
      await createTaskViaApi(app, admin.token, projectId, {
        title: "Assigned to someone else",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/tasks",
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.tasks).toHaveLength(1);
      expect(response.json().data.tasks[0].title).toBe("Assigned to employee");
    });

    it("ignores assigneeId override from EMPLOYEE client", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-override.com" });
      const projectId = await setupProject(admin.token);
      const employeeA = await createEmployeeViaApi(app, admin.token, { email: "empa@override.com" });
      const employeeB = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "empb@override.com",
        validPassword,
      );
      const assigneeB = employeeB.json().data.employee.id as string;
      const assigneeA = employeeA.json().data.employee.id as string;
      const empToken = await loginViaApi(app, "empb@override.com", validPassword);

      await createTaskViaApi(app, admin.token, projectId, {
        title: "Task for A",
        assigneeId: assigneeA,
      });
      await createTaskViaApi(app, admin.token, projectId, {
        title: "Task for B",
        assigneeId: assigneeB,
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/tasks?assigneeId=${assigneeA}`,
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.tasks).toHaveLength(1);
      expect(response.json().data.tasks[0].title).toBe("Task for B");
    });
  });

  describe("GET /api/v1/tasks/:id", () => {
    it("returns task with related project and assignee", async () => {
      const admin = await registerOrganization(app, { email: "admin@get-task.com" });
      const projectId = await setupProject(admin.token);
      const employee = await createEmployeeViaApi(app, admin.token, { email: "rahul@get.com" });
      const assigneeId = employee.json().data.employee.id;
      const created = await createTaskViaApi(app, admin.token, projectId, { assigneeId });
      const taskId = created.json().data.task.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.task.project?.key).toBe("PAY");
      expect(response.json().data.task.assignee?.name).toContain("Rahul");
    });

    it("blocks EMPLOYEE from task not assigned to them", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-get-task.com" });
      const projectId = await setupProject(admin.token);
      await createEmployeeWithKnownPassword(app, admin.token, "emp@emp-get-task.com", validPassword);
      const empToken = await loginViaApi(app, "emp@emp-get-task.com", validPassword);
      const created = await createTaskViaApi(app, admin.token, projectId, {
        title: "Not assigned",
      });
      const taskId = created.json().data.task.id as string;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/tasks/:id", () => {
    it("allows ADMIN to fully update task", async () => {
      const admin = await registerOrganization(app, { email: "admin@upd-task.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: {
          title: "Updated title",
          status: "IN_PROGRESS",
          priority: "CRITICAL",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.task.title).toBe("Updated title");
      expect(response.json().data.task.status).toBe("IN_PROGRESS");
    });

    it("allows EMPLOYEE to update status on own assigned task only", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-upd.com" });
      const projectId = await setupProject(admin.token);
      const employee = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "worker@emp.com",
        validPassword,
      );
      const assigneeId = employee.json().data.employee.id;
      const created = await createTaskViaApi(app, admin.token, projectId, { assigneeId });
      const taskId = created.json().data.task.id;
      const empToken = await loginViaApi(app, "worker@emp.com", validPassword);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(empToken),
        payload: { status: "IN_PROGRESS" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.task.status).toBe("IN_PROGRESS");
    });

    it("blocks EMPLOYEE from updating unassigned task", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-block.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;
      await createEmployeeWithKnownPassword(app, admin.token, "worker2@emp.com", validPassword);
      const empToken = await loginViaApi(app, "worker2@emp.com", validPassword);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(empToken),
        payload: { status: "IN_PROGRESS" },
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks EMPLOYEE from reassigning task", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-reassign.com" });
      const projectId = await setupProject(admin.token);
      const employee = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "worker3@emp.com",
        validPassword,
      );
      const assigneeId = employee.json().data.employee.id;
      const other = await createEmployeeViaApi(app, admin.token, { email: "other@emp.com" });
      const otherId = other.json().data.employee.id;
      const created = await createTaskViaApi(app, admin.token, projectId, { assigneeId });
      const taskId = created.json().data.task.id;
      const empToken = await loginViaApi(app, "worker3@emp.com", validPassword);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(empToken),
        payload: { assigneeId: otherId },
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks EMPLOYEE from changing priority", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-pri.com" });
      const projectId = await setupProject(admin.token);
      const employee = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "worker4@emp.com",
        validPassword,
      );
      const assigneeId = employee.json().data.employee.id;
      const created = await createTaskViaApi(app, admin.token, projectId, { assigneeId });
      const taskId = created.json().data.task.id;
      const empToken = await loginViaApi(app, "worker4@emp.com", validPassword);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(empToken),
        payload: { priority: "CRITICAL" },
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks cross-tenant update", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Cross Task Org A",
        email: "admin@cross-task.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Cross Task Org B",
        email: "admin@crossb-task.com",
      });
      const projectB = await setupProject(orgB.token, "XB");
      const created = await createTaskViaApi(app, orgB.token, projectB);
      const taskId = created.json().data.task.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(orgA.token),
        payload: { title: "Hacked" },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Task status transitions", () => {
    it("allows valid transitions", async () => {
      const admin = await registerOrganization(app, { email: "admin@trans.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;

      const steps = ["IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
      for (const status of steps) {
        const response = await app.inject({
          method: "PATCH",
          url: `/api/v1/tasks/${taskId}`,
          headers: authHeader(admin.token),
          payload: { status },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json().data.task.status).toBe(status);
      }
    });

    it("allows BLOCKED ↔ IN_PROGRESS transitions", async () => {
      const admin = await registerOrganization(app, { email: "admin@blocked.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;

      await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: { status: "IN_PROGRESS" },
      });

      const blocked = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: { status: "BLOCKED" },
      });
      expect(blocked.statusCode).toBe(200);

      const resumed = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: { status: "IN_PROGRESS" },
      });
      expect(resumed.statusCode).toBe(200);
    });

    it("rejects invalid transitions", async () => {
      const admin = await registerOrganization(app, { email: "admin@invalid-trans.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: { status: "DONE" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("cancels task without physical delete", async () => {
      const admin = await registerOrganization(app, { email: "admin@cancel.com" });
      const projectId = await setupProject(admin.token);
      const created = await createTaskViaApi(app, admin.token, projectId);
      const taskId = created.json().data.task.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/tasks/${taskId}`,
        headers: authHeader(admin.token),
        payload: { status: "CANCELLED" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.task.status).toBe("CANCELLED");

      const stillExists = await Task.findById(taskId);
      expect(stillExists).not.toBeNull();
    });
  });
});
