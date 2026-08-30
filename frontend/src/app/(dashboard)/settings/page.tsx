"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/badge";
import { ThemePreferenceButtons } from "@/components/ui/theme-toggle";
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
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
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
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="font-medium text-foreground">
                {user.organizationName ?? user.organizationId}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Appearance"
            description="Choose light, dark, or match your system setting"
          />
          <ThemePreferenceButtons />
        </Card>

        <Card>
          <CardHeader
            title="GitHub Integration"
            description="Connect repositories for engineering insights"
          />
          <p className="text-sm text-muted-foreground">
            GitHub integration is not yet configured. This will be available in a future release.
          </p>
        </Card>

        <Card>
          <CardHeader title="AI Settings" description="Copilot and document search preferences" />
          <p className="text-sm text-muted-foreground">
            AI provider and model settings are managed by your organization administrator.
          </p>
          {isAdmin && (
            <p className="mt-2 text-xs text-subtle-foreground">
              Admin: configure LLM_PROVIDER and related settings in backend environment variables.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
