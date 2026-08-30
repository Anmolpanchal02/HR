"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { listDocuments } from "@/lib/api/documents.api";
import { listProjects } from "@/lib/api/projects.api";
import { listTasks } from "@/lib/api/tasks.api";
import { useAuth } from "@/providers/auth-provider";
import type { ProjectListItem } from "@/types/project";
import type { TaskListItem } from "@/types/task";

export default function EngineeringPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [projectsRes, tasksRes, docsRes, activeRes] = await Promise.all([
          listProjects({ limit: 6 }),
          listTasks({ limit: 8 }),
          listDocuments({ limit: 1 }),
          listProjects({ limit: 1, status: "ACTIVE" }),
        ]);
        setProjects(projectsRes.data.projects);
        setTasks(tasksRes.data.tasks);
        setTaskCount(tasksRes.data.pagination.total);
        setDocCount(docsRes.data.pagination.total);
        setActiveCount(activeRes.data.pagination.total);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (!user || loading) return <PageSkeleton />;

  const stats = [
    { label: "Active projects", value: String(activeCount) },
    { label: "Open tasks", value: String(taskCount) },
    { label: "Documents", value: String(docCount) },
    { label: "GitHub", value: "Soon" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering"
        description="Projects, tasks, and docs for delivery work. GitHub insights will plug in here later."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Projects" description="Active delivery work" />
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 hover:bg-surface-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {project.key} · {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.owner?.name ?? "No owner"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent tasks" description="Work across engineering projects" />
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project?.key ?? "—"} · {task.assignee?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <EmptyState
        title="GitHub integration coming soon"
        description="PRs, issues, and commits will appear here once a repo is connected. Until then, use Projects and Tasks for delivery."
      />
    </div>
  );
}
