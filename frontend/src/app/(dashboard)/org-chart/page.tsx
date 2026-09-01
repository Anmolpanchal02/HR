"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useCrmSessionRefresh } from "@/hooks/use-crm-session-refresh";
import { getOrgChart } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { OrgChartNode } from "@/types/employee";
import { canViewEmployeeProfile, isPeopleOpsRole } from "@/types/permissions";

function OrgNode({
  node,
  depth = 0,
  canLink,
  viewerEmployeeId,
  viewerRole,
}: {
  node: OrgChartNode;
  depth?: number;
  canLink: (nodeId: string) => boolean;
  viewerEmployeeId?: string;
  viewerRole: import("@/types/auth").UserRole;
}) {
  const showLink = canLink(node.id);

  return (
    <li className="relative">
      <div
        className="rounded-xl border border-border bg-surface p-3 shadow-sm"
        style={{ marginLeft: depth * 20 }}
      >
        {showLink ? (
          <Link href={`/employees/${node.id}`} className="font-medium text-foreground hover:underline">
            {node.name}
          </Link>
        ) : (
          <p className="font-medium text-foreground">{node.name}</p>
        )}
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
            <OrgNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canLink={canLink}
              viewerEmployeeId={viewerEmployeeId}
              viewerRole={viewerRole}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartPage() {
  const { user } = useAuth();
  useCrmSessionRefresh();
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

  if (!user || loading) return <PageSkeleton />;

  const peopleOps = isPeopleOpsRole(user.role);
  const canLink = (nodeId: string) =>
    canViewEmployeeProfile(user.role, user.employeeId, nodeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Org chart"
        description={
          peopleOps
            ? "Full organization hierarchy."
            : user.hasDirectReports
              ? "Your team and reporting structure."
              : "Your manager chain and position."
        }
      />

      {error && <ErrorState message={error} />}

      <Card>
        <CardHeader
          title="Organization tree"
          description={
            peopleOps
              ? `${total} active employees · roots = people with no manager assigned`
              : `${total} people in your view`
          }
        />
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees found for this organization.</p>
        ) : (
          <ul className="space-y-4">
            {roots.map((root) => (
              <OrgNode
                key={root.id}
                node={root}
                canLink={canLink}
                viewerEmployeeId={user.employeeId}
                viewerRole={user.role}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
