import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";

function parseCorsOrigin(value: string): string | string[] {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) return "http://localhost:3000";
  if (origins.length === 1) return origins[0]!;
  return origins;
}

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: parseCorsOrigin(env.CORS_ORIGIN),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
}
