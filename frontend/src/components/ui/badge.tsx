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
  default: "bg-surface-muted text-foreground",
  success: "bg-success-soft text-success-foreground ring-1 ring-success/25",
  warning: "bg-warning-soft text-warning-foreground ring-1 ring-warning/25",
  error: "bg-destructive-soft text-destructive-foreground ring-1 ring-destructive/25",
  info: "bg-info-soft text-info-foreground ring-1 ring-info/25",
  neutral: "bg-surface-muted text-muted-foreground ring-1 ring-border",
  role: "bg-primary-soft text-primary-soft-foreground ring-1 ring-primary/20",
  status: "bg-info-soft text-info-foreground ring-1 ring-info/25",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
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
