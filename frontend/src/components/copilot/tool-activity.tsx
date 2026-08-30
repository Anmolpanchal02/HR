"use client";

import type { ToolCallSummary } from "@/types/copilot";

interface ToolActivityProps {
  toolCalls: ToolCallSummary[];
}

const TOOL_LABELS: Record<string, string> = {
  search_employees: "Searched employees",
  get_employee: "Fetched employee",
  create_employee: "Created employee",
  update_employee: "Updated employee",
  search_projects: "Searched projects",
  get_project: "Fetched project",
  create_project: "Created project",
  update_project: "Updated project",
  search_tasks: "Searched tasks",
  get_task: "Fetched task",
  create_task: "Created task",
  update_task: "Updated task",
  search_documents: "Searched documents",
  list_documents: "Listed documents",
  get_document: "Fetched document",
};

function activityLabel(call: ToolCallSummary): string {
  if (call.summary) return call.summary;
  const prefix = TOOL_LABELS[call.tool] ?? call.tool.replace(/_/g, " ");
  return call.status === "success" ? prefix : `${prefix} failed`;
}

export function ToolActivity({ toolCalls }: ToolActivityProps) {
  if (toolCalls.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tool activity">
      {toolCalls.map((call, index) => {
        const ok = call.status === "success";
        return (
          <li
            key={`${call.tool}-${index}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              ok
                ? "bg-success-soft text-success ring-1 ring-success/25"
                : "bg-destructive-soft text-destructive ring-1 ring-destructive/25"
            }`}
          >
            <span aria-hidden>{ok ? "✓" : "✕"}</span>
            <span>{activityLabel(call)}</span>
          </li>
        );
      })}
    </ul>
  );
}
