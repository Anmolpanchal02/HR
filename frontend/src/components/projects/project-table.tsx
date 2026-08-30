"use client";

import Link from "next/link";

import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProjectListItem } from "@/types/project";

interface ProjectTableProps {
  projects: ProjectListItem[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return <EmptyState title="No projects found" description="Try adjusting your filters." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Key</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="border-b border-border last:border-0 hover:bg-background/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{project.key}</td>
              <td className="px-4 py-3 text-foreground">{project.owner?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={project.priority} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
