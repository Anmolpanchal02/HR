import Fastify from "fastify";

import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { attendanceRoutes } from "./modules/attendance/attendance.routes.js";
import { leaveRoutes } from "./modules/leave/leave.routes.js";
import { organizationRoutes } from "./modules/organizations/organization.routes.js";
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

  app.get("/", async () => ({
    success: true,
    message: "AI HR Copilot API",
    health: "/api/v1/health",
  }));

  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(userRoutes, { prefix: "/api/v1/users" });
  await app.register(organizationRoutes, { prefix: "/api/v1/organization" });
  await app.register(employeeRoutes, { prefix: "/api/v1/employees" });
  await app.register(attendanceRoutes, { prefix: "/api/v1/attendance" });
  await app.register(leaveRoutes, { prefix: "/api/v1/leave" });
  await app.register(projectRoutes, { prefix: "/api/v1/projects" });
  await app.register(taskRoutes, { prefix: "/api/v1/tasks" });
  await app.register(documentRoutes, { prefix: "/api/v1/documents" });
  await app.register(copilotRoutes, { prefix: "/api/v1/copilot" });

  return app;
}
