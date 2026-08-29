"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconCopilot } from "@/components/icons";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { listDocuments } from "@/lib/api/documents.api";
import { listEmployees } from "@/lib/api/employees.api";
import { listProjects } from "@/lib/api/projects.api";
import { listTasks } from "@/lib/api/tasks.api";
import { useAuth } from "@/providers/auth-provider";
import { getGreeting } from "@/lib/utils";
import type { ProjectListItem } from "@/types/project";
import type { TaskListItem } from "@/types/task";

interface DashboardStats {
  employees: number;
  activeProjects: number;
  openTasks: number;
  documents: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [employeesRes, projectsRes, tasksRes, docsRes, activeRes] = await Promise.all([
          listEmployees({ limit: 1 }),
          listProjects({ limit: 5 }),
          listTasks({ limit: 5 }),
          listDocuments({ limit: 1 }),
          listProjects({ limit: 1, status: "ACTIVE" }),
        ]);

        setStats({
          employees: employeesRes.data.pagination.total,
          activeProjects: activeRes.data.pagination.total,
          openTasks: tasksRes.data.pagination.total,
          documents: docsRes.data.pagination.total,
        });
        setProjects(projectsRes.data.projects);
        setTasks(tasksRes.data.tasks);
      } catch {
        setError("We couldn't load your dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading || !user) return <PageSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Employees", value: stats?.employees ?? 0, href: "/employees" },
    { label: "Active Projects", value: stats?.activeProjects ?? 0, href: "/projects" },
    { label: "Tasks", value: stats?.openTasks ?? 0, href: "/tasks" },
    { label: "Documents", value: stats?.documents ?? 0, href: "/documents" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {getGreeting(user.name)}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s happening in your organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Projects Overview" description="Recent projects in your organization" />
          {projects.length === 0 ? (
            <p className="text-sm text-zinc-500">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {p.key} · {p.name}
                      </p>
                      <p className="text-xs text-zinc-500">{p.owner?.name ?? "No owner"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <StatusBadge status={p.status} />
                      <PriorityBadge priority={p.priority} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Tasks" description="Latest open tasks" />
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No open tasks.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{t.title}</p>
                    <p className="text-xs text-zinc-500">
                      {t.project?.key ?? "—"} · {t.assignee?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Link href="/copilot">
        <Card className="group border-zinc-900/10 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-300">AI Copilot</p>
              <p className="mt-1 text-lg font-semibold">Ask questions about your organization</p>
              <p className="mt-1 text-sm text-zinc-400">
                Search documents, manage tasks, and get work done with AI.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <IconCopilot className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
