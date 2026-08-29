import { taskServiceApi } from "../../../tasks/task.service.js";
import type { ToolContext, ToolResult } from "../tool.types.js";
import { sanitizeToolInput } from "../tool.types.js";
import { toolFailure, toolFailureFromError, toolSuccess } from "../tool-result.js";

function toAuthContext(context: ToolContext) {
  return {
    userId: context.userId,
    organizationId: context.organizationId,
    role: context.role,
  };
}

export const searchTasksTool = {
  definition: {
    name: "search_tasks",
    description: "Search tasks by title or description",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) return toolFailure("VALIDATION_ERROR", "query is required");

    try {
      const result = await taskServiceApi.searchTasks(toAuthContext(context), {
        search: query,
        limit: 10,
      });
      const tasks = result.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectKey: t.project?.key,
        assignee: t.assignee?.name,
      }));
      return toolSuccess(
        { tasks, count: tasks.length },
        `Found ${tasks.length} task(s) matching "${query}"`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Search failed");
    }
  },
};

export const getTaskTool = {
  definition: {
    name: "get_task",
    description: "Get task details by ID",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const taskId = typeof args.taskId === "string" ? args.taskId : "";
    if (!taskId) return toolFailure("VALIDATION_ERROR", "taskId is required");

    try {
      const task = await taskServiceApi.getTask(toAuthContext(context), taskId);
      return toolSuccess(
        {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          projectKey: task.project?.key,
          assignee: task.assignee?.name,
        },
        `Retrieved task ${task.title}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Task not found");
    }
  },
};

export const createTaskTool = {
  definition: {
    name: "create_task",
    description: "Create a task in a project (requires ADMIN, HR, or ENGINEER)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string" },
        assigneeId: { type: "string" },
        dueDate: { type: "string" },
      },
      required: ["projectId", "title"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const projectId = typeof args.projectId === "string" ? args.projectId : "";
    const title = typeof args.title === "string" ? args.title.trim() : "";
    if (!projectId || !title) {
      return toolFailure("VALIDATION_ERROR", "projectId and title are required");
    }

    try {
      const task = await taskServiceApi.createTask(toAuthContext(context), {
        projectId,
        title,
        description: typeof args.description === "string" ? args.description : undefined,
        priority: args.priority as never,
        assigneeId: typeof args.assigneeId === "string" ? args.assigneeId : undefined,
        dueDate: typeof args.dueDate === "string" ? args.dueDate : undefined,
      });
      return toolSuccess(
        {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee?.name,
        },
        `Created task "${task.title}"`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Create task failed");
    }
  },
};

export const updateTaskTool = {
  definition: {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string" },
        priority: { type: "string" },
        assigneeId: { type: "string" },
        dueDate: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const taskId = typeof args.taskId === "string" ? args.taskId : "";
    if (!taskId) return toolFailure("VALIDATION_ERROR", "taskId is required");

    const updates: Record<string, unknown> = {};
    if (typeof args.title === "string") updates.title = args.title;
    if (typeof args.description === "string") updates.description = args.description;
    if (typeof args.status === "string") updates.status = args.status;
    if (typeof args.priority === "string") updates.priority = args.priority;
    if (typeof args.assigneeId === "string") updates.assigneeId = args.assigneeId;
    if (typeof args.dueDate === "string") updates.dueDate = args.dueDate;

    try {
      const task = await taskServiceApi.updateTask(
        toAuthContext(context),
        taskId,
        updates as never,
      );
      return toolSuccess(
        {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
        `Updated task "${task.title}"`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Update task failed");
    }
  },
};
