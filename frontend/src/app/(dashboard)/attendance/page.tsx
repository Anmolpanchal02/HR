"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  listAllAttendance,
  listMyAttendance,
  listTeamAttendance,
} from "@/lib/api/attendance.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { AttendanceRecord, TodayAttendanceSummary } from "@/types/attendance";
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
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"mine" | "team" | "all">("mine");

  const peopleOps = user ? isPeopleOpsRole(user.role) : false;
  const canViewTeam = user ? canViewTeamAttendance(user.role, user.hasDirectReports) : false;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const todayRes = await getTodayAttendance();
      setSummary(todayRes.data.summary);

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

  async function handleCheckIn() {
    setActionLoading(true);
    setError(null);
    try {
      await checkIn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    setError(null);
    try {
      await checkOut();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (!user || loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily check-in/out with org work hours (default 10:00–19:00)."
      />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Today" description={summary?.date ?? "—"} />
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work hours</span>
              <span className="font-medium text-foreground">
                {summary?.workHours.startTime} – {summary?.workHours.endTime} ({summary?.workHours.timezone})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check in</span>
              <span className="font-medium">{formatTime(summary?.record?.checkInAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check out</span>
              <span className="font-medium">{formatTime(summary?.record?.checkOutAt)}</span>
            </div>
            {summary?.record && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(summary.record.status)}`}>
                  {summary.record.status}
                  {summary.record.lateMinutes > 0 ? ` (+${summary.record.lateMinutes}m late)` : ""}
                </span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => void handleCheckIn()}
                disabled={!summary?.canCheckIn || actionLoading}
              >
                Check in
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handleCheckOut()}
                disabled={!summary?.canCheckOut || actionLoading}
              >
                Check out
              </Button>
            </div>
            {!user.employeeId && (
              <p className="text-xs text-muted-foreground">
                Link an employee profile to your account to use attendance.
              </p>
            )}
          </div>
        </Card>

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
              Work hours settings (Admin/HR) →
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
