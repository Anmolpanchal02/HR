"use client";

import { useCallback, useEffect, useState } from "react";

import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { listEmployees } from "@/lib/api/employees.api";
import { listProjects } from "@/lib/api/projects.api";
import { listTasks } from "@/lib/api/tasks.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { PaginationMeta } from "@/types/project";
import type { TaskListItem, TaskPriority, TaskStatus } from "@/types/task";
import { canCreateTasks } from "@/types/task";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; key: string }>>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [page, setPage] = useState(1);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listTasks({
        page,
        limit: 20,
        search: search || undefined,
        projectId: projectId || undefined,
        assigneeId: assigneeId || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [page, search, projectId, assigneeId, status, priority]);

  useEffect(() => {
    void listProjects({ limit: 100 }).then((r) => setProjects(r.data.projects));
    void listEmployees({ limit: 100, status: "ACTIVE" })
      .then((r) =>
        setAssignees(
          r.data.employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })),
        ),
      )
      .catch(() => setAssignees([]));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load tasks from API
    void loadTasks();
  }, [loadTasks]);

  if (!user) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track and manage work across your organization."
        action={
          canCreateTasks(user.role) && !showCreate ? (
            <Button onClick={() => setShowCreate(true)}>+ New Task</Button>
          ) : undefined
        }
      />

      <TaskFilters
        search={search}
        projectId={projectId}
        assigneeId={assigneeId}
        status={status}
        priority={priority}
        projects={projects}
        assignees={assignees}
        onSearchChange={setSearch}
        onProjectChange={setProjectId}
        onAssigneeChange={setAssigneeId}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onApply={() => {
          setPage(1);
          void loadTasks();
        }}
      />

      {showCreate && canCreateTasks(user.role) && (
        <TaskForm
          defaultOpen
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void loadTasks();
          }}
        />
      )}

      {error && <ErrorState message={error} onRetry={() => void loadTasks()} />}

      {loading ? (
        <TableSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks found" description="Try adjusting filters or create a new task." />
      ) : (
        <>
          <TaskTable tasks={tasks} />
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
