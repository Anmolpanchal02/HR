"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCrmSessionRefresh } from "@/hooks/use-crm-session-refresh";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  listAllLeaveRequests,
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

function LeaveRequestTable({
  requests,
  showEmployee,
  onApprove,
  onReject,
  onCancel,
  emptyMessage,
}: {
  requests: LeaveRequest[];
  showEmployee?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {showEmployee && <th className="py-2 pr-4">Employee</th>}
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Dates</th>
            <th className="py-2 pr-4">Days</th>
            <th className="py-2 pr-4">Status</th>
            {(onApprove || onReject || onCancel) && <th className="py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td
                colSpan={showEmployee ? 6 : 5}
                className="py-6 text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id} className="border-b border-border/60">
                {showEmployee && <td className="py-2 pr-4">{req.employeeName}</td>}
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
                {(onApprove || onReject || onCancel) && (
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {onApprove && req.status === "PENDING" && (
                        <Button size="sm" onClick={() => onApprove(req.id)}>
                          Approve
                        </Button>
                      )}
                      {onReject && req.status === "PENDING" && (
                        <Button size="sm" variant="danger" onClick={() => onReject(req.id)}>
                          Reject
                        </Button>
                      )}
                      {onCancel && req.status === "PENDING" && (
                        <Button size="sm" variant="ghost" onClick={() => onCancel(req.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function LeavePage() {
  const { user, refreshUser } = useAuth();
  useCrmSessionRefresh();
  const userId = user?.id;
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hrView, setHrView] = useState<"pending" | "all">("pending");
  const [form, setForm] = useState<CreateLeavePayload>({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const peopleOps = user ? isPeopleOpsRole(user.role) : false;
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

      if (peopleOps) {
        const allRes = await listAllLeaveRequests({ limit: 30 });
        setAllRequests(allRes.data.requests);
      } else {
        setAllRequests([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load leave requests");
    }
  }, [userId, canSeePendingQueue, peopleOps]);

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

  const reviewList = peopleOps && hrView === "all" ? allRequests : pending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description={
          canSeePendingQueue
            ? "Apply for leave and review team requests."
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
            <Button type="submit" loading={submitting} disabled={!user.employeeId}>
              Submit request
            </Button>
          </form>
        </Card>

        {canSeePendingQueue && (
          <Card>
            <CardHeader
              title={peopleOps ? "Leave management" : "Pending approvals"}
              description={
                peopleOps
                  ? "Review pending requests or browse organization history"
                  : "Leave requests from your direct reports"
              }
              action={
                peopleOps ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={hrView === "pending" ? "primary" : "secondary"}
                      onClick={() => setHrView("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={hrView === "all" ? "primary" : "secondary"}
                      onClick={() => setHrView("all")}
                    >
                      All
                    </Button>
                  </div>
                ) : undefined
              }
            />
            {peopleOps && hrView === "all" ? (
              <LeaveRequestTable
                requests={reviewList}
                showEmployee
                emptyMessage="No leave requests in the organization yet."
              />
            ) : reviewList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending leave requests.</p>
            ) : (
              <ul className="space-y-3">
                {reviewList.map((req) => (
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
            )}
          </Card>
        )}
      </div>

      <Card>
        <CardHeader title="My leave history" />
        <LeaveRequestTable
          requests={myRequests}
          onCancel={(id) => void handleCancel(id)}
          emptyMessage="No leave requests yet."
        />
      </Card>
    </div>
  );
}
