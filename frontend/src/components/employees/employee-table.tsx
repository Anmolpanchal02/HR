"use client";

import Link from "next/link";

import type { EmployeeListItem } from "@/types/employee";

interface EmployeeTableProps {
  employees: EmployeeListItem[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        No employees found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Job Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-xs text-muted-foreground">{employee.employeeCode}</div>
              </td>
              <td className="px-4 py-3 text-foreground">{employee.department}</td>
              <td className="px-4 py-3 text-foreground">{employee.jobTitle}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-medium text-success-foreground">
                  {employee.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/employees/${employee.id}`}
                  className="text-sm font-medium text-foreground underline hover:text-foreground"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
