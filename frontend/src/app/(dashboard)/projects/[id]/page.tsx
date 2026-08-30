"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskTable } from "@/components/tasks/task-table";
import { getProject } from "@/lib/api/projects.api";
import { listTasks } from "@/lib/api/tasks.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { ProjectDetail } from "@/types/project";
import type { TaskListItem } from "@/types/task";
import { canCreateTasks } from "@/types/task";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        getProject(params.id),
        listTasks({ projectId: params.id, limit: 50 }),
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load project from API
      void loadData();
    }
  }, [isAuthenticated, isLoading, router, loadData]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-6">
        <p className="text-sm text-destructive">{error ?? "Project not found"}</p>
        <Link href="/projects" className="mt-4 text-sm underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background px-6 py-16">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <ProjectCard project={project} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Tasks</h2>
            {user && canCreateTasks(user.role) && !showCreateTask && (
              <Button size="sm" onClick={() => setShowCreateTask(true)}>
                + New Task
              </Button>
            )}
          </div>
          {showCreateTask && user && canCreateTasks(user.role) && (
            <TaskForm
              defaultOpen
              defaultProjectId={project.id}
              onCancel={() => setShowCreateTask(false)}
              onCreated={() => {
                setShowCreateTask(false);
                void loadData();
              }}
            />
          )}
          <TaskTable tasks={tasks} />
        </section>
      </main>
    </div>
  );
}
