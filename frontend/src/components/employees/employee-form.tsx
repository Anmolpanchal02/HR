"use client";

import { useState, type FormEvent } from "react";

import { createEmployee } from "@/lib/api/employees.api";
import { ApiError } from "@/lib/api/client";
import type { EmployeeProfile, EmploymentType } from "@/types/employee";

interface EmployeeFormProps {
  onCreated: (employee: EmployeeProfile) => void;
  defaultOpen?: boolean;
  onCancel?: () => void;
}

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
];

export function EmployeeForm({ onCreated, defaultOpen = false, onCancel }: EmployeeFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    jobTitle: "",
    dateOfJoining: new Date().toISOString().split("T")[0] ?? "",
    employmentType: "FULL_TIME" as EmploymentType,
    location: "",
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        department: form.department.trim(),
        jobTitle: form.jobTitle.trim(),
        dateOfJoining: form.dateOfJoining,
        employmentType: form.employmentType,
        location: form.location.trim() || undefined,
      });
      onCreated(response.data.employee);
      setOpen(false);
      onCancel?.();
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        jobTitle: "",
        dateOfJoining: new Date().toISOString().split("T")[0] ?? "",
        employmentType: "FULL_TIME",
        location: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        + Add Employee
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-zinc-900">Add Employee</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["firstName", "First Name"],
            ["lastName", "Last Name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["department", "Department"],
            ["jobTitle", "Job Title"],
            ["location", "Location"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">{label}</label>
            <input
              type={key === "email" ? "email" : "text"}
              required={["firstName", "lastName", "email", "department", "jobTitle"].includes(key)}
              value={form[key]}
              onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Date of Joining</label>
          <input
            type="date"
            required
            value={form.dateOfJoining}
            onChange={(e) => setForm((current) => ({ ...current, dateOfJoining: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Employment Type</label>
          <select
            value={form.employmentType}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                employmentType: e.target.value as EmploymentType,
              }))
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onCancel?.();
          }}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
