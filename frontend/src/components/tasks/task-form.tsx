"use client";

import { useEffect, useState, type FormEvent } from "react";

import { createTask } from "@/lib/api/tasks.api";
import { listProjects } from "@/lib/api/projects.api";
import { listEmployees } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import type { TaskDetail, TaskPriority } from "@/types/task";

interface TaskFormProps {
  onCreated: () => void;
  defaultProjectId?: string;
  defaultOpen?: boolean;
  onCancel?: () => void;
}

export function TaskForm({ onCreated, defaultProjectId, defaultOpen = false, onCancel }: TaskFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; key: string }>>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    projectId: defaultProjectId ?? "",
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    assigneeId: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!open) return;
    void listProjects({ limit: 100 }).then((response) => {
      setProjects(response.data.projects);
    });
    void listEmployees({ limit: 100, status: "ACTIVE" })
      .then((response) => {
        setAssignees(
          response.data.employees.map((e) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
          })),
        );
      })
      .catch(() => {
        setAssignees([]);
      });
  }, [open]);

  useEffect(() => {
    if (defaultProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync default project prop
      setForm((f) => ({ ...f, projectId: defaultProjectId }));
    }
  }, [defaultProjectId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createTask({
        projectId: form.projectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
      });
      onCreated();
      setOpen(false);
      onCancel?.();
      setForm({
        projectId: defaultProjectId ?? "",
        title: "",
        description: "",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        + New Task
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-medium text-zinc-900">Create task</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          required
          value={form.projectId}
          onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
          ))}
        </select>
        <input
          required
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          rows={2}
        />
        <select
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          value={form.assigneeId}
          onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
          className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Select assignee (optional)</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onCancel?.();
          }}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export type { TaskDetail };
