"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { checkIn, checkOut, getTodayAttendance } from "@/lib/api/attendance.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { AttendanceRecord, TodayAttendanceSummary } from "@/types/attendance";

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

interface DailyAttendanceCardProps {
  prominent?: boolean;
  showWorkHours?: boolean;
  showViewLink?: boolean;
}

export function DailyAttendanceCard({
  prominent = false,
  showWorkHours = true,
  showViewLink = false,
}: DailyAttendanceCardProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const response = await getTodayAttendance();
      setSummary(response.data.summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId]);

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

  if (!user) return null;

  const checkedIn = Boolean(summary?.record?.checkInAt);
  const checkedOut = Boolean(summary?.record?.checkOutAt);
  const doneForDay = checkedIn && checkedOut;

  return (
    <Card className={prominent ? "border-primary/20 bg-gradient-to-br from-surface to-primary-soft/30" : undefined}>
      <CardHeader
        title={prominent ? "Clock in for today" : "Today"}
        description={
          summary?.date
            ? new Date(`${summary.date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : "—"
        }
        action={
          showViewLink ? (
            <Link href="/attendance" className="text-sm text-primary hover:underline">
              View history →
            </Link>
          ) : undefined
        }
      />

      {!user.employeeId ? (
        <p className="text-sm text-muted-foreground">
          Link an employee profile to your account to use attendance.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading today&apos;s attendance…</p>
      ) : (
        <div className="space-y-4 text-sm">
          {prominent && (
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                  doneForDay
                    ? "bg-success-soft text-success"
                    : checkedIn
                      ? "bg-warning-soft text-warning"
                      : "bg-muted text-muted-foreground"
                }`}
                aria-hidden
              >
                {doneForDay ? "✓" : checkedIn ? "●" : "○"}
              </span>
              <div>
                <p className="font-medium text-foreground">
                  {doneForDay
                    ? "Done for today"
                    : checkedIn
                      ? `Checked in at ${formatTime(summary?.record?.checkInAt)}`
                      : "Not checked in yet"}
                </p>
                <p className="text-muted-foreground">
                  {doneForDay
                    ? `In ${formatTime(summary?.record?.checkInAt)} · Out ${formatTime(summary?.record?.checkOutAt)}`
                    : checkedIn
                      ? "Remember to clock out when you finish."
                      : "Tap clock in when you start work."}
                </p>
              </div>
            </div>
          )}

          {!prominent && (
            <>
              {showWorkHours && summary && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Work hours</span>
                  <span className="font-medium text-foreground">
                    {summary.workHours.startTime} – {summary.workHours.endTime} (
                    {summary.workHours.timezone})
                  </span>
                </div>
              )}
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(summary.record.status)}`}
                  >
                    {summary.record.status}
                    {summary.record.lateMinutes > 0
                      ? ` (+${summary.record.lateMinutes}m late)`
                      : ""}
                  </span>
                </div>
              )}
            </>
          )}

          {prominent && showWorkHours && summary && (
            <p className="text-xs text-muted-foreground">
              Work hours: {summary.workHours.startTime} – {summary.workHours.endTime} (
              {summary.workHours.timezone})
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className={`flex flex-wrap gap-2 ${prominent ? "pt-1" : "pt-2"}`}>
            <Button
              size={prominent ? "lg" : "md"}
              onClick={() => void handleCheckIn()}
              disabled={!summary?.canCheckIn || actionLoading}
              loading={actionLoading && !checkedIn}
            >
              Clock in
            </Button>
            <Button
              variant="secondary"
              size={prominent ? "lg" : "md"}
              onClick={() => void handleCheckOut()}
              disabled={!summary?.canCheckOut || actionLoading}
              loading={actionLoading && checkedIn && !checkedOut}
            >
              Clock out
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
