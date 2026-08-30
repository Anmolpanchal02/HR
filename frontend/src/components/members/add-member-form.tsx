"use client";

import { useState, type FormEvent } from "react";

import { createMember } from "@/lib/api/users.api";
import { ApiError } from "@/lib/api/client";
import type { MemberRole, MemberUser } from "@/types/users";
import { getAssignableRoles } from "@/types/users";
import type { UserRole } from "@/types/auth";

interface AddMemberFormProps {
  currentUserRole: UserRole;
  onCreated: (user: MemberUser) => void;
  defaultOpen?: boolean;
  onCancel?: () => void;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

export function AddMemberForm({
  currentUserRole,
  onCreated,
  defaultOpen = false,
  onCancel,
}: AddMemberFormProps) {
  const assignableRoles = getAssignableRoles(currentUserRole);
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<MemberRole>(assignableRoles[0] ?? "ENGINEER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const response = await createMember({ name: name.trim(), email: email.trim(), password, role });
      onCreated(response.data.user);
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      onCancel?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create member");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        + Add Member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-foreground">Add Member</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        >
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Member"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onCancel?.();
          }}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm text-foreground hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
