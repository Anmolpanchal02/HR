"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmployeeCard } from "@/components/employees/employee-card";
import { getEmployee, updateEmployeeStatus } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { EmployeeProfile } from "@/types/employee";
import { canManageEmployees } from "@/types/employee";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
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

  if (isLoading || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-6">
        <p className="text-sm text-destructive">{error ?? "Employee not found"}</p>
        <Link href="/employees" className="mt-4 text-sm underline">
          Back to employees
        </Link>
      </div>
    );
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
        <EmployeeCard
          employee={employee}
          showActions={canManage}
          onTerminate={handleTerminate}
        />
      </main>
    </div>
  );
}
