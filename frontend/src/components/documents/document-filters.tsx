"use client";

import type { DocumentStatus } from "@/types/document";

interface DocumentFiltersProps {
  search: string;
  status: DocumentStatus | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DocumentStatus | "") => void;
  onApply: () => void;
}

const STATUS_OPTIONS: Array<DocumentStatus | ""> = [
  "",
  "UPLOADED",
  "PROCESSING",
  "READY",
  "FAILED",
  "ARCHIVED",
];

export function DocumentFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onApply,
}: DocumentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="space-y-1 sm:w-40">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as DocumentStatus | "")}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "All statuses"}
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
