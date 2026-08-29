"use client";

import { useState } from "react";

import { checkHealth } from "@/lib/api/health";
import type { HealthResponse } from "@/types/api";
import { ApiError } from "@/lib/api/client";

export function HealthCheckButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckHealth() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkHealth();
      setResult(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to reach backend";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleCheckHealth}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking..." : "Check Backend Health"}
      </button>

      {result && (
        <div className="w-full rounded-lg border border-green-200 bg-green-50 p-4 text-left text-sm text-green-900">
          <p className="font-medium">{result.message}</p>
          <p className="mt-1 text-green-700">{result.timestamp}</p>
        </div>
      )}

      {error && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-900">
          <p className="font-medium">Backend unreachable</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
