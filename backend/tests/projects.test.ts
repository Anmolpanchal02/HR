import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";

import { buildApp } from "../src/app.js";
import { Project } from "../src/modules/projects/project.model.js";
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

describe("Projects API", () => {
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

  async function createEngineerToken(adminToken: string, email: string) {
    await createMemberViaApi(app, adminToken, {
      name: "Engineer",
      email,
      role: UserRole.ENGINEER,
    });
    return loginViaApi(app, email, validPassword);
  }

  async function createEmployeeUser(adminToken: string, email: string) {
    await createEmployeeWithKnownPassword(app, adminToken, email, validPassword);
    return loginViaApi(app, email, validPassword);
  }

  describe("POST /api/v1/projects", () => {
    it("allows ADMIN to create project", async () => {
      const admin = await registerOrganization(app, { email: "admin@proj.com" });
      const response = await createProjectViaApi(app, admin.token, { key: "PAY" });

      expect(response.statusCode).toBe(201);
      const project = response.json().data.project;
      expect(project.key).toBe("PAY");
      expect(project.name).toBe("Payment Platform");
    });

    it("allows HR to create project", async () => {
      const admin = await registerOrganization(app, { email: "admin@hr-proj.com" });
      await createMemberViaApi(app, admin.token, {
        name: "HR",
        email: "hr@hr-proj.com",
        role: UserRole.HR,
      });
      const hrToken = await loginViaApi(app, "hr@hr-proj.com", validPassword);

      const response = await createProjectViaApi(app, hrToken, { key: "HR" });
      expect(response.statusCode).toBe(201);
    });

    it("allows ENGINEER to create project", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-proj.com" });
      const engToken = await createEngineerToken(admin.token, "eng@eng-proj.com");

      const response = await createProjectViaApi(app, engToken, { key: "WEB" });
      expect(response.statusCode).toBe(201);
    });

    it("returns 403 for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-proj.com" });
      const empToken = await createEmployeeUser(admin.token, "emp@emp-proj.com");

      const response = await createProjectViaApi(app, empToken, { key: "X" });
      expect(response.statusCode).toBe(403);
    });

    it("blocks invalid owner", async () => {
      const admin = await registerOrganization(app, { email: "admin@bad-owner.com" });
      const fakeOwnerId = new mongoose.Types.ObjectId().toString();

      const response = await createProjectViaApi(app, admin.token, {
        key: "BAD",
        ownerId: fakeOwnerId,
      });
      expect(response.statusCode).toBe(400);
    });

    it("blocks cross-tenant owner", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Org A",
        email: "admin@orga-proj.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Org B",
        email: "admin@orgb-proj.com",
      });
      const employeeB = await createEmployeeViaApi(app, orgB.token, { email: "owner@orgb.com" });
      const ownerBId = employeeB.json().data.employee.id;

      const response = await createProjectViaApi(app, orgA.token, {
        key: "CROSS",
        ownerId: ownerBId,
      });
      expect(response.statusCode).toBe(400);
    });

    it("blocks duplicate project key in organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@dup-key.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY" });

      const response = await createProjectViaApi(app, admin.token, { key: "PAY" });
      expect(response.statusCode).toBe(409);
    });

    it("rejects organizationId spoofing from client", async () => {
      const admin = await registerOrganization(app, { email: "admin@spoof-proj.com" });
      const otherOrgId = new mongoose.Types.ObjectId().toString();

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects",
        headers: authHeader(admin.token),
        payload: {
          name: "Spoof",
          key: "SPF",
          organizationId: otherOrgId,
        },
      });
      expect(response.statusCode).toBe(400);

      const stored = await Project.findOne({ key: "SPF" });
      expect(stored).toBeNull();
    });

    it("normalizes project key to uppercase", async () => {
      const admin = await registerOrganization(app, { email: "admin@upper.com" });
      const response = await createProjectViaApi(app, admin.token, { key: "pay" });

      expect(response.statusCode).toBe(201);
      expect(response.json().data.project.key).toBe("PAY");
    });
  });

  describe("GET /api/v1/projects", () => {
    it("allows authenticated users to list projects", async () => {
      const admin = await registerOrganization(app, { email: "admin@list-proj.com" });
      await createProjectViaApi(app, admin.token, { key: "A1", name: "Alpha" });
      const empToken = await createEmployeeUser(admin.token, "emp@list-proj.com");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/projects",
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.projects).toHaveLength(1);
    });

    it("enforces tenant isolation", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Org A",
        email: "admin@lista.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Org B",
        email: "admin@listb.com",
      });
      await createProjectViaApi(app, orgA.token, { key: "A", name: "Org A Project" });
      await createProjectViaApi(app, orgB.token, { key: "B", name: "Org B Project" });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/projects",
        headers: authHeader(orgA.token),
      });

      const projects = response.json().data.projects;
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe("Org A Project");
    });

    it("supports search filter", async () => {
      const admin = await registerOrganization(app, { email: "admin@search-proj.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY", name: "Payment Platform" });
      await createProjectViaApi(app, admin.token, {
        key: "HR",
        name: "HR Portal",
        description: "Internal HR tools",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/projects?search=payment",
        headers: authHeader(admin.token),
      });

      expect(response.json().data.projects).toHaveLength(1);
      expect(response.json().data.projects[0].key).toBe("PAY");
    });

    it("supports status and priority filters", async () => {
      const admin = await registerOrganization(app, { email: "admin@filter-proj.com" });
      await createProjectViaApi(app, admin.token, {
        key: "F1",
        name: "Active High",
        status: "ACTIVE",
        priority: "HIGH",
      });
      await createProjectViaApi(app, admin.token, {
        key: "F2",
        name: "Planning Low",
        status: "PLANNING",
        priority: "LOW",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/projects?status=ACTIVE&priority=HIGH",
        headers: authHeader(admin.token),
      });

      expect(response.json().data.projects).toHaveLength(1);
      expect(response.json().data.projects[0].key).toBe("F1");
    });

    it("supports pagination", async () => {
      const admin = await registerOrganization(app, { email: "admin@page-proj.com" });
      for (let i = 0; i < 3; i += 1) {
        await createProjectViaApi(app, admin.token, { key: `P${i}`, name: `Project ${i}` });
      }

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/projects?page=1&limit=2",
        headers: authHeader(admin.token),
      });

      const body = response.json().data;
      expect(body.projects).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /api/v1/projects/:id", () => {
    it("returns project detail with task summary", async () => {
      const admin = await registerOrganization(app, { email: "admin@get-proj.com" });
      const created = await createProjectViaApi(app, admin.token, { key: "DET" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.project.taskSummary).toBeDefined();
      expect(response.json().data.project.taskSummary.TODO).toBe(0);
    });

    it("returns 404 for cross-tenant project", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Get Org A",
        email: "admin@geta.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Get Org B",
        email: "admin@getb.com",
      });
      const created = await createProjectViaApi(app, orgB.token, { key: "X" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(orgA.token),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/projects/:id", () => {
    it("allows ADMIN to update project", async () => {
      const admin = await registerOrganization(app, { email: "admin@patch-proj.com" });
      const created = await createProjectViaApi(app, admin.token, { key: "UPD" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(admin.token),
        payload: { name: "Updated Name", status: "ACTIVE" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.project.name).toBe("Updated Name");
      expect(response.json().data.project.status).toBe("ACTIVE");
    });

    it("returns 403 for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-patch.com" });
      const created = await createProjectViaApi(app, admin.token, { key: "EP" });
      const projectId = created.json().data.project.id;
      const empToken = await createEmployeeUser(admin.token, "emp@emp-patch.com");

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(empToken),
        payload: { name: "Hacked" },
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks cross-tenant update", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Patch Org A",
        email: "admin@patcha.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Patch Org B",
        email: "admin@patchb.com",
      });
      const created = await createProjectViaApi(app, orgB.token, { key: "PB" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(orgA.token),
        payload: { name: "Stolen" },
      });

      expect(response.statusCode).toBe(404);
    });

    it("blocks invalid owner on update", async () => {
      const admin = await registerOrganization(app, { email: "admin@bad-upd.com" });
      const created = await createProjectViaApi(app, admin.token, { key: "BO" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${projectId}`,
        headers: authHeader(admin.token),
        payload: { ownerId: new mongoose.Types.ObjectId().toString() },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("PATCH /api/v1/projects/:id/archive", () => {
    it("archives project instead of deleting", async () => {
      const admin = await registerOrganization(app, { email: "admin@arch.com" });
      const created = await createProjectViaApi(app, admin.token, { key: "ARC" });
      const projectId = created.json().data.project.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${projectId}/archive`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.project.status).toBe("ARCHIVED");

      const stillExists = await Project.findById(projectId);
      expect(stillExists).not.toBeNull();
    });
  });
});
