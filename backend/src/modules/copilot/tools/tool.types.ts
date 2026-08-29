import type { UserRole } from "../../users/user.types.js";
import type { ToolError } from "./tool-result.js";

export interface ToolContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: ToolError | string;
  summary?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AgentTool {
  definition: ToolDefinition;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallSummary {
  tool: string;
  status: "success" | "error";
  summary?: string;
}

export const FORBIDDEN_TOOL_INPUT_KEYS = [
  "organizationId",
  "userId",
  "role",
  "createdBy",
  "uploadedBy",
  "password",
  "passwordHash",
] as const;

export function sanitizeToolInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const record = { ...(input as Record<string, unknown>) };
  for (const key of FORBIDDEN_TOOL_INPUT_KEYS) {
    delete record[key];
  }
  return record;
}
