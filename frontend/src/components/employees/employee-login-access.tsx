"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

interface EmployeeLoginAccessProps {
  email: string;
  credentials: { email: string; temporaryPassword: string } | null;
  resetting: boolean;
  onReset: (password?: string) => void;
  onDismissCredentials: () => void;
}

export function EmployeeLoginAccess({
  email,
  credentials,
  resetting,
  onReset,
  onDismissCredentials,
}: EmployeeLoginAccessProps) {
  const [copied, setCopied] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  async function copyCredentials() {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader
        title="Login access"
        description={
          credentials
            ? "Share these credentials with the employee. They are shown only once."
            : "Set a custom password or leave blank to auto-generate one."
        }
      />
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Login email
          </p>
          <p className="mt-1 font-mono text-foreground">{email}</p>
        </div>

        {credentials ? (
          <div className="rounded-xl border border-primary/30 bg-primary-soft p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Password</p>
                <p className="mt-1 break-all font-mono text-sm text-foreground">
                  {credentials.temporaryPassword}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={onDismissCredentials}>
                Dismiss
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void copyCredentials()}>
                {copied ? "Copied!" : "Copy credentials"}
              </Button>
              <Button size="sm" variant="ghost" loading={resetting} onClick={() => onReset()}>
                Generate another
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showCustomPassword ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Custom password (optional)
                </label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, lower, number"
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Set custom password instead
              </button>
            )}
            <Button
              size="sm"
              loading={resetting}
              onClick={() => onReset(customPassword.trim() || undefined)}
            >
              {customPassword.trim() ? "Set login password" : "Generate login password"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export const employeeCredentialsStorageKey = (employeeId: string) =>
  `hr-employee-credentials:${employeeId}`;

export function storeEmployeeCredentials(
  employeeId: string,
  credentials: { email: string; temporaryPassword: string },
): void {
  sessionStorage.setItem(employeeCredentialsStorageKey(employeeId), JSON.stringify(credentials));
}

export function readEmployeeCredentials(
  employeeId: string,
): { email: string; temporaryPassword: string } | null {
  const raw = sessionStorage.getItem(employeeCredentialsStorageKey(employeeId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { email: string; temporaryPassword: string };
  } catch {
    return null;
  }
}

export function clearEmployeeCredentials(employeeId: string): void {
  sessionStorage.removeItem(employeeCredentialsStorageKey(employeeId));
}
