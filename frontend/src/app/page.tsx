import Link from "next/link";

import { HealthCheckButton } from "@/components/HealthCheckButton";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
            AI Engineering / HR Copilot
          </h1>
          <p className="text-base text-zinc-600">
            Production-oriented foundation for HR operations and AI-assisted
            engineering workflows.
          </p>
        </div>

        <HealthCheckButton />

        <div className="flex gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
