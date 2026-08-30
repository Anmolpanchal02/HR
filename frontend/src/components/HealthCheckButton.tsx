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
      let message =
        err instanceof ApiError ? err.message : "Unable to reach backend";

      if (message.includes("404") || message.includes("Request failed")) {
        message =
          "Backend not reachable. On Vercel set BACKEND_URL to your Render API URL (e.g. https://xxx.onrender.com).";
      }

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
        className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking..." : "Check Backend Health"}
      </button>

      {result && (
        <div className="w-full rounded-lg border border-success/30 bg-success-soft p-4 text-left text-sm text-success-foreground">
          <p className="font-medium">{result.message}</p>
          <p className="mt-1 text-success">{result.timestamp}</p>
        </div>
      )}

      {error && (
        <div className="w-full rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-left text-sm text-destructive-foreground">
          <p className="font-medium">Backend unreachable</p>
          <p className="mt-1 text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
