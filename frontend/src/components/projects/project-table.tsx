"use client";

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
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
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
            <tr key={project.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
              <td className="px-4 py-3">
                <Link href={`/projects/${project.id}`} className="font-medium text-zinc-900 hover:underline">
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{project.key}</td>
              <td className="px-4 py-3 text-zinc-700">{project.owner?.name ?? "—"}</td>
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
