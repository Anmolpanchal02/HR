"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, useAuth } from "@/providers/auth-provider";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!organizationName.trim() || !name.trim() || !email.trim()) {
      setError("All fields are required");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        organizationName: organizationName.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Input
        id="organizationName"
        label="Organization name"
        value={organizationName}
        onChange={(event) => setOrganizationName(event.target.value)}
        required
      />
      <Input
        id="name"
        label="Your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        required
      />
      <Input
        id="confirmPassword"
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        required
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
