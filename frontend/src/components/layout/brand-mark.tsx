import { IconCopilot } from "@/components/icons";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export function BrandMark({ compact, inverted, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "bg-brand-gradient flex items-center justify-center rounded-xl text-white shadow-sm",
          compact ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        <IconCopilot className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-tight",
            compact ? "text-sm" : "text-base",
            inverted ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          HR Copilot
        </p>
        {!compact && (
          <p
            className={cn(
              "truncate text-xs",
              inverted ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            AI Engineering
          </p>
        )}
        {compact && inverted && (
          <p className="truncate text-[11px] text-sidebar-muted">AI Engineering</p>
        )}
      </div>
    </div>
  );
}
