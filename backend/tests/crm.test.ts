import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { UserRole } from "../src/modules/users/user.types.js";
import {
  createEmployeeViaApi,
  createEmployeeWithKnownPassword,
  loginViaApi,
} from "./helpers/employees.js";
import { hashPassword } from "../src/utils/password.js";
import { User } from "../src/modules/users/user.model.js";
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

describe("CRM security", () => {
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

  async function createEmployeeToken(adminToken: string, email: string) {
    const response = await createEmployeeWithKnownPassword(app, adminToken, email, validPassword);
    if (response.statusCode !== 201) {
      const passwordHash = await hashPassword(validPassword);
      await User.updateOne({ email: email.toLowerCase() }, { passwordHash });
    }
    return loginViaApi(app, email, validPassword);
  }

  describe("Leave API", () => {
    it("scopes pending leave to direct reports only", async () => {
      const admin = await registerOrganization(app, { email: "admin@leave-crm.com" });
      const manager = await createEmployeeViaApi(app, admin.token, {
        email: "manager@leave-crm.com",
        jobTitle: "Tech Lead",
        firstName: "Manager",
        lastName: "One",
      });
      const managerId = manager.json().data.employee.id as string;

      await createEmployeeViaApi(app, admin.token, {
        email: "report@leave-crm.com",
        managerId,
        firstName: "Report",
        lastName: "One",
      });
      await createEmployeeViaApi(app, admin.token, {
        email: "outsider@leave-crm.com",
        firstName: "Out",
        lastName: "Sider",
      });

      const managerToken = await createEmployeeToken(admin.token, "manager@leave-crm.com");
      const reportToken = await createEmployeeToken(admin.token, "report@leave-crm.com");
      const outsiderToken = await createEmployeeToken(admin.token, "outsider@leave-crm.com");

      await app.inject({
        method: "POST",
        url: "/api/v1/leave/requests",
        headers: authHeader(reportToken),
        payload: {
          leaveType: "ANNUAL",
          startDate: "2026-10-01",
          endDate: "2026-10-02",
          reason: "Team leave",
        },
      });

      await app.inject({
        method: "POST",
        url: "/api/v1/leave/requests",
        headers: authHeader(outsiderToken),
        payload: {
          leaveType: "SICK",
          startDate: "2026-10-03",
          endDate: "2026-10-03",
          reason: "Outsider leave",
        },
      });

      const managerPending = await app.inject({
        method: "GET",
        url: "/api/v1/leave/requests/pending",
        headers: authHeader(managerToken),
      });

      expect(managerPending.statusCode).toBe(200);
      const requests = managerPending.json().data.requests as Array<{ reason: string }>;
      expect(requests).toHaveLength(1);
      expect(requests[0]?.reason).toBe("Team leave");
    });

    it("blocks EMPLOYEE from listing all leave requests", async () => {
      const admin = await registerOrganization(app, { email: "admin@leave-all.com" });
      const empToken = await createEmployeeToken(admin.token, "emp@leave-all.com");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/leave/requests",
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(403);
    });

    it("allows HR to list all leave requests", async () => {
      const admin = await registerOrganization(app, { email: "admin@leave-hr.com" });
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/leave/requests",
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Attendance API", () => {
    it("blocks EMPLOYEE without reports from team attendance", async () => {
      const admin = await registerOrganization(app, { email: "admin@att-crm.com" });
      const empToken = await createEmployeeToken(admin.token, "emp@att-crm.com");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/attendance/team",
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(403);
    });

    it("blocks EMPLOYEE from all attendance", async () => {
      const admin = await registerOrganization(app, { email: "admin@att-all.com" });
      const empToken = await createEmployeeToken(admin.token, "emp@att-all.com");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/attendance",
        headers: authHeader(empToken),
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Organization settings", () => {
    it("allows EMPLOYEE to read settings but not update", async () => {
      const admin = await registerOrganization(app, { email: "admin@org-set.com" });
      const empToken = await createEmployeeToken(admin.token, "emp@org-set.com");

      const read = await app.inject({
        method: "GET",
        url: "/api/v1/organization/settings",
        headers: authHeader(empToken),
      });
      expect(read.statusCode).toBe(200);
      expect(read.json().data.settings.workHours.startTime).toBeDefined();

      const write = await app.inject({
        method: "PATCH",
        url: "/api/v1/organization/settings",
        headers: authHeader(empToken),
        payload: {
          workHours: {
            startTime: "09:00",
            endTime: "18:00",
            timezone: "Asia/Kolkata",
            workDays: [1, 2, 3, 4, 5],
            graceMinutes: 10,
          },
        },
      });
      expect(write.statusCode).toBe(403);
    });
  });

  describe("Org chart & direct reports", () => {
    it("scopes org chart for EMPLOYEE to self and manager chain", async () => {
      const admin = await registerOrganization(app, { email: "admin@org-chart.com" });
      const lead = await createEmployeeViaApi(app, admin.token, {
        email: "lead@org-chart.com",
        jobTitle: "Tech Lead",
        firstName: "Vikram",
        lastName: "Lead",
      });
      const leadId = lead.json().data.employee.id as string;
      await createEmployeeViaApi(app, admin.token, {
        email: "peer@org-chart.com",
        firstName: "Peer",
        lastName: "User",
      });
      await createEmployeeViaApi(app, admin.token, {
        email: "report@org-chart.com",
        managerId: leadId,
        firstName: "Report",
        lastName: "User",
      });

      const empToken = await createEmployeeToken(admin.token, "report@org-chart.com");
      const adminChart = await app.inject({
        method: "GET",
        url: "/api/v1/employees/org-chart",
        headers: authHeader(admin.token),
      });
      const empChart = await app.inject({
        method: "GET",
        url: "/api/v1/employees/org-chart",
        headers: authHeader(empToken),
      });

      expect(adminChart.json().data.totalEmployees).toBeGreaterThan(
        empChart.json().data.totalEmployees,
      );
      const empNames = JSON.stringify(empChart.json().data.roots);
      expect(empNames).not.toContain("Peer User");
    });

    it("blocks EMPLOYEE from viewing another employee direct reports", async () => {
      const admin = await registerOrganization(app, { email: "admin@reports.com" });
      const lead = await createEmployeeViaApi(app, admin.token, {
        email: "lead@reports.com",
        jobTitle: "Tech Lead",
      });
      const leadId = lead.json().data.employee.id as string;
      await createEmployeeViaApi(app, admin.token, {
        email: "report@reports.com",
        managerId: leadId,
      });
      await createEmployeeViaApi(app, admin.token, {
        email: "outsider@reports.com",
      });

      const outsiderToken = await createEmployeeToken(admin.token, "outsider@reports.com");

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/employees/${leadId}/reports`,
        headers: authHeader(outsiderToken),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Auth employee profile", () => {
    it("auto-provisions employee profile on login for EMPLOYEE role", async () => {
      const admin = await registerOrganization(app, { email: "admin@auto-emp.com" });
      await createMemberViaApi(app, admin.token, {
        name: "Auto Employee",
        email: "auto@auto-emp.com",
        role: UserRole.EMPLOYEE,
      });

      const login = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "auto@auto-emp.com", password: validPassword },
      });

      expect(login.statusCode).toBe(200);
      expect(login.json().data.user.employeeId).toBeDefined();
    });
  });
});
