import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/api-response.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    reply.status(401).send(errorResponse("Unauthorized"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    request.authUser = payload;
  } catch {
    reply.status(401).send(errorResponse("Unauthorized"));
    return;
  }
}
