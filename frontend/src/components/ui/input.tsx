import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground",
          "placeholder:text-subtle-foreground focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
