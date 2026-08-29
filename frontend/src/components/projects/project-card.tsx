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
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{project.name}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{project.key}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
            {formatLabel(project.status)}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
            {formatLabel(project.priority)}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Owner</dt>
          <dd className="font-medium text-zinc-900">{project.owner?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Start date</dt>
          <dd className="font-medium text-zinc-900">{project.startDate ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Target date</dt>
          <dd className="font-medium text-zinc-900">{project.targetDate ?? "—"}</dd>
        </div>
      </dl>

      {project.description && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-zinc-700">Description</h2>
          <p className="mt-2 text-sm text-zinc-600">{project.description}</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium text-zinc-700">Task summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(
            ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED", "CANCELLED"] as const
          ).map((status) => (
            <div key={status} className="rounded-lg border border-zinc-200 px-3 py-2 text-center">
              <p className="text-xs text-zinc-500">{formatLabel(status)}</p>
              <p className="text-lg font-semibold text-zinc-900">{project.taskSummary[status]}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/projects" className="mt-6 inline-block text-sm text-zinc-700 underline">
        Back to projects
      </Link>
    </section>
  );
}
