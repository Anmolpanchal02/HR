export const documentStatusSchema = {
  type: "string",
  enum: ["UPLOADED", "PROCESSING", "READY", "FAILED", "ARCHIVED"],
} as const;

export const listDocumentsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    search: { type: "string", maxLength: 200 },
    status: documentStatusSchema,
  },
} as const;

export const searchDocumentsQuerySchema = {
  type: "object",
  required: ["q"],
  additionalProperties: false,
  properties: {
    q: { type: "string", minLength: 1, maxLength: 500 },
  },
} as const;

export const documentIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", minLength: 1 } },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;
