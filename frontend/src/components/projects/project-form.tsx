"use client";

import { useEffect, useState, type FormEvent } from "react";

import { createProject } from "@/lib/api/projects.api";
import { listEmployees } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import type { ProjectDetail, ProjectPriority, ProjectStatus } from "@/types/project";

interface ProjectFormProps {
  onCreated: (project: ProjectDetail) => void;
  defaultOpen?: boolean;
  onCancel?: () => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"];
const PRIORITY_OPTIONS: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function ProjectForm({ onCreated, defaultOpen = false, onCancel }: ProjectFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    status: "PLANNING" as ProjectStatus,
    priority: "MEDIUM" as ProjectPriority,
    startDate: "",
    targetDate: "",
    ownerId: "",
  });

  useEffect(() => {
    if (!open) return;
    void listEmployees({ limit: 100, status: "ACTIVE" }).then((response) => {
      setOwners(
        response.data.employees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
        })),
      );
    });
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createProject({
        name: form.name.trim(),
        key: form.key.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || undefined,
        targetDate: form.targetDate || undefined,
        ownerId: form.ownerId || undefined,
      });
      onCreated(response.data.project);
      setOpen(false);
      onCancel?.();
      setForm({
        name: "",
        key: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        startDate: "",
        targetDate: "",
        ownerId: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        + New Project
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <h2 className="text-lg font-medium text-foreground">Create project</h2>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Project name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Key (e.g. PAY)"
          value={form.key}
          onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm font-mono uppercase"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-border-strong px-3 py-2 text-sm"
          rows={2}
        />
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as ProjectPriority }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.targetDate}
          onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <select
          value={form.ownerId}
          onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-border-strong px-3 py-2 text-sm"
        >
          <option value="">Select owner (optional)</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onCancel?.();
          }}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
