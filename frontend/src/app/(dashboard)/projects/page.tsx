"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { listProjects } from "@/lib/api/projects.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { PaginationMeta, ProjectListItem, ProjectPriority, ProjectStatus } from "@/types/project";
import { canManageProjects } from "@/types/project";
import { isEmployeeRole } from "@/types/permissions";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [priority, setPriority] = useState<ProjectPriority | "">("");
  const [page, setPage] = useState(1);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProjects({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load projects from API
    void loadProjects();
  }, [loadProjects]);

  if (!user) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={
          isEmployeeRole(user.role)
            ? "Projects you own or have assigned tasks on."
            : "Manage engineering and organizational projects."
        }
        action={
          canManageProjects(user.role) && !showCreate ? (
            <Button onClick={() => setShowCreate(true)}>+ New Project</Button>
          ) : undefined
        }
      />

      <ProjectFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onApply={() => {
          setPage(1);
          void loadProjects();
        }}
      />

      {showCreate && canManageProjects(user.role) && (
        <ProjectForm
          defaultOpen
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void loadProjects();
          }}
        />
      )}

      {error && <ErrorState message={error} onRetry={() => void loadProjects()} />}

      {loading ? (
        <TableSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing your team's work."
          actionLabel={canManageProjects(user.role) ? "Create Project" : undefined}
          onAction={canManageProjects(user.role) ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <>
          <ProjectTable projects={projects} />
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
