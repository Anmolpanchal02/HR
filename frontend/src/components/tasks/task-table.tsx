"use client";

import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import type { TaskListItem } from "@/types/task";

interface TaskTableProps {
  tasks: TaskListItem[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
              <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{task.project?.key ?? "—"}</td>
              <td className="px-4 py-3 text-foreground">{task.assignee?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{task.dueDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
