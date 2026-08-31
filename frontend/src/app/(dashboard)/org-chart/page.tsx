"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getOrgChart } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import type { OrgChartNode } from "@/types/employee";

function OrgNode({ node, depth = 0 }: { node: OrgChartNode; depth?: number }) {
  return (
    <li className="relative">
      <div
        className="rounded-xl border border-border bg-surface p-3 shadow-sm"
        style={{ marginLeft: depth * 20 }}
      >
        <Link href={`/employees/${node.id}`} className="font-medium text-foreground hover:underline">
          {node.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {node.jobTitle} · {node.department}
        </p>
        {node.children.length > 0 && (
          <p className="mt-1 text-[11px] text-subtle-foreground">
            {node.children.length} direct report{node.children.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-2 space-y-2 border-l border-border pl-3">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartPage() {
  const [roots, setRoots] = useState<OrgChartNode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getOrgChart();
        setRoots(res.data.roots);
        setTotal(res.data.totalEmployees);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load org chart");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Org chart"
        description="Who reports to whom — manager hierarchy across the company."
      />

      {error && <ErrorState message={error} />}

      <Card>
        <CardHeader
          title="Organization tree"
          description={`${total} active employees · roots = people with no manager assigned`}
        />
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees found for this organization.</p>
        ) : (
          <ul className="space-y-4">
            {roots.map((root) => (
              <OrgNode key={root.id} node={root} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
