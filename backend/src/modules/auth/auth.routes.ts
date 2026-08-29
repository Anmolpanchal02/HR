import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/auth.middleware.js";
import { register, login, getMe, logout } from "./auth.controller.js";
import {
  authSuccessSchema,
  errorResponseSchema,
  loginBodySchema,
  logoutSuccessSchema,
  meSuccessSchema,
  registerBodySchema,
} from "./auth.schema.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/register",
    {
      schema: {
        body: registerBodySchema,
        response: {
          201: authSuccessSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    register,
  );

  app.post(
    "/login",
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: authSuccessSchema,
          401: errorResponseSchema,
        },
      },
    },
    login,
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate],
      schema: {
        response: {
          200: meSuccessSchema,
          401: errorResponseSchema,
        },
      },
    },
    getMe,
  );

  app.post(
    "/logout",
    {
      preHandler: [authenticate],
      schema: {
        response: {
          200: logoutSuccessSchema,
          401: errorResponseSchema,
        },
      },
    },
    logout,
  );
}
