"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  listMyLeaveRequests,
  listPendingLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leave.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { CreateLeavePayload, LeaveRequest, LeaveType } from "@/types/leave";
import { canReviewLeave, isPeopleOpsRole } from "@/types/permissions";

const LEAVE_TYPES: LeaveType[] = ["ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"];

function statusBadge(status: LeaveRequest["status"]): string {
  switch (status) {
    case "APPROVED":
      return "bg-success-soft text-success";
    case "REJECTED":
      return "bg-destructive-soft text-destructive";
    case "PENDING":
      return "bg-warning-soft text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function LeavePage() {
  const { user, refreshUser } = useAuth();
  const userId = user?.id;
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateLeavePayload>({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const canSeePendingQueue = user ? canReviewLeave(user.role, user.hasDirectReports) : false;

  const fetchLeaveData = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const mine = await listMyLeaveRequests({ limit: 20 });
      setMyRequests(mine.data.requests);

      if (canSeePendingQueue) {
        const pendingRes = await listPendingLeaveRequests({ limit: 20 });
        setPending(pendingRes.data.requests);
      } else {
        setPending([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load leave requests");
    }
  }, [userId, canSeePendingQueue]);

  useEffect(() => {
    if (!user || user.employeeId || user.role !== "EMPLOYEE") return;
    void refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show skeleton only when user changes
    setLoading(true);

    void fetchLeaveData().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, fetchLeaveData]);

  async function refreshLeaveData() {
    await fetchLeaveData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createLeaveRequest(form);
      setForm({ leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" });
      await refreshLeaveData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveLeaveRequest(id);
      await refreshLeaveData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed");
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Rejection reason (optional):") ?? undefined;
    try {
      await rejectLeaveRequest(id, reason);
      await refreshLeaveData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed");
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelLeaveRequest(id);
      await refreshLeaveData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel failed");
    }
  }

  if (!user || loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description={
          canSeePendingQueue
            ? "Apply for leave and review pending team requests."
            : "Apply for leave and track your requests."
        }
      />

      {error && <ErrorState message={error} onRetry={() => void refreshLeaveData()} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Apply for leave" description="Sent to your manager for approval" />
          {!user.employeeId && (
            <p className="mb-3 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
              Linking your employee profile… If this stays, ask HR to add you in Employees, then
              refresh the page.
            </p>
          )}
          <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
            <label className="block text-sm">
              <span className="text-muted-foreground">Type</span>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
            <Textarea
              label="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
            <Button type="submit" loading={submitting}>
              Submit request
            </Button>
          </form>
        </Card>

        {pending.length > 0 && (
          <Card>
            <CardHeader
              title="Pending approvals"
              description={
                user && isPeopleOpsRole(user.role)
                  ? "All pending leave in your organization"
                  : "Leave requests from your direct reports"
              }
            />
            <ul className="space-y-3">
              {pending.map((req) => (
                <li key={req.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium text-foreground">{req.employeeName}</p>
                  <p className="text-muted-foreground">
                    {req.leaveType} · {req.startDate} → {req.endDate} ({req.totalDays} days)
                  </p>
                  <p className="mt-1 text-foreground">{req.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => void handleApprove(req.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void handleReject(req.id)}>
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader title="My leave history" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Days</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-muted-foreground">
                    No leave requests yet.
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{req.leaveType}</td>
                    <td className="py-2 pr-4">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="py-2 pr-4">{req.totalDays}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {req.status === "PENDING" && (
                        <Button size="sm" variant="ghost" onClick={() => void handleCancel(req.id)}>
                          Cancel
                        </Button>
                      )}
                    </td>
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
