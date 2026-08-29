import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";

import { buildApp } from "../src/app.js";
import { AgentRunModel } from "../src/modules/copilot/agent/agent-run.model.js";
import { AgentToolCallModel } from "../src/modules/copilot/agent/agent-tool-call.model.js";
import { AgentRunStatus } from "../src/modules/copilot/agent/agent.types.js";
import { resetAgentLLMProviderForTests } from "../src/modules/copilot/agent/llm/openai-agent.llm.js";
import { INSUFFICIENT_CONTEXT_RESPONSE } from "../src/modules/copilot/copilot.types.js";
import {
  getToolByName,
  getRegisteredTools,
  isKnownTool,
} from "../src/modules/copilot/tools/tool-registry.js";
import { sanitizeToolInput } from "../src/modules/copilot/tools/tool.types.js";
import { isToolDeniedAtAgentLayer } from "../src/modules/copilot/tools/tool-permissions.js";
import { toolFailure } from "../src/modules/copilot/tools/tool-result.js";
import { UserRole } from "../src/modules/users/user.types.js";
import { createEmployeeViaApi } from "./helpers/employees.js";
import { uploadDocumentViaApi } from "./helpers/documents.js";
import { createProjectViaApi } from "./helpers/projects.js";
import {
  authHeader,
  registerOrganization,
} from "./helpers/users.js";
import {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./helpers/database.js";

const leavePolicyText = `Leave Policy

Employees receive 18 annual leave days per year.
Unused leave may be carried forward up to 5 days.`;

describe("AI Agent + Tool Calling", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    process.env.LLM_PROVIDER = "mock";
    process.env.RAG_MIN_SCORE = "0.01";
    process.env.AGENT_MAX_TOOL_CALLS = "5";
    await setupTestDatabase();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    resetAgentLLMProviderForTests();
    process.env.AGENT_MAX_TOOL_CALLS = "5";
    await clearDatabase();
  });

  describe("Tool Registry", () => {
    it("registers all expected tools", () => {
      const names = getRegisteredTools().map((t) => t.definition.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "search_employees",
          "get_employee",
          "search_projects",
          "get_project",
          "create_project",
          "update_project",
          "search_tasks",
          "get_task",
          "create_task",
          "update_task",
          "search_documents",
        ]),
      );
      expect(names).toHaveLength(11);
    });

    it("rejects unknown tools", () => {
      expect(isKnownTool("delete_everything")).toBe(false);
      expect(getToolByName("delete_everything")).toBeUndefined();
    });
  });

  describe("Tool permissions", () => {
    it("blocks employee from creating tasks via tool", async () => {
      const admin = await registerOrganization(app, { email: "admin@tool-perm.com" });
      const projectRes = await createProjectViaApi(app, admin.token, { key: "PAY" });
      const projectId = projectRes.json().data.project.id as string;

      const createTask = getToolByName("create_task")!;
      const result = await createTask.execute(
        { projectId, title: "Blocked task" },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.EMPLOYEE,
        },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      if (typeof result.error === "object") {
        expect(result.error.code).toBe("FORBIDDEN");
      }
    });

    it("blocks employee from creating projects via tool", async () => {
      const admin = await registerOrganization(app, { email: "admin@proj-perm.com" });

      const createProject = getToolByName("create_project")!;
      const result = await createProject.execute(
        { name: "Secret", key: "SEC" },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.EMPLOYEE,
        },
      );

      expect(result.success).toBe(false);
    });

    it("blocks employee from creating projects at agent permission layer", () => {
      expect(isToolDeniedAtAgentLayer("create_project", UserRole.EMPLOYEE)).toBe(true);
      expect(isToolDeniedAtAgentLayer("create_task", UserRole.EMPLOYEE)).toBe(true);
      expect(isToolDeniedAtAgentLayer("search_projects", UserRole.EMPLOYEE)).toBe(false);
    });

    it("returns structured tool failure codes", () => {
      const failure = toolFailure("NOT_FOUND", "Project not found");
      expect(failure.success).toBe(false);
      expect(failure.error).toEqual({ code: "NOT_FOUND", message: "Project not found" });
    });

    it("allows engineer to create tasks via tool", async () => {
      const admin = await registerOrganization(app, { email: "admin@eng-task.com" });
      const projectRes = await createProjectViaApi(app, admin.token, { key: "PAY" });
      const projectId = projectRes.json().data.project.id as string;

      const createTask = getToolByName("create_task")!;
      const result = await createTask.execute(
        { projectId, title: "Engineer task", priority: "HIGH" },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.ENGINEER,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Engineer task");
    });
  });

  describe("Tenant isolation", () => {
    it("cannot access another organization's employee via get_employee", async () => {
      const orgA = await registerOrganization(app, {
        organizationName: "Agent Org A",
        email: "admin@agenta.com",
      });
      const orgB = await registerOrganization(app, {
        organizationName: "Agent Org B",
        email: "admin@agentb.com",
      });

      const employeeB = await createEmployeeViaApi(app, orgB.token, {
        email: "rahul-b@example.com",
        firstName: "Rahul",
        lastName: "B",
      });
      const employeeId = employeeB.json().data.employee.id as string;

      const getEmployee = getToolByName("get_employee")!;
      const result = await getEmployee.execute(
        { employeeId },
        {
          userId: orgA.user.id,
          organizationId: orgA.user.organizationId,
          role: UserRole.ADMIN,
        },
      );

      expect(result.success).toBe(false);
    });

    it("strips model-supplied organizationId from tool input", async () => {
      const admin = await registerOrganization(app, { email: "admin@strip.com" });
      await createEmployeeViaApi(app, admin.token, {
        email: "rahul@strip.com",
        firstName: "Rahul",
        lastName: "Sharma",
      });

      const sanitized = sanitizeToolInput({
        query: "Rahul",
        organizationId: "000000000000000000000000",
        userId: "000000000000000000000001",
        role: "ADMIN",
      });

      expect(sanitized.organizationId).toBeUndefined();
      expect(sanitized.userId).toBeUndefined();
      expect(sanitized.role).toBeUndefined();
      expect(sanitized.query).toBe("Rahul");

      const searchEmployees = getToolByName("search_employees")!;
      const result = await searchEmployees.execute(sanitized, {
        userId: admin.user.id,
        organizationId: admin.user.organizationId,
        role: UserRole.ADMIN,
      });

      expect(result.success).toBe(true);
      expect((result.data?.employees as Array<{ name: string }>)?.[0]?.name).toContain("Rahul");
    });
  });

  describe("Employee tools", () => {
    it("searches employees within organization", async () => {
      const admin = await registerOrganization(app, { email: "admin@emp-search.com" });
      await createEmployeeViaApi(app, admin.token, {
        email: "rahul@search.com",
        firstName: "Rahul",
        lastName: "Sharma",
      });

      const searchEmployees = getToolByName("search_employees")!;
      const result = await searchEmployees.execute(
        { query: "Rahul" },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.ADMIN,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data?.count).toBeGreaterThan(0);
    });
  });

  describe("Project tools", () => {
    it("creates and updates projects", async () => {
      const admin = await registerOrganization(app, { email: "admin@proj-tool.com" });

      const createProject = getToolByName("create_project")!;
      const created = await createProject.execute(
        {
          name: "Payment Platform",
          key: "PAY",
          description: "Payment modernization",
          priority: "HIGH",
        },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.ADMIN,
        },
      );

      expect(created.success).toBe(true);
      const projectId = created.data?.id as string;

      const updateProject = getToolByName("update_project")!;
      const updated = await updateProject.execute(
        { projectId, status: "ACTIVE" },
        {
          userId: admin.user.id,
          organizationId: admin.user.organizationId,
          role: UserRole.ADMIN,
        },
      );

      expect(updated.success).toBe(true);
      expect(updated.data?.status).toBe("ACTIVE");
    });
  });

  describe("Agent API integration", () => {
    it("answers document questions with citations via search_documents", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-doc.com" });
      await uploadDocumentViaApi(
        app,
        admin.token,
        "employee-handbook.txt",
        leavePolicyText,
        "text/plain",
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "What is our annual leave policy?" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json().data;
      expect(body.citations.length).toBeGreaterThan(0);
      expect(body.toolCalls.some((t: { tool: string }) => t.tool === "search_documents")).toBe(
        true,
      );
      expect(body.message.content).toContain("18");
    });

    it("returns insufficient context when no documents match", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-nodoc.com" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "What is our annual leave policy?" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.message.content).toBe(INSUFFICIENT_CONTEXT_RESPONSE);
    });

    it("creates a task through multiple tool calls", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-task.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY" });
      await createEmployeeViaApi(app, admin.token, {
        email: "rahul@agent.com",
        firstName: "Rahul",
        lastName: "Sharma",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: {
          message: "Create a high priority task for Rahul in the PAY project titled Fix Payment API",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json().data;
      expect(body.toolCalls.map((t: { tool: string }) => t.tool)).toEqual(
        expect.arrayContaining(["search_employees", "search_projects", "create_task"]),
      );
      expect(body.message.content.toLowerCase()).toContain("created");
    });

    it("does not use tools for simple greetings", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-hello.com" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "Hello" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.toolCalls).toHaveLength(0);
    });

    it("enforces maximum tool call limit", async () => {
      process.env.AGENT_MAX_TOOL_CALLS = "1";
      resetAgentLLMProviderForTests();

      const admin = await registerOrganization(app, { email: "admin@agent-limit.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY" });
      await createEmployeeViaApi(app, admin.token, {
        email: "rahul@limit.com",
        firstName: "Rahul",
        lastName: "Sharma",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "Create a high priority task for Rahul in PAY project" },
      });

      expect(response.statusCode).toBe(429);

      const run = await AgentRunModel.findOne({ userId: admin.user.id });
      expect(run?.status).toBe(AgentRunStatus.LIMIT_REACHED);
    });

    it("records agent run on success", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-run.com" });

      await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "Hello" },
      });

      const run = await AgentRunModel.findOne({ userId: admin.user.id });
      expect(run?.status).toBe(AgentRunStatus.COMPLETED);
      expect(run?.toolCallCount).toBe(0);
    });

    it("uses search_projects with status filter for active projects query", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-proj.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY", status: "ACTIVE" });
      await createProjectViaApi(app, admin.token, { key: "OLD", status: "ARCHIVED" });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: { message: "Show me all active projects" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json().data;
      expect(body.toolCalls.some((t: { tool: string }) => t.tool === "search_projects")).toBe(true);
      expect(body.toolCalls[0]?.summary).toContain("active");
      expect(body.message.content).toContain("PAY");
      expect(body.message.content).not.toContain("OLD");
    });

    it("persists tool activity on assistant messages", async () => {
      const admin = await registerOrganization(app, { email: "admin@agent-persist.com" });
      await createProjectViaApi(app, admin.token, { key: "PAY" });
      await createEmployeeViaApi(app, admin.token, {
        email: "rahul@persist.com",
        firstName: "Rahul",
        lastName: "Sharma",
      });

      const chatRes = await app.inject({
        method: "POST",
        url: "/api/v1/copilot/chat",
        headers: authHeader(admin.token),
        payload: {
          message: "Create a high priority task for Rahul in the PAY project titled Fix Payment API",
        },
      });

      const conversationId = chatRes.json().data.conversationId as string;
      const detailRes = await app.inject({
        method: "GET",
        url: `/api/v1/copilot/conversations/${conversationId}`,
        headers: authHeader(admin.token),
      });

      const assistant = detailRes
        .json()
        .data.conversation.messages.find((m: { role: string }) => m.role === "ASSISTANT");
      expect(assistant.toolCalls?.length).toBeGreaterThan(0);

      const toolRecords = await AgentToolCallModel.find({ userId: admin.user.id });
      expect(toolRecords.length).toBeGreaterThan(0);
    });
  });
});
