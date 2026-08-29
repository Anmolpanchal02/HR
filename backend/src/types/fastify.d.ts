import type { UserRole } from "../modules/users/user.types.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: {
      userId: string;
      organizationId: string;
      role: UserRole;
    };
  }
}
