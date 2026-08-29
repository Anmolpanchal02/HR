import { cn, formatLabel } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "role"
  | "status";

const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  error: "bg-red-50 text-red-700 ring-1 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  neutral: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200",
  role: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  status: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const variant: BadgeVariant =
    normalized === "ACTIVE" || normalized === "DONE" || normalized === "READY"
      ? "success"
      : normalized === "ON_HOLD" || normalized === "BLOCKED" || normalized === "PROCESSING"
        ? "warning"
        : normalized === "FAILED" || normalized === "CANCELLED" || normalized === "ARCHIVED"
          ? "error"
          : normalized === "IN_PROGRESS" || normalized === "IN_REVIEW"
            ? "info"
            : "neutral";
  return <Badge variant={variant}>{formatLabel(status)}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge variant="role">{role}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toUpperCase();
  const variant: BadgeVariant =
    normalized === "CRITICAL" || normalized === "HIGH"
      ? "error"
      : normalized === "MEDIUM"
        ? "warning"
        : "neutral";
  return <Badge variant={variant}>{formatLabel(priority)}</Badge>;
}
