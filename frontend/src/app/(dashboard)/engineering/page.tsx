"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const MOCK_STATS = [
  { label: "Repositories", value: "—" },
  { label: "Open PRs", value: "—" },
  { label: "Open Issues", value: "—" },
  { label: "Recent Commits", value: "—" },
];

export default function EngineeringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering"
        description="GitHub integration and engineering activity overview."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-400">{stat.value}</p>
          </Card>
        ))}
      </div>

      <EmptyState
        title="GitHub integration coming soon"
        description="Connect your organization's GitHub repositories to track pull requests, issues, and engineering activity alongside HR Copilot."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {["Repositories", "Pull Requests", "Issues", "Recent Activity"].map((section) => (
          <Card key={section}>
            <h3 className="text-sm font-semibold text-zinc-900">{section}</h3>
            <p className="mt-2 text-sm text-zinc-500">No data available yet.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
