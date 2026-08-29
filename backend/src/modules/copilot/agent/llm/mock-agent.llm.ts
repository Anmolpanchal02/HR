import { env } from "../../../../config/env.js";
import { INSUFFICIENT_CONTEXT_RESPONSE } from "../../copilot.types.js";
import type { AgentLLMProvider, AgentMessage, AgentTurnResult } from "./agent-llm.provider.js";
import type { ToolDefinition } from "../../tools/tool.types.js";
import { toolErrorMessage } from "../../tools/tool-result.js";
import type { ToolResult } from "../../tools/tool.types.js";

function lastUserMessage(messages: AgentMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === "user") return msg.content;
  }
  return "";
}

function hasToolResult(messages: AgentMessage[], toolName: string): boolean {
  return messages.some((msg) => msg.role === "tool" && msg.name === toolName);
}

function parseToolResult(messages: AgentMessage[], toolName: string): ToolResult | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === "tool" && msg.name === toolName) {
      try {
        return JSON.parse(msg.content) as ToolResult;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toolCalls(calls: AgentTurnResult["toolCalls"]): AgentTurnResult {
  return {
    type: "tool_calls",
    toolCalls: calls,
    usage: { inputTokens: 50, outputTokens: 20, totalTokens: 70 },
  };
}

function finalMessage(content: string): AgentTurnResult {
  return {
    type: "message",
    content,
    usage: { inputTokens: 80, outputTokens: 40, totalTokens: 120 },
  };
}

function isDocumentQuestion(lower: string): boolean {
  return /leave|annual leave|vacation|policy|handbook|document|engineering doc|according to/.test(
    lower,
  );
}

function isCreateTaskIntent(lower: string): boolean {
  return /create.*task|assign.*task|add.*task|new task/.test(lower);
}

function isUpdateTaskIntent(lower: string): boolean {
  return (
    /change.*task|update.*task|set.*task|mark.*task|move.*task/.test(lower) ||
    /in[_\s-]?progress/.test(lower)
  );
}

function isEmployeeSearchIntent(lower: string): boolean {
  return /find.*employee|search.*employee|who is|find rahul|find \w+ sharma/.test(lower);
}

function isEmployeeTasksIntent(lower: string): boolean {
  return /\b(task|tasks)\b/.test(lower) && /\b(rahul|his|her|their|employee)\b/.test(lower);
}

function isListProjectsIntent(lower: string): boolean {
  return /active project|show.*project|list.*project|all project/.test(lower);
}

function wantsActiveProjectStatus(lower: string): boolean {
  return /\bactive\b/.test(lower);
}

function extractPersonName(userMsg: string): string {
  const forMatch = userMsg.match(/\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (forMatch?.[1]) return forMatch[1];
  const findMatch = userMsg.match(/\b(?:find|search)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (findMatch?.[1]) return findMatch[1];
  const firstName = userMsg.match(/\b(rahul|priya|amit)\b/i);
  return firstName?.[0] ?? "Rahul";
}

function extractProjectQuery(userMsg: string): string {
  const inProject = userMsg.match(/\bin the\s+([A-Za-z0-9]+)\s+project\b/i);
  if (inProject?.[1]) return inProject[1].toUpperCase();
  const keyMatch = userMsg.match(/\b([A-Z]{2,10})\b/);
  if (keyMatch?.[1] && !["API", "HR"].includes(keyMatch[1])) return keyMatch[1];
  return "PAY";
}

function extractTaskTitle(userMsg: string): string | null {
  const quoted = userMsg.match(/(?:called|titled?)\s+"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();
  const unquoted = userMsg.match(/(?:called|titled?)\s+([^,.]+)/i);
  return unquoted?.[1]?.trim() ?? null;
}

function extractTaskSearchQuery(userMsg: string): string {
  const quoted = userMsg.match(/"([^"]+)"/);
  if (quoted?.[1]) return quoted[1];
  if (/payment api/i.test(userMsg)) return "Payment API";
  return "task";
}

function summarizeDocumentContent(results: Array<{ content: string }>): string {
  const relevant = results
    .map((r) => r.content)
    .join(" ")
    .trim();
  if (!relevant) return INSUFFICIENT_CONTEXT_RESPONSE;

  const sentences = relevant.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  return (
    sentences.slice(0, 2).join(" ") ||
    `Based on the available documents, here is what I found: ${relevant.slice(0, 400)}`
  ).trim();
}

function resolveEmployees(messages: AgentMessage[]) {
  const empResult = parseToolResult(messages, "search_employees");
  return (empResult?.data?.employees as Array<{ id: string; name: string }> | undefined) ?? [];
}

function resolveProjects(messages: AgentMessage[]) {
  const projResult = parseToolResult(messages, "search_projects");
  return (projResult?.data?.projects as Array<{ id: string; key: string; name: string }> | undefined) ?? [];
}

function resolveTasks(messages: AgentMessage[]) {
  const taskResult = parseToolResult(messages, "search_tasks");
  return (taskResult?.data?.tasks as Array<{ id: string; title: string }> | undefined) ?? [];
}

function ambiguityMessage(kind: "employee" | "project", names: string[]): string {
  const label = kind === "employee" ? "employees" : "projects";
  return `I found multiple ${label} matching that request (${names.join(", ")}). Please specify which one you mean.`;
}

function buildCreateTaskResponse(messages: AgentMessage[], userMsg: string): AgentTurnResult {
  const taskResult = parseToolResult(messages, "create_task");
  if (!taskResult) {
    return finalMessage("I was unable to create the task.");
  }
  if (!taskResult.success) {
    return finalMessage(`I couldn't create the task because ${toolErrorMessage(taskResult).toLowerCase()}.`);
  }

  const task = (taskResult.data ?? {}) as {
    title?: string;
    priority?: string;
    status?: string;
  };
  const employees = resolveEmployees(messages);
  const projects = resolveProjects(messages);
  const assignee = employees[0]?.name ?? "Unassigned";
  const projectKey = projects[0]?.key ?? "Unknown";

  const lines = [
    `Done. I created the task "${task.title ?? "Task"}".`,
    `Priority: ${task.priority ?? "MEDIUM"}`,
    `Assignee: ${assignee}`,
    `Project: ${projectKey}`,
    `Status: ${task.status ?? "TODO"}`,
  ];

  const docResult = parseToolResult(messages, "search_documents");
  if (docResult?.success && (docResult.data?.count as number) > 0) {
    lines.unshift("Based on the relevant documentation,");
  }

  return finalMessage(lines.join("\n"));
}

export class MockAgentLLMProvider implements AgentLLMProvider {
  readonly providerName = "mock";
  readonly modelName: string;

  constructor(modelName = env.llmModel) {
    this.modelName = modelName;
  }

  async runTurn(input: {
    systemPrompt: string;
    messages: AgentMessage[];
    tools: ToolDefinition[];
  }): Promise<AgentTurnResult> {
    const userMsg = lastUserMessage(input.messages);
    const lower = userMsg.toLowerCase();

    if (/^(hi|hello|hey)\b/.test(lower) && !isDocumentQuestion(lower) && !isCreateTaskIntent(lower)) {
      return finalMessage(
        "Hello! I can help you search employees, projects, tasks, and documents, or create/update tasks and projects within your permissions.",
      );
    }

    const docAndAction = isDocumentQuestion(lower) && isCreateTaskIntent(lower);

    if (docAndAction) {
      if (!hasToolResult(input.messages, "search_documents")) {
        return toolCalls([
          { id: "tc-doc", name: "search_documents", arguments: { query: userMsg } },
        ]);
      }
      if (!hasToolResult(input.messages, "search_employees")) {
        return toolCalls([
          {
            id: "tc-emp",
            name: "search_employees",
            arguments: { query: extractPersonName(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "search_projects")) {
        return toolCalls([
          {
            id: "tc-proj",
            name: "search_projects",
            arguments: { query: extractProjectQuery(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "create_task")) {
        const employees = resolveEmployees(input.messages);
        const projects = resolveProjects(input.messages);
        if (employees.length > 1) {
          return finalMessage(ambiguityMessage("employee", employees.map((e) => e.name)));
        }
        if (projects.length > 1) {
          return finalMessage(
            ambiguityMessage(
              "project",
              projects.map((p) => `${p.key} - ${p.name}`),
            ),
          );
        }
        if (employees.length === 0 || projects.length === 0) {
          return finalMessage(
            "I could not find the required employee or project to create the task. Please verify the names and try again.",
          );
        }
        const title = extractTaskTitle(userMsg) ?? "Investigate payment timeout issues";
        return toolCalls([
          {
            id: "tc-task",
            name: "create_task",
            arguments: {
              projectId: projects[0]!.id,
              title,
              description: "Created by AI Copilot based on engineering documentation",
              priority: /high priority/i.test(userMsg) ? "HIGH" : "MEDIUM",
              assigneeId: employees[0]!.id,
            },
          },
        ]);
      }
      return buildCreateTaskResponse(input.messages, userMsg);
    }

    if (isUpdateTaskIntent(lower)) {
      if (!hasToolResult(input.messages, "search_tasks")) {
        return toolCalls([
          {
            id: "tc-st",
            name: "search_tasks",
            arguments: { query: extractTaskSearchQuery(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "update_task")) {
        const tasks = resolveTasks(input.messages);
        if (tasks.length > 1) {
          return finalMessage(
            `I found multiple matching tasks (${tasks.map((t) => t.title).join(", ")}). Please specify which one to update.`,
          );
        }
        if (tasks.length === 0) {
          return finalMessage("I couldn't find a matching task to update.");
        }
        const status = /in[_\s-]?progress/i.test(userMsg) ? "IN_PROGRESS" : undefined;
        return toolCalls([
          {
            id: "tc-ut",
            name: "update_task",
            arguments: { taskId: tasks[0]!.id, status },
          },
        ]);
      }
      const updateResult = parseToolResult(input.messages, "update_task");
      if (!updateResult?.success) {
        return finalMessage(
          `I couldn't update the task because ${toolErrorMessage(updateResult ?? { success: false, error: { code: "UNKNOWN", message: "update failed" } }).toLowerCase()}.`,
        );
      }
      const task = updateResult.data as { title?: string; status?: string };
      return finalMessage(
        `Updated task "${task.title ?? "Task"}" to status ${task.status ?? "IN_PROGRESS"}.`,
      );
    }

    if (isCreateTaskIntent(lower)) {
      if (!hasToolResult(input.messages, "search_employees")) {
        return toolCalls([
          {
            id: "tc-emp",
            name: "search_employees",
            arguments: { query: extractPersonName(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "search_projects")) {
        return toolCalls([
          {
            id: "tc-proj",
            name: "search_projects",
            arguments: { query: extractProjectQuery(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "create_task")) {
        const employees = resolveEmployees(input.messages);
        const projects = resolveProjects(input.messages);
        if (employees.length > 1) {
          return finalMessage(ambiguityMessage("employee", employees.map((e) => e.name)));
        }
        if (projects.length > 1) {
          return finalMessage(
            ambiguityMessage(
              "project",
              projects.map((p) => `${p.key} - ${p.name}`),
            ),
          );
        }
        if (employees.length === 0 || projects.length === 0) {
          return finalMessage(
            "I could not find the required employee or project to create the task. Please verify the names and try again.",
          );
        }
        const title = extractTaskTitle(userMsg);
        if (!title) {
          return finalMessage("What should the task title be?");
        }
        return toolCalls([
          {
            id: "tc-task",
            name: "create_task",
            arguments: {
              projectId: projects[0]!.id,
              title,
              description: "Created by AI Copilot agent",
              priority: /high priority/i.test(userMsg) ? "HIGH" : "MEDIUM",
              assigneeId: employees[0]!.id,
            },
          },
        ]);
      }
      return buildCreateTaskResponse(input.messages, userMsg);
    }

    if (isEmployeeTasksIntent(lower) && !isCreateTaskIntent(lower)) {
      if (!hasToolResult(input.messages, "search_employees")) {
        return toolCalls([
          {
            id: "tc-emp",
            name: "search_employees",
            arguments: { query: extractPersonName(userMsg) },
          },
        ]);
      }
      if (!hasToolResult(input.messages, "search_tasks")) {
        const employees = resolveEmployees(input.messages);
        const query = employees[0]?.name ?? extractPersonName(userMsg);
        return toolCalls([{ id: "tc-st", name: "search_tasks", arguments: { query } }]);
      }
      const taskResult = parseToolResult(input.messages, "search_tasks");
      const tasks =
        (taskResult?.data?.tasks as Array<{ title: string; status: string; priority: string }>) ??
        [];
      if (tasks.length === 0) {
        return finalMessage("No tasks were found for that employee.");
      }
      return finalMessage(
        tasks.map((t) => `${t.title} (${t.status}, ${t.priority})`).join("; "),
      );
    }

    if (isEmployeeSearchIntent(lower)) {
      if (!hasToolResult(input.messages, "search_employees")) {
        return toolCalls([
          {
            id: "tc-se",
            name: "search_employees",
            arguments: { query: extractPersonName(userMsg) },
          },
        ]);
      }
      const empResult = parseToolResult(input.messages, "search_employees");
      const employees =
        (empResult?.data?.employees as Array<{ name: string; department: string }>) ?? [];
      if (employees.length === 0) return finalMessage("No matching employees were found.");
      if (employees.length > 1) {
        return finalMessage(ambiguityMessage("employee", employees.map((e) => e.name)));
      }
      return finalMessage(`${employees[0]!.name} (${employees[0]!.department})`);
    }

    if (isListProjectsIntent(lower)) {
      if (!hasToolResult(input.messages, "search_projects")) {
        const arguments_ = wantsActiveProjectStatus(lower) ? { status: "ACTIVE" } : {};
        return toolCalls([{ id: "tc-sp", name: "search_projects", arguments: arguments_ }]);
      }
      const projResult = parseToolResult(input.messages, "search_projects");
      const projects =
        (projResult?.data?.projects as Array<{ key: string; name: string; status: string }>) ?? [];
      if (projects.length === 0) {
        return finalMessage(
          wantsActiveProjectStatus(lower)
            ? "No active projects were found."
            : "No projects were found.",
        );
      }
      return finalMessage(
        projects.map((p) => `${p.key} — ${p.name} (${p.status})`).join("; "),
      );
    }

    if (isDocumentQuestion(lower)) {
      if (!hasToolResult(input.messages, "search_documents")) {
        return toolCalls([
          { id: "tc-doc", name: "search_documents", arguments: { query: userMsg } },
        ]);
      }
      const docResult = parseToolResult(input.messages, "search_documents");
      const results =
        (docResult?.data?.results as Array<{ content: string }> | undefined) ?? [];
      const count = (docResult?.data?.count as number | undefined) ?? results.length;
      if (count === 0) return finalMessage(INSUFFICIENT_CONTEXT_RESPONSE);
      return finalMessage(summarizeDocumentContent(results));
    }

    return finalMessage(
      "I can help search employees, projects, tasks, and documents, or create tasks and projects. What would you like to do?",
    );
  }
}
