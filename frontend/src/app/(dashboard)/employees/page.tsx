"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { listEmployees } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { EmployeeListItem, EmployeeStatus, PaginationMeta } from "@/types/employee";
import { canManageEmployees } from "@/types/employee";
import { canAccessEmployeeDirectory } from "@/types/permissions";

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [page, setPage] = useState(1);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listEmployees({
        page,
        limit: 20,
        search: search || undefined,
        department: department || undefined,
        status: status || undefined,
      });
      setEmployees(response.data.employees);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, search, department, status]);

  useEffect(() => {
    if (!isLoading && user && !canAccessEmployeeDirectory(user.role)) {
      if (user.employeeId) {
        router.replace(`/employees/${user.employeeId}`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || !canAccessEmployeeDirectory(user.role)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load employees from API
    void loadEmployees();
  }, [loadEmployees, user]);

  if (!user || isLoading || !canAccessEmployeeDirectory(user.role)) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee records and profiles."
        action={
          canManageEmployees(user.role) && !showCreate ? (
            <Button onClick={() => setShowCreate(true)}>+ Add Employee</Button>
          ) : undefined
        }
      />

      <EmployeeFilters
        search={search}
        department={department}
        status={status}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onStatusChange={setStatus}
        onApply={() => {
          setPage(1);
          void loadEmployees();
        }}
      />

      {showCreate && canManageEmployees(user.role) && (
        <EmployeeForm
          defaultOpen
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void loadEmployees();
          }}
        />
      )}

      {error && <ErrorState message={error} onRetry={() => void loadEmployees()} />}

      {loading ? (
        <TableSkeleton />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" description="Add employees or adjust your search filters." />
      ) : (
        <>
          <EmployeeTable employees={employees} />
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
