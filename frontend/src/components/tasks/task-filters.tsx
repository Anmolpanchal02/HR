"use client";

import type { TaskPriority, TaskStatus } from "@/types/task";

interface TaskFiltersProps {
  search: string;
  projectId: string;
  assigneeId: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  projects: Array<{ id: string; name: string; key: string }>;
  assignees: Array<{ id: string; name: string }>;
  onSearchChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | "") => void;
  onPriorityChange: (value: TaskPriority | "") => void;
  onApply: () => void;
}

const STATUS_OPTIONS: Array<TaskStatus | ""> = [
  "",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
  "CANCELLED",
];

const PRIORITY_OPTIONS: Array<TaskPriority | ""> = [
  "",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export function TaskFilters({
  search,
  projectId,
  assigneeId,
  status,
  priority,
  projects,
  assignees,
  onSearchChange,
  onProjectChange,
  onAssigneeChange,
  onStatusChange,
  onPriorityChange,
  onApply,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Project</label>
          <select
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.key} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Assignee</label>
          <select
            value={assigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">All assignees</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus | "")}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All statuses"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "")}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All priorities"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Apply
      </button>
    </div>
  );
}
