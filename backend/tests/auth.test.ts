import jwt from "jsonwebtoken";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { UserRole } from "../src/modules/users/user.types.js";
import { signToken } from "../src/utils/jwt.js";
import {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./helpers/database.js";

const validPassword = "StrongPassword123";

describe("Auth API", () => {
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

  describe("POST /api/v1/auth/register", () => {
    it("registers organization and admin user successfully", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          organizationName: "Acme Technologies",
          name: "John Doe",
          email: "john@acme.com",
          password: validPassword,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe(UserRole.ADMIN);
      expect(body.data.user.email).toBe("john@acme.com");
      expect(body.data.user.organizationName).toBe("Acme Technologies");
      expect(body.data.token).toBeTypeOf("string");
      expect(body.data.user.passwordHash).toBeUndefined();
    });

    it("rejects duplicate organization slug", async () => {
      const payload = {
        organizationName: "Acme Technologies",
        name: "Jane Doe",
        email: "jane@acme.com",
        password: validPassword,
      };

      await app.inject({ method: "POST", url: "/api/v1/auth/register", payload });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          ...payload,
          organizationName: "ACME Technologies",
          email: "other@acme.com",
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().message).toBe("Organization already exists");
    });

    it("rejects invalid email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          organizationName: "Beta Corp",
          name: "John Doe",
          email: "not-an-email",
          password: validPassword,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("rejects weak password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          organizationName: "Beta Corp",
          name: "John Doe",
          email: "john@beta.com",
          password: "weak",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("rejects missing fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "john@beta.com",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          organizationName: "Login Org",
          name: "Login User",
          email: "login@example.com",
          password: validPassword,
        },
      });
    });

    it("logs in successfully", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "login@example.com",
          password: validPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.token).toBeTypeOf("string");
      expect(response.json().data.user.email).toBe("login@example.com");
    });

    it("rejects wrong password with generic message", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "login@example.com",
          password: "WrongPassword123",
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toBe("Invalid email or password");
    });

    it("rejects unknown user with generic message", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "unknown@example.com",
          password: validPassword,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toBe("Invalid email or password");
    });

    it("rejects inactive user", async () => {
      const { User } = await import("../src/modules/users/user.model.js");
      await User.updateOne({ email: "login@example.com" }, { isActive: false });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "login@example.com",
          password: validPassword,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toBe("Invalid email or password");
    });
  });

  describe("Auth middleware", () => {
    it("rejects missing token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(response.statusCode).toBe(401);
    });

    it("rejects invalid token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it("rejects expired token", async () => {
      const token = jwt.sign(
        {
          userId: "507f1f77bcf86cd799439011",
          organizationId: "507f1f77bcf86cd799439012",
          role: UserRole.ADMIN,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "-1s" },
      );

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it("accepts valid token", async () => {
      const registerResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          organizationName: "Me Org",
          name: "Me User",
          email: "me@example.com",
          password: validPassword,
        },
      });

      const token = registerResponse.json().data.token;

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.email).toBe("me@example.com");
      expect(response.json().data.passwordHash).toBeUndefined();
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns unauthenticated error without token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("RBAC middleware", () => {
    it("allows authorized role", async () => {
      const { authenticate } = await import("../src/middleware/auth.middleware.js");
      const { requireRoles } = await import("../src/middleware/role.middleware.js");

      const testApp = await buildApp();
      testApp.get(
        "/api/v1/test/admin-only",
        {
          preHandler: [authenticate, requireRoles(UserRole.ADMIN)],
        },
        async (request, reply) => {
          reply.send({ success: true, role: request.authUser?.role });
        },
      );
      await testApp.ready();

      const token = signToken({
        userId: "507f1f77bcf86cd799439011",
        organizationId: "507f1f77bcf86cd799439012",
        role: UserRole.ADMIN,
      });

      const response = await testApp.inject({
        method: "GET",
        url: "/api/v1/test/admin-only",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      await testApp.close();
    });

    it("forbids unauthorized role", async () => {
      const { authenticate } = await import("../src/middleware/auth.middleware.js");
      const { requireRoles } = await import("../src/middleware/role.middleware.js");

      const testApp = await buildApp();
      testApp.get(
        "/api/v1/test/admin-only",
        {
          preHandler: [authenticate, requireRoles(UserRole.ADMIN)],
        },
        async (_request, reply) => {
          reply.send({ success: true });
        },
      );
      await testApp.ready();

      const token = signToken({
        userId: "507f1f77bcf86cd799439011",
        organizationId: "507f1f77bcf86cd799439012",
        role: UserRole.EMPLOYEE,
      });

      const response = await testApp.inject({
        method: "GET",
        url: "/api/v1/test/admin-only",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().message).toBe("Forbidden");
      await testApp.close();
    });
  });
});
