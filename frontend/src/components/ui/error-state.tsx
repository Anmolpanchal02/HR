import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-destructive/30 bg-destructive-soft px-6 py-8 text-center"
      role="alert"
    >
      <h3 className="text-sm font-semibold text-destructive-foreground">{title}</h3>
      <p className="mt-1 text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
