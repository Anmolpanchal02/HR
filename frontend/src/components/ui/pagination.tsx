import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground",
            "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground",
            "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
