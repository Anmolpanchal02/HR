"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/badge";
import { ThemePreferenceButtons } from "@/components/ui/theme-toggle";
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/api/organization.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { OrganizationSettings } from "@/types/organization";
import { isPeopleOpsRole } from "@/types/permissions";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const canEditHr = user ? isPeopleOpsRole(user.role) : false;

  useEffect(() => {
    if (!user) return;
    void getOrganizationSettings()
      .then((res) => setSettings(res.data.settings))
      .catch(() => setSettings(null));
  }, [user]);

  async function saveWorkHours() {
    if (!settings || !canEditHr) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateOrganizationSettings({ workHours: settings.workHours });
      setSettings(res.data.settings);
      setMessage("Work hours saved.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and organization preferences." />

      {message && (
        <p className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground">
          {message}
        </p>
      )}

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
            title="Work hours"
            description={
              canEditHr
                ? "Customize office timing (default 10:00–19:00). Used for attendance late detection."
                : "View-only — contact Admin/HR to change"
            }
          />
          {settings ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start"
                  type="time"
                  value={settings.workHours.startTime}
                  disabled={!canEditHr}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workHours: { ...settings.workHours, startTime: e.target.value },
                    })
                  }
                />
                <Input
                  label="End"
                  type="time"
                  value={settings.workHours.endTime}
                  disabled={!canEditHr}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workHours: { ...settings.workHours, endTime: e.target.value },
                    })
                  }
                />
              </div>
              <Input
                label="Timezone"
                value={settings.workHours.timezone}
                disabled={!canEditHr}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    workHours: { ...settings.workHours, timezone: e.target.value },
                  })
                }
              />
              <Input
                label="Grace minutes (late after start + grace)"
                type="number"
                min={0}
                value={settings.workHours.graceMinutes}
                disabled={!canEditHr}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    workHours: {
                      ...settings.workHours,
                      graceMinutes: Number(e.target.value) || 0,
                    },
                  })
                }
              />
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Work days</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, index) => {
                    const active = settings.workHours.workDays.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={!canEditHr}
                        onClick={() => {
                          if (!canEditHr) return;
                          const workDays = active
                            ? settings.workHours.workDays.filter((d) => d !== index)
                            : [...settings.workHours.workDays, index].sort();
                          setSettings({
                            ...settings,
                            workHours: { ...settings.workHours, workDays },
                          });
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-surface text-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {canEditHr && (
                <Button loading={saving} onClick={() => void saveWorkHours()}>
                  Save work hours
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Leave policy" description="Annual / sick / casual balances (reference)" />
          {settings && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Annual</dt>
                <dd>{settings.leavePolicy.annualLeaveDays} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sick</dt>
                <dd>{settings.leavePolicy.sickLeaveDays} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Casual</dt>
                <dd>{settings.leavePolicy.casualLeaveDays} days</dd>
              </div>
            </dl>
          )}
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
