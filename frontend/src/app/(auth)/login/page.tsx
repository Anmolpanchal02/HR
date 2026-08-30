import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your organization account"
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
