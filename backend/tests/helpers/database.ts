import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

let mongoServer: MongoMemoryServer;

export async function setupTestDatabase(): Promise<void> {
  process.env.JWT_SECRET = "test-jwt-secret-minimum-32-characters-long";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}

export async function teardownTestDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]?.deleteMany({});
  }
}

export { beforeAll, afterAll, beforeEach, afterEach };
