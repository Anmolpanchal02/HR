"use client";

import type { ProjectPriority, ProjectStatus } from "@/types/project";

interface ProjectFiltersProps {
  search: string;
  status: ProjectStatus | "";
  priority: ProjectPriority | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatus | "") => void;
  onPriorityChange: (value: ProjectPriority | "") => void;
  onApply: () => void;
}

const STATUS_OPTIONS: Array<ProjectStatus | ""> = [
  "",
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];

const PRIORITY_OPTIONS: Array<ProjectPriority | ""> = [
  "",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export function ProjectFilters({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onApply,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="space-y-1 sm:w-36">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ProjectStatus | "")}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "All statuses"}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 sm:w-36">
        <label className="text-xs font-medium text-muted-foreground">Priority</label>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as ProjectPriority | "")}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "All priorities"}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Apply
      </button>
    </div>
  );
}
