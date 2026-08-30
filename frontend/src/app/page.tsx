import Link from "next/link";

import { HealthCheckButton } from "@/components/HealthCheckButton";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="auth-mesh relative flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <BrandMark compact />
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            AI Engineering / HR Copilot
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground">
            One workspace for people, projects, and knowledge — with an AI agent that can look things
            up and take action.
          </p>
        </div>

        <HealthCheckButton />

        <div className="flex gap-3 text-sm font-medium">
          <Link
            href="/login"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-foreground shadow-sm hover:bg-background"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-primary px-5 py-2.5 text-white shadow-sm shadow-primary/20 hover:bg-primary-hover"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}
