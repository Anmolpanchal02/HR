import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { DocumentModel } from "../src/modules/documents/document.model.js";
import { DocumentChunkModel } from "../src/modules/documents/document-chunk.model.js";
import { chunkingService } from "../src/modules/documents/chunking/chunking.service.js";
import { extractDocxText } from "../src/modules/documents/processors/docx.processor.js";
import { extractTxtText } from "../src/modules/documents/processors/txt.processor.js";
import { UserRole } from "../src/modules/users/user.types.js";
import { uploadDocumentViaApi } from "./helpers/documents.js";
import {
  authHeader,
  createMemberViaApi,
  registerOrganization,
  validPassword,
} from "./helpers/users.js";
import { createEmployeeWithKnownPassword, loginViaApi } from "./helpers/employees.js";
import {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./helpers/database.js";

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));
const sampleTxt = readFileSync(path.join(fixturesDir, "fixtures", "sample.txt"), "utf8");

describe("Documents API", () => {
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

  describe("POST /api/v1/documents", () => {
    it("allows ADMIN to upload TXT document", async () => {
      const admin = await registerOrganization(app, { email: "admin@doc.com" });
      const response = await uploadDocumentViaApi(
        app,
        admin.token,
        "handbook.txt",
        sampleTxt,
        "text/plain",
      );

      expect(response.statusCode).toBe(201);
      const document = response.json().data.document;
      expect(document.status).toBe("READY");
      expect(document.originalName).toBe("handbook.txt");
      expect(document.storageKey).toBeUndefined();

      const chunks = await DocumentChunkModel.find({ documentId: document.id });
      expect(chunks.length).toBeGreaterThan(0);
    });

    it("allows HR to upload", async () => {
      const admin = await registerOrganization(app, { email: "admin@hr-doc.com" });
      await createMemberViaApi(app, admin.token, {
        name: "HR",
        email: "hr@hr-doc.com",
        role: UserRole.HR,
      });
      const hrToken = await loginViaApi(app, "hr@hr-doc.com", validPassword);

      const response = await uploadDocumentViaApi(
        app,
        hrToken,
        "policy.txt",
        sampleTxt,
        "text/plain",
      );
      expect(response.statusCode).toBe(201);
    });

    it("allows ENGINEER to upload", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-doc.com" });
      const engToken = await createEngineerToken(admin.token, "eng@eng-doc.com");

      const response = await uploadDocumentViaApi(
        app,
        engToken,
        "guide.txt",
        sampleTxt,
        "text/plain",
      );
      expect(response.statusCode).toBe(201);
    });

    it("returns 403 for EMPLOYEE", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-doc.com" });
      await createEmployeeWithKnownPassword(app, admin.token, "emp@emp-doc.com", validPassword);
      const empToken = await loginViaApi(app, "emp@emp-doc.com", validPassword);

      const response = await uploadDocumentViaApi(
        app,
        empToken,
        "blocked.txt",
        sampleTxt,
        "text/plain",
      );
      expect(response.statusCode).toBe(403);
    });

    it("rejects unsupported file type", async () => {
      const admin = await registerOrganization(app, { email: "admin@bad-type.com" });
      const response = await uploadDocumentViaApi(
        app,
        admin.token,
        "image.png",
        "fake png",
        "image/png",
      );
      expect(response.statusCode).toBe(400);
    });

    it("rejects file too large", async () => {
      const admin = await registerOrganization(app, { email: "admin@big-doc.com" });
      const huge = "x".repeat(11 * 1024 * 1024);
      const response = await uploadDocumentViaApi(
        app,
        admin.token,
        "big.txt",
        huge,
        "text/plain",
      );
      expect(response.statusCode).toBe(413);
    });

    it("rejects organizationId spoofing via extra fields in multipart", async () => {
      const admin = await registerOrganization(app, { email: "admin@spoof-doc.com" });
      const response = await uploadDocumentViaApi(
        app,
        admin.token,
        "handbook.txt",
        sampleTxt,
        "text/plain",
      );
      expect(response.statusCode).toBe(201);

      const stored = await DocumentModel.findById(response.json().data.document.id);
      expect(stored?.organizationId.toString()).toBe(admin.user.organizationId);
    });
  });

  describe("GET /api/v1/documents", () => {
    it("lists only current organization documents", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Doc Org A",
        email: "admin@doca.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Doc Org B",
        email: "admin@docb.com",
      });

      await uploadDocumentViaApi(app, orgA.token, "a.txt", "Org A leave policy", "text/plain");
      await uploadDocumentViaApi(app, orgB.token, "b.txt", "Org B handbook", "text/plain");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/documents",
        headers: authHeader(orgA.token),
      });

      expect(response.json().data.documents).toHaveLength(1);
      expect(response.json().data.documents[0].name).toBe("a.txt");
    });

    it("supports search and status filters", async () => {
      const admin = await registerOrganization(app, { email: "admin@filter-doc.com" });
      await uploadDocumentViaApi(app, admin.token, "handbook.txt", sampleTxt, "text/plain");

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/documents?search=handbook&status=READY",
        headers: authHeader(admin.token),
      });

      expect(response.json().data.documents).toHaveLength(1);
    });
  });

  describe("GET /api/v1/documents/:id", () => {
    it("does not expose storageKey", async () => {
      const admin = await registerOrganization(app, { email: "admin@get-doc.com" });
      const uploaded = await uploadDocumentViaApi(
        app,
        admin.token,
        "handbook.txt",
        sampleTxt,
        "text/plain",
      );
      const id = uploaded.json().data.document.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/documents/${id}`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.document.storageKey).toBeUndefined();
    });

    it("blocks cross-tenant access", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Get Doc A",
        email: "admin@geta-doc.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Get Doc B",
        email: "admin@getb-doc.com",
      });
      const uploaded = await uploadDocumentViaApi(
        app,
        orgB.token,
        "secret.txt",
        "secret",
        "text/plain",
      );
      const id = uploaded.json().data.document.id;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/documents/${id}`,
        headers: authHeader(orgA.token),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/documents/:id/archive", () => {
    it("allows ADMIN to archive", async () => {
      const admin = await registerOrganization(app, { email: "admin@arch-doc.com" });
      const uploaded = await uploadDocumentViaApi(
        app,
        admin.token,
        "handbook.txt",
        sampleTxt,
        "text/plain",
      );
      const id = uploaded.json().data.document.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/documents/${id}/archive`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.document.status).toBe("ARCHIVED");

      const stillExists = await DocumentModel.findById(id);
      expect(stillExists).not.toBeNull();
    });

    it("returns 403 for ENGINEER", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-arch.com" });
      const engToken = await createEngineerToken(admin.token, "eng@eng-arch.com");
      const uploaded = await uploadDocumentViaApi(
        app,
        admin.token,
        "handbook.txt",
        sampleTxt,
        "text/plain",
      );
      const id = uploaded.json().data.document.id;

      const response = await app.inject({
        method: "PATCH",
        url: `/api/v1/documents/${id}/archive`,
        headers: authHeader(engToken),
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Processing", () => {
    it("extracts TXT text", async () => {
      const text = await extractTxtText(Buffer.from(sampleTxt, "utf8"));
      expect(text).toContain("Leave Policy");
    });

    it("extracts DOCX text", async () => {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file(
        "[Content_Types].xml",
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
      );
      zip.file(
        "word/document.xml",
        '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Engineering Guide Content</w:t></w:r></w:p></w:body></w:document>',
      );
      const buffer = await zip.generateAsync({ type: "nodebuffer" });
      const text = await extractDocxText(buffer);
      expect(text).toContain("Engineering Guide");
    });

    it("generates chunks from text", () => {
      const chunks = chunkingService.chunkText(sampleTxt.repeat(20));
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunkIndex).toBe(0);
    });

    it("marks empty document as FAILED", async () => {
      const admin = await registerOrganization(app, { email: "admin@empty-doc.com" });
      const response = await uploadDocumentViaApi(app, admin.token, "empty.txt", "   ", "text/plain");
      expect(response.statusCode).toBe(201);
      expect(response.json().data.document.status).toBe("FAILED");
    });
  });

  describe("GET /api/v1/documents/search", () => {
    it("requires authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/documents/search?q=leave",
      });
      expect(response.statusCode).toBe(401);
    });

    it("returns tenant-scoped semantic results", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Search Doc A",
        email: "admin@searcha.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Search Doc B",
        email: "admin@searchb.com",
      });

      await uploadDocumentViaApi(
        app,
        orgA.token,
        "leave-policy.txt",
        sampleTxt,
        "text/plain",
      );
      await uploadDocumentViaApi(
        app,
        orgB.token,
        "other.txt",
        "Completely unrelated content about hardware inventory.",
        "text/plain",
      );

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/documents/search?q=leave%20policy",
        headers: authHeader(orgA.token),
      });

      expect(response.statusCode).toBe(200);
      const results = response.json().data.results;
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content.toLowerCase()).toContain("leave");
      expect(results.every((r: { documentName: string }) => r.documentName === "leave-policy.txt")).toBe(
        true,
      );
    });

    it("prevents Organization B from retrieving Organization A chunks", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Iso Search A",
        email: "admin@isoa.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Iso Search B",
        email: "admin@isob.com",
      });

      await uploadDocumentViaApi(
        app,
        orgA.token,
        "secret-policy.txt",
        "Confidential leave policy for Org A only.",
        "text/plain",
      );

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/documents/search?q=leave%20policy",
        headers: authHeader(orgB.token),
      });

      expect(response.json().data.results).toHaveLength(0);
    });
  });
});
