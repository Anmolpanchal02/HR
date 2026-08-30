/**
 * API base URL for browser requests.
 * - Local dev: set NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1 in .env.local
 * - Vercel: omit it (defaults to /api/v1) and set BACKEND_URL to your Render URL in project env
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "/api/v1";
}
