"use client";

import Link from "next/link";

import type { ProjectDetail } from "@/types/project";

interface ProjectCardProps {
  project: ProjectDetail;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{project.key}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-foreground">
            {formatLabel(project.status)}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-foreground">
            {formatLabel(project.priority)}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="font-medium text-foreground">{project.owner?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Start date</dt>
          <dd className="font-medium text-foreground">{project.startDate ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Target date</dt>
          <dd className="font-medium text-foreground">{project.targetDate ?? "—"}</dd>
        </div>
      </dl>

      {project.description && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-foreground">Description</h2>
          <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium text-foreground">Task summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(
            ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED", "CANCELLED"] as const
          ).map((status) => (
            <div key={status} className="rounded-lg border border-border px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">{formatLabel(status)}</p>
              <p className="text-lg font-semibold text-foreground">{project.taskSummary[status]}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/projects" className="mt-6 inline-block text-sm text-foreground underline">
        Back to projects
      </Link>
    </section>
  );
}
