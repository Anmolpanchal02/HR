"use client";

import type { ToolCallSummary } from "@/types/copilot";

interface ToolActivityProps {
  toolCalls: ToolCallSummary[];
}

const TOOL_LABELS: Record<string, string> = {
  search_employees: "Searching employees",
  get_employee: "Fetching employee",
  search_projects: "Searching projects",
  get_project: "Fetching project",
  create_project: "Creating project",
  update_project: "Updating project",
  search_tasks: "Searching tasks",
  get_task: "Fetching task",
  create_task: "Creating task",
  update_task: "Updating task",
  search_documents: "Searching documents",
};

function activityLabel(call: ToolCallSummary): string {
  if (call.summary) return call.summary;
  const prefix = TOOL_LABELS[call.tool] ?? call.tool.replace(/_/g, " ");
  return call.status === "success" ? prefix : `${prefix} failed`;
}

export function ToolActivity({ toolCalls }: ToolActivityProps) {
  if (toolCalls.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3" aria-label="Tool activity">
      {toolCalls.map((call, index) => (
        <li
          key={`${call.tool}-${index}`}
          className={`flex items-start gap-2 text-xs ${
            call.status === "success" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          <span aria-hidden className="mt-px shrink-0">
            {call.status === "success" ? "✓" : "✕"}
          </span>
          <span>{activityLabel(call)}</span>
        </li>
      ))}
    </ul>
  );
}
