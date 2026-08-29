"use client";

import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import type { TaskListItem } from "@/types/task";

interface TaskTableProps {
  tasks: TaskListItem[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
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
            <tr key={task.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
              <td className="px-4 py-3 font-medium text-zinc-900">{task.title}</td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{task.project?.key ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-700">{task.assignee?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 text-zinc-600">{task.dueDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
