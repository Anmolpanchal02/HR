import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-mesh relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <Link href="/" className="mb-8">
        <BrandMark />
      </Link>
      <main className="w-full max-w-md rounded-2xl border border-border bg-surface/90 p-8 shadow-md backdrop-blur-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </main>
    </div>
  );
}
