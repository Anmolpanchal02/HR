import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import type { UserRole } from "../modules/users/user.types.js";

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded) ||
    !("organizationId" in decoded) ||
    !("role" in decoded)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: String(decoded.userId),
    organizationId: String(decoded.organizationId),
    role: decoded.role as UserRole,
  };
}
