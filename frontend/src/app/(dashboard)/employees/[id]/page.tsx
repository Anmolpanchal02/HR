"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmployeeCard } from "@/components/employees/employee-card";
import {
  clearEmployeeCredentials,
  EmployeeLoginAccess,
  readEmployeeCredentials,
  storeEmployeeCredentials,
} from "@/components/employees/employee-login-access";
import { getEmployee, resetEmployeePassword, updateEmployeeStatus } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { EmployeeProfile } from "@/types/employee";
import { canManageEmployees } from "@/types/employee";
import { canAccessEmployeeDirectory } from "@/types/permissions";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loginCredentials, setLoginCredentials] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    async function loadEmployee() {
      try {
        const response = await getEmployee(params.id);
        setEmployee(response.data.employee);
        setLoginCredentials(readEmployeeCredentials(params.id));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load employee");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      void loadEmployee();
    }
  }, [isAuthenticated, isLoading, params.id, router]);

  async function handleTerminate() {
    if (!employee) return;
    if (!confirm("Terminate this employee? Their user account will be deactivated.")) return;

    try {
      const response = await updateEmployeeStatus(employee.id, "TERMINATED");
      setEmployee(response.data.employee);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  async function handleResetPassword(password?: string) {
    if (!employee) return;
    const isCustom = Boolean(password);
    if (
      loginCredentials &&
      !confirm(
        isCustom
          ? "Set a new custom password? The current one will stop working immediately."
          : "Generate another password? The current one will stop working immediately.",
      )
    ) {
      return;
    }
    if (
      !loginCredentials &&
      !confirm(
        isCustom
          ? "Set this login password for the employee?"
          : "Generate a login password? If they already have one, it will be replaced.",
      )
    ) {
      return;
    }

    setResettingPassword(true);
    setError(null);
    try {
      const response = await resetEmployeePassword(
        employee.id,
        password ? { password } : {},
      );
      const credentials = response.data;
      storeEmployeeCredentials(employee.id, credentials);
      setLoginCredentials(credentials);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading employee profile...</p>
      </div>
    );
  }

  if (error && !employee) {
    const backHref = user && canAccessEmployeeDirectory(user.role) ? "/employees" : "/dashboard";
    const backLabel =
      user && canAccessEmployeeDirectory(user.role) ? "Back to employees" : "Back to dashboard";
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-6">
        <p className="text-sm text-destructive">{error}</p>
        <Link href={backHref} className="mt-4 text-sm underline">
          {backLabel}
        </Link>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const canManage = user ? canManageEmployees(user.role) : false;

  return (
    <div className="min-h-full bg-background px-6 py-16">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href={canManage ? "/employees" : "/dashboard"}
          className="text-sm font-medium text-foreground underline"
        >
          {canManage ? "Back to employees" : "Back to dashboard"}
        </Link>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <EmployeeCard
          employee={employee}
          showActions={canManage}
          onTerminate={handleTerminate}
        />

        {canManage && (
          <EmployeeLoginAccess
            email={employee.email}
            credentials={loginCredentials}
            resetting={resettingPassword}
            onReset={(password) => void handleResetPassword(password)}
            onDismissCredentials={() => {
              clearEmployeeCredentials(employee.id);
              setLoginCredentials(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
