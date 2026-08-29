import { AppError } from "../../../utils/app-error.js";
import type { ToolResult } from "./tool.types.js";

export type ToolErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "TENANT_MISMATCH"
  | "CONFLICT"
  | "PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface ToolError {
  code: ToolErrorCode;
  message: string;
}

export function mapAppErrorToToolCode(error: AppError): ToolErrorCode {
  switch (error.statusCode) {
    case 400:
      return "VALIDATION_ERROR";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    case 502:
      return "PROVIDER_ERROR";
    default:
      return "UNKNOWN";
  }
}

export function toolSuccess(
  data: Record<string, unknown>,
  summary?: string,
): ToolResult {
  return { success: true, data, summary };
}

export function toolFailure(code: ToolErrorCode, message: string, summary?: string): ToolResult {
  return {
    success: false,
    error: { code, message },
    summary: summary ?? message,
  };
}

export function toolFailureFromError(error: unknown, fallbackMessage: string): ToolResult {
  if (error instanceof AppError) {
    return toolFailure(mapAppErrorToToolCode(error), error.message);
  }
  return toolFailure("UNKNOWN", fallbackMessage);
}

export function toolErrorMessage(result: ToolResult): string {
  if (typeof result.error === "string") return result.error;
  return result.error?.message ?? "Unknown error";
}
