import { env } from "./config/env.js";
import { connectMongoDB } from "./database/mongodb.js";
import { buildApp } from "./app.js";

async function startServer(): Promise<void> {
  await connectMongoDB();

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`AI HR Copilot API running on http://localhost:${env.PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
