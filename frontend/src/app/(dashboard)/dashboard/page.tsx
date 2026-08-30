"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  IconCheckSquare,
  IconCopilot,
  IconDocument,
  IconFolder,
  IconUsers,
} from "@/components/icons";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { listDocuments } from "@/lib/api/documents.api";
import { listEmployees } from "@/lib/api/employees.api";
import { listProjects } from "@/lib/api/projects.api";
import { listTasks } from "@/lib/api/tasks.api";
import { useAuth } from "@/providers/auth-provider";
import { getGreeting } from "@/lib/utils";
import { isPeopleOpsRole } from "@/types/permissions";
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

  const peopleOps = user ? isPeopleOpsRole(user.role) : false;
  const showEngineeringHub = user?.role === "ENGINEER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const peopleOpsUser = isPeopleOpsRole(user!.role);
        const [projectsRes, tasksRes, docsRes, activeRes, employeesRes] = await Promise.all([
          listProjects({ limit: 5 }),
          listTasks({ limit: 5 }),
          listDocuments({ limit: 1 }),
          listProjects({ limit: 1, status: "ACTIVE" }),
          peopleOpsUser ? listEmployees({ limit: 1 }) : Promise.resolve(null),
        ]);

        setStats({
          employees: employeesRes?.data.pagination.total ?? 0,
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
  }, [user]);

  if (loading || !user) return <PageSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive-soft p-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  const statCards = peopleOps
    ? [
        {
          label: "Employees",
          value: stats?.employees ?? 0,
          href: "/employees",
          icon: <IconUsers className="h-4 w-4" />,
          tint: "bg-info-soft text-info",
        },
        {
          label: "Active projects",
          value: stats?.activeProjects ?? 0,
          href: "/projects",
          icon: <IconFolder className="h-4 w-4" />,
          tint: "bg-primary-soft text-primary-soft-foreground",
        },
        {
          label: "Tasks",
          value: stats?.openTasks ?? 0,
          href: "/tasks",
          icon: <IconCheckSquare className="h-4 w-4" />,
          tint: "bg-warning-soft text-warning",
        },
        {
          label: "Documents",
          value: stats?.documents ?? 0,
          href: "/documents",
          icon: <IconDocument className="h-4 w-4" />,
          tint: "bg-success-soft text-success",
        },
      ]
    : [
        {
          label: "Active projects",
          value: stats?.activeProjects ?? 0,
          href: "/projects",
          icon: <IconFolder className="h-4 w-4" />,
          tint: "bg-primary-soft text-primary-soft-foreground",
        },
        {
          label: "Tasks",
          value: stats?.openTasks ?? 0,
          href: "/tasks",
          icon: <IconCheckSquare className="h-4 w-4" />,
          tint: "bg-warning-soft text-warning",
        },
        {
          label: "Documents",
          value: stats?.documents ?? 0,
          href: "/documents",
          icon: <IconDocument className="h-4 w-4" />,
          tint: "bg-success-soft text-success",
        },
        showEngineeringHub
          ? {
              label: "Engineering",
              value: "Hub",
              href: "/engineering",
              icon: <IconCopilot className="h-4 w-4" />,
              tint: "bg-info-soft text-info",
            }
          : {
              label: "Copilot",
              value: "Ask",
              href: "/copilot",
              icon: <IconCopilot className="h-4 w-4" />,
              tint: "bg-info-soft text-info",
            },
      ];

  const subtitle =
    user.role === "ENGINEER"
      ? "Your projects, tasks, and docs — ready to ship."
      : "Here's what's happening in your organization.";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {getGreeting(user.name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <span className={`rounded-xl p-2 ${stat.tint}`}>{stat.icon}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Projects" description="Recent projects you can work on" />
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 hover:bg-surface-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.key} · {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.owner?.name ?? "No owner"}</p>
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
          <CardHeader title="Recent tasks" description="Latest tasks across projects" />
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
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
        <Card className="group border-primary/20 bg-gradient-to-br from-brand-from via-primary to-brand-to text-white shadow-md shadow-primary/20 transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">AI Copilot</p>
              <p className="mt-1 text-lg font-semibold">Ask about projects, tasks, or docs</p>
              <p className="mt-1 text-sm text-white/80">
                {user.role === "ENGINEER"
                  ? "Create tasks, look up projects, and search engineering docs."
                  : "Search documents, manage work, and get things done with AI."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <IconCopilot className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
