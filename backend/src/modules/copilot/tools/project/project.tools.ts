import { projectServiceApi } from "../../../projects/project.service.js";
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

const PROJECT_STATUS_VALUES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;

function buildProjectSearchSummary(input: {
  count: number;
  query?: string;
  status?: string;
}): string {
  if (input.count === 0) {
    if (input.status) return `No ${input.status.toLowerCase()} projects found`;
    if (input.query) return `No projects found matching "${input.query}"`;
    return "No projects found";
  }
  if (input.status) {
    return `Found ${input.count} ${input.status.toLowerCase()} project(s)`;
  }
  if (input.query) {
    return `Found ${input.count} project(s) matching "${input.query}"`;
  }
  return `Found ${input.count} project(s)`;
}

export const searchProjectsTool = {
  definition: {
    name: "search_projects",
    description:
      "Search or list projects by name/key, or filter by status (e.g. ACTIVE). Use status for 'active projects', not a text search for 'active'.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term for name or key" },
        status: {
          type: "string",
          enum: [...PROJECT_STATUS_VALUES],
          description: "Filter by project status",
        },
      },
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    let query = typeof args.query === "string" ? args.query.trim() : "";
    let status =
      typeof args.status === "string" && PROJECT_STATUS_VALUES.includes(args.status as never)
        ? args.status
        : undefined;

    if (query && !status && /^(active|planning|on hold|completed|archived)$/i.test(query)) {
      const statusMap: Record<string, string> = {
        active: "ACTIVE",
        planning: "PLANNING",
        "on hold": "ON_HOLD",
        completed: "COMPLETED",
        archived: "ARCHIVED",
      };
      status = statusMap[query.toLowerCase()];
      query = "";
    }

    try {
      const result = await projectServiceApi.searchProjects(toAuthContext(context), {
        search: query || undefined,
        status: status as never,
        limit: 10,
      });
      const projects = result.projects.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        status: p.status,
        priority: p.priority,
      }));
      const summary = buildProjectSearchSummary({
        count: projects.length,
        query: query || undefined,
        status,
      });
      return toolSuccess({ projects, count: projects.length }, summary);
    } catch (error) {
      return toolFailureFromError(error, "Search failed");
    }
  },
};

export const getProjectTool = {
  definition: {
    name: "get_project",
    description: "Get project details by ID",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const projectId = typeof args.projectId === "string" ? args.projectId : "";
    if (!projectId) return toolFailure("VALIDATION_ERROR", "projectId is required");

    try {
      const project = await projectServiceApi.getProject(toAuthContext(context), projectId);
      return toolSuccess(
        {
          id: project.id,
          name: project.name,
          key: project.key,
          status: project.status,
          priority: project.priority,
          description: project.description,
          owner: project.owner,
          taskSummary: project.taskSummary,
        },
        `Retrieved project ${project.key}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Project not found");
    }
  },
};

export const createProjectTool = {
  definition: {
    name: "create_project",
    description: "Create a new project (requires ADMIN, HR, or ENGINEER role)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        key: { type: "string" },
        description: { type: "string" },
        priority: { type: "string" },
        status: { type: "string" },
      },
      required: ["name", "key"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const name = typeof args.name === "string" ? args.name.trim() : "";
    const key = typeof args.key === "string" ? args.key.trim() : "";
    if (!name || !key) return toolFailure("VALIDATION_ERROR", "name and key are required");

    try {
      const project = await projectServiceApi.createProject(toAuthContext(context), {
        name,
        key,
        description: typeof args.description === "string" ? args.description : undefined,
        priority: args.priority as never,
        status: args.status as never,
      });
      return toolSuccess(
        { id: project.id, name: project.name, key: project.key, status: project.status },
        `Created project ${project.key}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Create project failed");
    }
  },
};

export const updateProjectTool = {
  definition: {
    name: "update_project",
    description: "Update an existing project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        status: { type: "string" },
        priority: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
    const args = sanitizeToolInput(input);
    const projectId = typeof args.projectId === "string" ? args.projectId : "";
    if (!projectId) return toolFailure("VALIDATION_ERROR", "projectId is required");

    const updates: Record<string, unknown> = {};
    if (typeof args.name === "string") updates.name = args.name;
    if (typeof args.description === "string") updates.description = args.description;
    if (typeof args.status === "string") updates.status = args.status;
    if (typeof args.priority === "string") updates.priority = args.priority;

    try {
      const project = await projectServiceApi.updateProject(
        toAuthContext(context),
        projectId,
        updates as never,
      );
      return toolSuccess(
        { id: project.id, name: project.name, key: project.key, status: project.status },
        `Updated project ${project.key}`,
      );
    } catch (error) {
      return toolFailureFromError(error, "Update project failed");
    }
  },
};
