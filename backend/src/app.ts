import Fastify from "fastify";

import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { copilotRoutes } from "./modules/copilot/copilot.routes.js";
import { documentRoutes } from "./modules/documents/document.routes.js";
import { employeeRoutes } from "./modules/employees/employee.routes.js";
import { projectRoutes } from "./modules/projects/project.routes.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { registerCors } from "./plugins/cors.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  await registerCors(app);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(userRoutes, { prefix: "/api/v1/users" });
  await app.register(employeeRoutes, { prefix: "/api/v1/employees" });
  await app.register(projectRoutes, { prefix: "/api/v1/projects" });
  await app.register(taskRoutes, { prefix: "/api/v1/tasks" });
  await app.register(documentRoutes, { prefix: "/api/v1/documents" });
  await app.register(copilotRoutes, { prefix: "/api/v1/copilot" });

  return app;
}
