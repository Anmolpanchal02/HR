"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { DailyAttendanceCard } from "@/components/attendance/daily-attendance-card";
import {
  listAllAttendance,
  listMyAttendance,
  listTeamAttendance,
} from "@/lib/api/attendance.api";
import { ApiError } from "@/lib/api/client";
import { useCrmSessionRefresh } from "@/hooks/use-crm-session-refresh";
import { useAuth } from "@/providers/auth-provider";
import type { AttendanceRecord } from "@/types/attendance";
import { canViewTeamAttendance, isPeopleOpsRole } from "@/types/permissions";

function formatTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: AttendanceRecord["status"]): string {
  switch (status) {
    case "PRESENT":
      return "bg-success-soft text-success";
    case "LATE":
      return "bg-warning-soft text-warning";
    case "ABSENT":
      return "bg-destructive-soft text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AttendancePage() {
  const { user } = useAuth();
  useCrmSessionRefresh();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"mine" | "team" | "all">("mine");

  const peopleOps = user ? isPeopleOpsRole(user.role) : false;
  const canViewTeam = user ? canViewTeamAttendance(user.role, user.hasDirectReports) : false;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const listRes =
        view === "all" && peopleOps
          ? await listAllAttendance({ limit: 20 })
          : view === "team" && canViewTeam
            ? await listTeamAttendance({ limit: 20 })
            : await listMyAttendance({ limit: 20 });
      setRecords(listRes.data.records);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [user, view, peopleOps, canViewTeam]);

  useEffect(() => {
    if (view === "team" && !canViewTeam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset invalid tab for role
      setView("mine");
    }
  }, [view, canViewTeam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load attendance from API
    void load();
  }, [load]);

  if (!user || loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily check-in/out with org work hours (default 10:00–19:00)."
      />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyAttendanceCard />

        <Card>
          <CardHeader title="Quick links" description="HR CRM modules" />
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/leave" className="text-primary hover:underline">
              Apply for leave →
            </Link>
            <Link href="/org-chart" className="text-primary hover:underline">
              View org chart →
            </Link>
            <Link href="/settings" className="text-primary hover:underline">
              View work hours & policies →
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Records"
          description="Your attendance history, team (if manager), or all (HR/Admin)"
          action={
            <div className="flex gap-2">
              <Button variant={view === "mine" ? "primary" : "secondary"} size="sm" onClick={() => setView("mine")}>
                Mine
              </Button>
              {canViewTeam && (
                <Button variant={view === "team" ? "primary" : "secondary"} size="sm" onClick={() => setView("team")}>
                  Team
                </Button>
              )}
              {peopleOps && (
                <Button variant={view === "all" ? "primary" : "secondary"} size="sm" onClick={() => setView("all")}>
                  All
                </Button>
              )}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Employee</th>
                <th className="py-2 pr-4 font-medium">In</th>
                <th className="py-2 pr-4 font-medium">Out</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Work (min)</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-muted-foreground">
                    No attendance records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{r.date}</td>
                    <td className="py-2 pr-4">{r.employeeName}</td>
                    <td className="py-2 pr-4">{formatTime(r.checkInAt)}</td>
                    <td className="py-2 pr-4">{formatTime(r.checkOutAt)}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2">{r.workMinutes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
