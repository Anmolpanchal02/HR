import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Set up your organization and admin account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
