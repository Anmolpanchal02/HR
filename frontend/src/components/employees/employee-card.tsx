import type { EmployeeProfile } from "@/types/employee";

interface EmployeeCardProps {
  employee: EmployeeProfile;
  showActions?: boolean;
  onTerminate?: () => void;
}

export function EmployeeCard({ employee, showActions, onTerminate }: EmployeeCardProps) {
  const fields = [
    ["Employee Code", employee.employeeCode],
    ["Email", employee.email],
    ["Phone", employee.phone ?? "—"],
    ["Department", employee.department],
    ["Job Title", employee.jobTitle],
    ["Manager", employee.managerName ?? "—"],
    ["Date of Joining", employee.dateOfJoining],
    ["Employment Type", employee.employmentType.replace("_", " ")],
    ["Location", employee.location ?? "—"],
    ["Status", employee.status],
  ] as const;

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{employee.jobTitle}</p>
        </div>
        {showActions && employee.status !== "TERMINATED" && onTerminate && (
          <button
            type="button"
            onClick={onTerminate}
            className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive-soft"
          >
            Terminate
          </button>
        )}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
