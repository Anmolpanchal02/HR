import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  MONGODB_URI: requireEnv("MONGODB_URI", process.env.MONGODB_URI),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  JWT_SECRET: requireEnv("JWT_SECRET", process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  isProduction: process.env.NODE_ENV === "production",

  maxDocumentSizeMb: parsePositiveInt(process.env.MAX_DOCUMENT_SIZE_MB, 10),
  documentStoragePath: process.env.DOCUMENT_STORAGE_PATH ?? "./storage/documents",
  documentChunkSize: parsePositiveInt(process.env.DOCUMENT_CHUNK_SIZE, 1000),
  documentChunkOverlap: parsePositiveInt(process.env.DOCUMENT_CHUNK_OVERLAP, 150),

  embeddingProvider: process.env.EMBEDDING_PROVIDER ?? "mock",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingApiKey: process.env.EMBEDDING_API_KEY,
  embeddingDimensions: parsePositiveInt(process.env.EMBEDDING_DIMENSIONS, 128),

  vectorSearchMode: process.env.VECTOR_SEARCH_MODE ?? "local",
  vectorSearchTopK: parsePositiveInt(process.env.VECTOR_SEARCH_TOP_K, 5),
  ragTopK: parsePositiveInt(process.env.RAG_TOP_K, 5),
  ragMinScore: Number(process.env.RAG_MIN_SCORE ?? "0.05"),
  atlasVectorIndexName: process.env.ATLAS_VECTOR_INDEX_NAME ?? "document_chunk_vector_index",

  llmProvider: process.env.LLM_PROVIDER ?? "mock",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  llmApiKey: process.env.LLM_API_KEY,
  copilotMaxMessageLength: parsePositiveInt(process.env.COPILOT_MAX_MESSAGE_LENGTH, 4000),
  agentMaxToolCalls: parsePositiveInt(process.env.AGENT_MAX_TOOL_CALLS, 5),
} as const;

export function maxDocumentSizeBytes(): number {
  return env.maxDocumentSizeMb * 1024 * 1024;
}
