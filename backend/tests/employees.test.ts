import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { Employee } from "../src/modules/employees/employee.model.js";
import { User } from "../src/modules/users/user.model.js";
import { UserRole } from "../src/modules/users/user.types.js";
import {
  createEmployeeViaApi,
  createEmployeeWithKnownPassword,
  defaultEmployeePayload,
  loginViaApi,
} from "./helpers/employees.js";
import { authHeader, registerOrganization, validPassword } from "./helpers/users.js";
import {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./helpers/database.js";

describe("Employees API", () => {
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

  describe("POST /api/v1/employees", () => {
    it("allows ADMIN to create employee with linked user", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp.com" });
      const response = await createEmployeeViaApi(app, admin.token, {
        email: "rahul@emp.com",
      });

      expect(response.statusCode).toBe(201);
      const body = response.json().data;
      const employee = body.employee;
      expect(employee.employeeCode).toMatch(/^EMP-/);
      expect(employee.email).toBe("rahul@emp.com");
      expect(body.temporaryPassword).toBeDefined();
      expect(typeof body.temporaryPassword).toBe("string");
      expect(body.temporaryPassword.length).toBeGreaterThan(8);

      const user = await User.findOne({ email: "rahul@emp.com" }).select("+passwordHash");
      expect(user?.role).toBe(UserRole.EMPLOYEE);
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(validPassword);
      expect(user?.employeeId?.toString()).toBe(employee.id);
    });

    it("allows HR to create employee", async () => {
      const admin = await registerOrganization(app, { email: "admin@hr-emp.com" });
      await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: authHeader(admin.token),
        payload: {
          name: "HR User",
          email: "hr@hr-emp.com",
          password: validPassword,
          role: UserRole.HR,
        },
      });
      const hrToken = await loginViaApi(app, "hr@hr-emp.com", validPassword);

      const response = await createEmployeeViaApi(app, hrToken, {
        email: "newhire@hr-emp.com",
      });
      expect(response.statusCode).toBe(201);
    });

    it("returns 403 for ENGINEER", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-block.com" });
      await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: authHeader(admin.token),
        payload: {
          name: "Engineer",
          email: "eng@eng-block.com",
          password: validPassword,
          role: UserRole.ENGINEER,
        },
      });
      const token = await loginViaApi(app, "eng@eng-block.com", validPassword);

      const response = await createEmployeeViaApi(app, token, {
        email: "blocked@eng-block.com",
      });
      expect(response.statusCode).toBe(403);
    });

    it("allows ADMIN to create employee with custom password", async () => {
      const admin = await registerOrganization(app, { email: "admin@custom-pass.com" });
      const customPassword = "CustomPass1";
      const response = await createEmployeeViaApi(app, admin.token, {
        email: "custom@emp.com",
        password: customPassword,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().data.temporaryPassword).toBe(customPassword);

      const token = await loginViaApi(app, "custom@emp.com", customPassword);
      expect(token).toBeDefined();
    });

    it("returns 400 for weak custom password on create", async () => {
      const admin = await registerOrganization(app, { email: "admin@weak-pass.com" });
      const response = await createEmployeeViaApi(app, admin.token, {
        email: "weak@emp.com",
        password: "short",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 409 for duplicate email in organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@dup-emp.com" });
      await createEmployeeViaApi(app, admin.token, { email: "dup@emp.com" });

      const response = await createEmployeeViaApi(app, admin.token, {
        email: "dup@emp.com",
        firstName: "Other",
      });
      expect(response.statusCode).toBe(409);
    });

    it("blocks manager from another organization", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Org A",
        email: "admin@orga-emp.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Org B",
        email: "admin@orgb-emp.com",
      });
      const managerB = await createEmployeeViaApi(app, orgB.token, {
        email: "manager@orgb.com",
      });

      const response = await createEmployeeViaApi(app, orgA.token, {
        email: "worker@orga.com",
        managerId: managerB.json().data.employee.id,
      });

      expect(response.statusCode).toBe(400);
    });

    it("blocks self as manager", async () => {
      const admin = await registerOrganization(app, { email: "admin@self-mgr.com" });
      const created = await createEmployeeViaApi(app, admin.token, {
        email: "self@mgr.com",
      });
      const employeeId = created.json().data.employee.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/employees/${employeeId}`,
        headers: authHeader(admin.token),
        payload: { managerId: employeeId },
      });

      expect(response.statusCode).toBe(400);
    });

    it("rejects organizationId in request body", async () => {
      const admin = await registerOrganization(app, { email: "admin@orgid-emp.com" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/employees",
        headers: authHeader(admin.token),
        payload: {
          ...defaultEmployeePayload,
          email: "orgid@emp.com",
          organizationId: "507f1f77bcf86cd799439011",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/employees", () => {
    it("lists employees with pagination and filters", async () => {
      const admin = await registerOrganization(app, { email: "admin@list.com" });
      await createEmployeeViaApi(app, admin.token, {
        email: "eng1@list.com",
        department: "Engineering",
        firstName: "Rahul",
      });
      await createEmployeeViaApi(app, admin.token, {
        email: "hr1@list.com",
        department: "HR",
        firstName: "Priya",
      });

      const searchResponse = await app.inject({
        method: "GET",
        url: "/api/v1/employees?search=Rahul",
        headers: authHeader(admin.token),
      });
      expect(searchResponse.statusCode).toBe(200);
      expect(searchResponse.json().data.employees).toHaveLength(1);

      const deptResponse = await app.inject({
        method: "GET",
        url: "/api/v1/employees?department=HR",
        headers: authHeader(admin.token),
      });
      expect(deptResponse.json().data.employees).toHaveLength(1);

      const pageResponse = await app.inject({
        method: "GET",
        url: "/api/v1/employees?page=1&limit=1",
        headers: authHeader(admin.token),
      });
      expect(pageResponse.json().data.pagination.total).toBe(2);
      expect(pageResponse.json().data.employees).toHaveLength(1);
    });

    it("returns 403 for EMPLOYEE role", async () => {
      const admin = await registerOrganization(app, { email: "admin@list403.com" });
      await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "emp@list403.com",
        validPassword,
      );
      const token = await loginViaApi(app, "emp@list403.com", validPassword);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/employees",
        headers: authHeader(token),
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("POST /api/v1/employees/:id/reset-password", () => {
    it("allows ADMIN to reset employee login password", async () => {
      const admin = await registerOrganization(app, { email: "admin@reset.com" });
      const created = await createEmployeeViaApi(app, admin.token, { email: "worker@reset.com" });
      const employeeId = created.json().data.employee.id as string;

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/employees/${employeeId}/reset-password`,
        headers: authHeader(admin.token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.email).toBe("worker@reset.com");
      expect(response.json().data.temporaryPassword).toBeDefined();
      expect(typeof response.json().data.temporaryPassword).toBe("string");
    });

    it("allows ADMIN to reset with custom password", async () => {
      const admin = await registerOrganization(app, { email: "admin@custom-reset.com" });
      const created = await createEmployeeViaApi(app, admin.token, { email: "worker@custom-reset.com" });
      const employeeId = created.json().data.employee.id as string;
      const customPassword = "ResetPass9";

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/employees/${employeeId}/reset-password`,
        headers: authHeader(admin.token),
        payload: { password: customPassword },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.temporaryPassword).toBe(customPassword);

      const token = await loginViaApi(app, "worker@custom-reset.com", customPassword);
      expect(token).toBeDefined();
    });

    it("returns 403 when EMPLOYEE tries to reset password", async () => {
      const admin = await registerOrganization(app, { email: "admin@reset-forbid.com" });
      const created = await createEmployeeViaApi(app, admin.token, { email: "worker@reset-forbid.com" });
      const employeeId = created.json().data.employee.id as string;
      await createEmployeeWithKnownPassword(app, admin.token, "other@reset-forbid.com", validPassword);
      const otherToken = await loginViaApi(app, "other@reset-forbid.com", validPassword);

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/employees/${employeeId}/reset-password`,
        headers: authHeader(otherToken),
        payload: {},
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /api/v1/employees/:id", () => {
    it("allows employee to view own profile only", async () => {
      const admin = await registerOrganization(app, { email: "admin@own.com" });
      const employeeA = await createEmployeeWithKnownPassword(
        app,
        admin.token,
        "a@own.com",
        validPassword,
      );
      const employeeB = await createEmployeeViaApi(app, admin.token, {
        email: "b@own.com",
      });

      const tokenA = await loginViaApi(app, "a@own.com", validPassword);
      const ownResponse = await app.inject({
        method: "GET",
        url: `/api/v1/employees/${employeeA.json().data.employee.id}`,
        headers: authHeader(tokenA),
      });
      expect(ownResponse.statusCode).toBe(200);

      const otherResponse = await app.inject({
        method: "GET",
        url: `/api/v1/employees/${employeeB.json().data.employee.id}`,
        headers: authHeader(tokenA),
      });
      expect(otherResponse.statusCode).toBe(404);
    });

    it("returns 404 for cross-tenant access", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Tenant A",
        email: "admin@tenanta.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Tenant B",
        email: "admin@tenantb.com",
      });
      const employeeB = await createEmployeeViaApi(app, orgB.token, {
        email: "hidden@tenantb.com",
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/employees/${employeeB.json().data.employee.id}`,
        headers: authHeader(orgA.token),
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/employees/:id", () => {
    it("allows ADMIN to update employee profile", async () => {
      const admin = await registerOrganization(app, { email: "admin@patch-emp.com" });
      const created = await createEmployeeViaApi(app, admin.token, {
        email: "patch@emp.com",
      });
      const employeeId = created.json().data.employee.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/employees/${employeeId}`,
        headers: authHeader(admin.token),
        payload: { jobTitle: "Senior Engineer" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.employee.jobTitle).toBe("Senior Engineer");
    });

    it("blocks cross-tenant update", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Patch A",
        email: "admin@patcha.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Patch B",
        email: "admin@patchb.com",
      });
      const employeeB = await createEmployeeViaApi(app, orgB.token, {
        email: "target@patchb.com",
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/employees/${employeeB.json().data.employee.id}`,
        headers: authHeader(orgA.token),
        payload: { department: "Hacked" },
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/employees/:id/status", () => {
    it("terminates employee and deactivates user", async () => {
      const admin = await registerOrganization(app, { email: "admin@term.com" });
      const created = await createEmployeeViaApi(app, admin.token, {
        email: "term@emp.com",
      });
      const employeeId = created.json().data.employee.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/employees/${employeeId}/status`,
        headers: authHeader(admin.token),
        payload: { status: "TERMINATED" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.employee.status).toBe("TERMINATED");

      const user = await User.findOne({ email: "term@emp.com" });
      expect(user?.isActive).toBe(false);

      const employee = await Employee.findById(employeeId);
      expect(employee?.status).toBe("TERMINATED");
    });
  });
});
