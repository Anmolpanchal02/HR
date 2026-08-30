"use client";

import type { ToolCallSummary } from "@/types/copilot";

interface ToolActivityListProps {
  toolCalls: ToolCallSummary[];
}

function formatToolLabel(tool: string, summary?: string): string {
  if (summary) return summary;
  return tool.replace(/_/g, " ");
}

export function ToolActivityList({ toolCalls }: ToolActivityListProps) {
  if (toolCalls.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1 border-t border-border pt-3">
      {toolCalls.map((call, index) => (
        <li
          key={`${call.tool}-${index}`}
          className={`flex items-start gap-2 text-xs ${
            call.status === "success" ? "text-success" : "text-destructive"
          }`}
        >
          <span aria-hidden>{call.status === "success" ? "✓" : "✕"}</span>
          <span>{formatToolLabel(call.tool, call.summary)}</span>
        </li>
      ))}
    </ul>
  );
}
