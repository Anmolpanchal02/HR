"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AddMemberForm } from "@/components/members/add-member-form";
import { MembersTable } from "@/components/members/members-table";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { listMembers } from "@/lib/api/users.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { MemberUser } from "@/types/users";
import { canManageMembers } from "@/types/users";

export default function MembersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    setFetchError(null);
    try {
      const response = await listMembers();
      setMembers(response.data.users);
    } catch (error) {
      setFetchError(error instanceof ApiError ? error.message : "Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user && !canManageMembers(user.role)) {
      router.replace("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load members from API
    if (user && canManageMembers(user.role)) void loadMembers();
  }, [isLoading, user, router, loadMembers]);

  if (isLoading || !user) return <TableSkeleton />;
  if (!canManageMembers(user.role)) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`Manage users in ${user.organizationName ?? "your organization"}.`}
        action={
          !showAdd ? (
            <Button onClick={() => setShowAdd(true)}>+ Add Member</Button>
          ) : undefined
        }
      />

      {showAdd && (
        <AddMemberForm
          defaultOpen
          currentUserRole={user.role}
          onCancel={() => setShowAdd(false)}
          onCreated={(created) => {
            setMembers((c) => [created, ...c]);
            setShowAdd(false);
          }}
        />
      )}

      {fetchError && <ErrorState message={fetchError} onRetry={() => void loadMembers()} />}

      {loadingMembers ? (
        <TableSkeleton />
      ) : (
        <MembersTable
          members={members}
          currentUserRole={user.role}
          onUpdated={(updated) =>
            setMembers((c) => c.map((m) => (m.id === updated.id ? updated : m)))
          }
        />
      )}
    </div>
  );
}
