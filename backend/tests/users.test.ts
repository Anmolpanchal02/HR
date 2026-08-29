import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { User } from "../src/modules/users/user.model.js";
import { UserRole } from "../src/modules/users/user.types.js";
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

describe("Users API", () => {
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

  describe("GET /api/v1/users", () => {
    it("allows ADMIN to list users in their organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@orga.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Rahul",
        email: "rahul@orga.com",
        role: UserRole.ENGINEER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      const users = response.json().data.users;
      expect(users.length).toBe(2);
      expect(users.every((u: { passwordHash?: string }) => u.passwordHash === undefined)).toBe(
        true,
      );
    });

    it("allows HR to list users", async () => {
      const admin = await registerOrganization(app, { email: "admin@orghr.com" });
      const hrCreate = await createMemberViaApi(app, admin.token, {
        name: "HR User",
        email: "hr@orghr.com",
        role: UserRole.HR,
      });
      const hrToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "hr@orghr.com", password: validPassword },
        })
      ).json().data.token;

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: authHeader(hrToken),
      });

      expect(response.statusCode).toBe(200);
      expect(hrCreate.statusCode).toBe(201);
    });

    it("returns 403 for ENGINEER", async () => {
      const admin = await registerOrganization(app, { email: "admin@orgeng.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Engineer",
        email: "eng@orgeng.com",
        role: UserRole.ENGINEER,
      });
      const engineerToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "eng@orgeng.com", password: validPassword },
        })
      ).json().data.token;

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: authHeader(engineerToken),
      });

      expect(response.statusCode).toBe(403);
    });

    it("returns 403 for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@orgemp.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Employee",
        email: "emp@orgemp.com",
        role: UserRole.EMPLOYEE,
      });
      const employeeToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "emp@orgemp.com", password: validPassword },
        })
      ).json().data.token;

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: authHeader(employeeToken),
      });

      expect(response.statusCode).toBe(403);
    });

    it("returns only same-organization users", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Org Alpha",
        email: "admin@alpha.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Org Beta",
        email: "admin@beta.com",
      });

      await createMemberViaApi(app, orgA.token, {
        name: "Alpha Engineer",
        email: "alpha-eng@alpha.com",
        role: UserRole.ENGINEER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: authHeader(orgA.token),
      });

      const emails = response.json().data.users.map((u: { email: string }) => u.email);
      expect(emails).toContain("admin@alpha.com");
      expect(emails).toContain("alpha-eng@alpha.com");
      expect(emails).not.toContain("admin@beta.com");
      expect(orgB.user.organizationId).not.toBe(orgA.user.organizationId);
    });
  });

  describe("POST /api/v1/users", () => {
    it("allows ADMIN to create HR, ENGINEER, and EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@create.com" });

      for (const role of [UserRole.HR, UserRole.ENGINEER, UserRole.EMPLOYEE]) {
        const response = await createMemberViaApi(app, admin.token, {
          name: `${role} User`,
          email: `${role.toLowerCase()}@create.com`,
          role,
        });
        expect(response.statusCode).toBe(201);
        expect(response.json().data.user.role).toBe(role);
      }
    });

    it("allows HR to create ENGINEER and EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@hrcreate.com" });
      await createMemberViaApi(app, admin.token, {
        name: "HR Person",
        email: "hr@hrcreate.com",
        role: UserRole.HR,
      });
      const hrToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "hr@hrcreate.com", password: validPassword },
        })
      ).json().data.token;

      for (const role of [UserRole.ENGINEER, UserRole.EMPLOYEE]) {
        const response = await createMemberViaApi(app, hrToken, {
          name: `${role} Member`,
          email: `${role.toLowerCase()}@hrcreate.com`,
          role,
        });
        expect(response.statusCode).toBe(201);
      }
    });

    it("prevents HR from creating HR", async () => {
      const admin = await registerOrganization(app, { email: "admin@nohr.com" });
      await createMemberViaApi(app, admin.token, {
        name: "HR One",
        email: "hr1@nohr.com",
        role: UserRole.HR,
      });
      const hrToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "hr1@nohr.com", password: validPassword },
        })
      ).json().data.token;

      const response = await createMemberViaApi(app, hrToken, {
        name: "HR Two",
        email: "hr2@nohr.com",
        role: UserRole.HR,
      });

      expect(response.statusCode).toBe(403);
    });

    it("rejects ADMIN role in request body", async () => {
      const admin = await registerOrganization(app, { email: "admin@noadmin.com" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: authHeader(admin.token),
        payload: {
          name: "Bad Admin",
          email: "badadmin@noadmin.com",
          password: validPassword,
          role: UserRole.ADMIN,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("prevents ENGINEER from creating users", async () => {
      const admin = await registerOrganization(app, { email: "admin@noengcreate.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Engineer",
        email: "eng@noengcreate.com",
        role: UserRole.ENGINEER,
      });
      const engineerToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "eng@noengcreate.com", password: validPassword },
        })
      ).json().data.token;

      const response = await createMemberViaApi(app, engineerToken, {
        name: "Blocked",
        email: "blocked@noengcreate.com",
        role: UserRole.EMPLOYEE,
      });

      expect(response.statusCode).toBe(403);
    });

    it("returns 409 for duplicate email in same organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@dup.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Rahul",
        email: "rahul@dup.com",
        role: UserRole.ENGINEER,
      });

      const response = await createMemberViaApi(app, admin.token, {
        name: "Rahul Duplicate",
        email: "rahul@dup.com",
        role: UserRole.EMPLOYEE,
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().message).toBe(
        "A user with this email already exists in your organization",
      );
    });

    it("allows same email in different organizations", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Dup Org A",
        email: "admin-a@shared.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Dup Org B",
        email: "admin-b@shared.com",
      });

      const responseA = await createMemberViaApi(app, orgA.token, {
        name: "Shared Email User",
        email: "shared@gmail.com",
        role: UserRole.ENGINEER,
      });
      const responseB = await createMemberViaApi(app, orgB.token, {
        name: "Shared Email User",
        email: "shared@gmail.com",
        role: UserRole.ENGINEER,
      });

      expect(responseA.statusCode).toBe(201);
      expect(responseB.statusCode).toBe(201);
    });

    it("rejects organizationId in request body", async () => {
      const admin = await registerOrganization(app, { email: "admin@orgid.com" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: authHeader(admin.token),
        payload: {
          name: "Injected Org",
          email: "injected@orgid.com",
          password: validPassword,
          role: UserRole.ENGINEER,
          organizationId: "507f1f77bcf86cd799439011",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("stores hashed password and never returns passwordHash", async () => {
      const admin = await registerOrganization(app, { email: "admin@hash.com" });
      const response = await createMemberViaApi(app, admin.token, {
        name: "Hash Test",
        email: "hash@hash.com",
        role: UserRole.ENGINEER,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().data.user.passwordHash).toBeUndefined();

      const stored = await User.findOne({ email: "hash@hash.com" }).select("+passwordHash");
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe(validPassword);
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("returns user from same organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@getone.com" });
      const created = await createMemberViaApi(app, admin.token, {
        name: "Target User",
        email: "target@getone.com",
        role: UserRole.ENGINEER,
      });
      const userId = created.json().data.user.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/users/${userId}`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.user.email).toBe("target@getone.com");
    });

    it("returns 404 for cross-tenant access", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Get Org A",
        email: "admin@geta.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Get Org B",
        email: "admin@getb.com",
      });
      const memberB = await createMemberViaApi(app, orgB.token, {
        name: "Org B User",
        email: "member@getb.com",
        role: UserRole.ENGINEER,
      });
      const userId = memberB.json().data.user.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/users/${userId}`,
        headers: authHeader(orgA.token),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/users/:id", () => {
    it("allows valid role change by ADMIN", async () => {
      const admin = await registerOrganization(app, { email: "admin@patch.com" });
      const created = await createMemberViaApi(app, admin.token, {
        name: "Patch User",
        email: "patch@patch.com",
        role: UserRole.EMPLOYEE,
      });
      const userId = created.json().data.user.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}`,
        headers: authHeader(admin.token),
        payload: { role: UserRole.ENGINEER },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.user.role).toBe(UserRole.ENGINEER);
    });

    it("blocks privilege escalation to ADMIN", async () => {
      const admin = await registerOrganization(app, { email: "admin@escalate.com" });
      const created = await createMemberViaApi(app, admin.token, {
        name: "Escalate User",
        email: "escalate@escalate.com",
        role: UserRole.EMPLOYEE,
      });
      const userId = created.json().data.user.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}`,
        headers: authHeader(admin.token),
        payload: { role: UserRole.ADMIN },
      });

      expect(response.statusCode).toBe(400);
    });

    it("blocks cross-tenant modification", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Patch Org A",
        email: "admin@patcha.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Patch Org B",
        email: "admin@patchb.com",
      });
      const memberB = await createMemberViaApi(app, orgB.token, {
        name: "Patch Target",
        email: "target@patchb.com",
        role: UserRole.EMPLOYEE,
      });
      const userId = memberB.json().data.user.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}`,
        headers: authHeader(orgA.token),
        payload: { name: "Hacked Name" },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/users/:id/status", () => {
    it("deactivates and activates a user", async () => {
      const admin = await registerOrganization(app, { email: "admin@status.com" });
      const created = await createMemberViaApi(app, admin.token, {
        name: "Status User",
        email: "status@status.com",
        role: UserRole.ENGINEER,
      });
      const userId = created.json().data.user.id;

      const deactivate = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}/status`,
        headers: authHeader(admin.token),
        payload: { isActive: false },
      });
      expect(deactivate.statusCode).toBe(200);
      expect(deactivate.json().data.user.isActive).toBe(false);

      const activate = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}/status`,
        headers: authHeader(admin.token),
        payload: { isActive: true },
      });
      expect(activate.statusCode).toBe(200);
      expect(activate.json().data.user.isActive).toBe(true);
    });

    it("prevents HR from deactivating another HR user", async () => {
      const admin = await registerOrganization(app, { email: "admin@hrstatus.com" });
      await createMemberViaApi(app, admin.token, {
        name: "HR Actor",
        email: "hractor@hrstatus.com",
        role: UserRole.HR,
      });
      await createMemberViaApi(app, admin.token, {
        name: "HR Target",
        email: "hrtarget@hrstatus.com",
        role: UserRole.HR,
      });

      const hrToken = (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          payload: { email: "hractor@hrstatus.com", password: validPassword },
        })
      ).json().data.token;

      const target = await User.findOne({ email: "hrtarget@hrstatus.com" });

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${target!._id.toString()}/status`,
        headers: authHeader(hrToken),
        payload: { isActive: false },
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks cross-tenant status change", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Status Org A",
        email: "admin@statusa.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Status Org B",
        email: "admin@statusb.com",
      });
      const memberB = await createMemberViaApi(app, orgB.token, {
        name: "Status Target",
        email: "status-target@statusb.com",
        role: UserRole.EMPLOYEE,
      });
      const userId = memberB.json().data.user.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${userId}/status`,
        headers: authHeader(orgA.token),
        payload: { isActive: false },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
