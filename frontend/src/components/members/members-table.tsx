"use client";

import { updateMemberStatus } from "@/lib/api/users.api";
import { ApiError } from "@/lib/api/client";
import type { MemberUser } from "@/types/users";
import type { UserRole } from "@/types/auth";
import { getAssignableRoles } from "@/types/users";

interface MembersTableProps {
  members: MemberUser[];
  currentUserRole: UserRole;
  onUpdated: (user: MemberUser) => void;
}

function canToggleStatus(actorRole: UserRole, target: MemberUser): boolean {
  if (actorRole === "ADMIN") {
    return target.role !== "ADMIN";
  }

  if (actorRole === "HR") {
    return target.role === "ENGINEER" || target.role === "EMPLOYEE";
  }

  return false;
}

export function MembersTable({ members, currentUserRole, onUpdated }: MembersTableProps) {
  const assignableRoles = getAssignableRoles(currentUserRole);

  async function handleToggleStatus(member: MemberUser) {
    if (!canToggleStatus(currentUserRole, member)) {
      return;
    }

    try {
      const response = await updateMemberStatus(member.id, {
        isActive: !member.isActive,
      });
      onUpdated(response.data.user);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to update member status";
      alert(message);
    }
  }

  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
        No members found yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
              <td className="px-4 py-3 text-foreground">{member.email}</td>
              <td className="px-4 py-3 text-foreground">{member.role}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    member.isActive
                      ? "bg-success-soft text-success-foreground"
                      : "bg-surface-muted text-foreground"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                {canToggleStatus(currentUserRole, member) ? (
                  <button
                    type="button"
                    onClick={() => void handleToggleStatus(member)}
                    className="text-sm font-medium text-foreground underline hover:text-foreground"
                  >
                    {member.isActive ? "Deactivate" : "Activate"}
                  </button>
                ) : (
                  <span className="text-xs text-subtle-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {assignableRoles.length === 0 && (
        <p className="px-4 py-2 text-xs text-muted-foreground">No assignable roles for your account.</p>
      )}
    </div>
  );
}
