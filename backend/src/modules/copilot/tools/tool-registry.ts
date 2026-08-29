import type { AgentTool } from "./tool.types.js";
import { searchEmployeesTool, getEmployeeTool } from "./employee/employee.tools.js";
import {
  searchProjectsTool,
  getProjectTool,
  createProjectTool,
  updateProjectTool,
} from "./project/project.tools.js";
import {
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
} from "./task/task.tools.js";
import { searchDocumentsTool } from "./document/search-documents.tool.js";

const ALL_TOOLS: AgentTool[] = [
  searchEmployeesTool,
  getEmployeeTool,
  searchProjectsTool,
  getProjectTool,
  createProjectTool,
  updateProjectTool,
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  searchDocumentsTool,
];

const toolMap = new Map(ALL_TOOLS.map((tool) => [tool.definition.name, tool]));

export function getRegisteredTools(): AgentTool[] {
  return ALL_TOOLS;
}

export function getToolDefinitions() {
  return ALL_TOOLS.map((tool) => tool.definition);
}

export function getToolByName(name: string): AgentTool | undefined {
  return toolMap.get(name);
}

export function isKnownTool(name: string): boolean {
  return toolMap.has(name);
}
