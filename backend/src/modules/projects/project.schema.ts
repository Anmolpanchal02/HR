export const projectStatusSchema = {
  type: "string",
  enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
} as const;

export const projectPrioritySchema = {
  type: "string",
  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
} as const;

export const createProjectBodySchema = {
  type: "object",
  required: ["name", "key"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    key: { type: "string", minLength: 1, maxLength: 20 },
    description: { type: "string", maxLength: 2000 },
    status: projectStatusSchema,
    priority: projectPrioritySchema,
    startDate: { type: "string", format: "date" },
    targetDate: { type: "string", format: "date" },
    ownerId: { type: "string", minLength: 1 },
  },
} as const;

export const updateProjectBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 2000 },
    status: projectStatusSchema,
    priority: projectPrioritySchema,
    startDate: { type: "string", format: "date" },
    targetDate: { type: "string", format: "date" },
    ownerId: { type: "string", minLength: 1 },
  },
} as const;

export const listProjectsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    search: { type: "string", maxLength: 200 },
    status: projectStatusSchema,
    priority: projectPrioritySchema,
    ownerId: { type: "string", minLength: 1 },
  },
} as const;

export const projectIdParamsSchema = {
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
