import type { FastifyReply, FastifyRequest } from "fastify";

import type { UserRole } from "../modules/users/user.types.js";
import { errorResponse } from "../utils/api-response.js";

export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      reply.status(401).send(errorResponse("Unauthorized"));
      return;
    }

    if (!roles.includes(request.authUser.role)) {
      reply.status(403).send(errorResponse("Forbidden"));
      return;
    }
  };
}
