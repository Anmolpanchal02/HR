"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and organization preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" description="Your account information" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-500">Role</dt>
              <dd>
                <RoleBadge role={user.role} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Organization" description="Your workspace" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Organization</dt>
              <dd className="font-medium text-zinc-900">
                {user.organizationName ?? user.organizationId}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="GitHub Integration" description="Connect repositories for engineering insights" />
          <p className="text-sm text-zinc-500">
            GitHub integration is not yet configured. This will be available in a future release.
          </p>
        </Card>

        <Card>
          <CardHeader title="AI Settings" description="Copilot and document search preferences" />
          <p className="text-sm text-zinc-500">
            AI provider and model settings are managed by your organization administrator.
          </p>
          {isAdmin && (
            <p className="mt-2 text-xs text-zinc-400">
              Admin: configure LLM_PROVIDER and related settings in backend environment variables.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
