export const taskStatusSchema = {
  type: "string",
  enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED", "CANCELLED"],
} as const;

export const taskPrioritySchema = {
  type: "string",
  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
} as const;

export const createTaskBodySchema = {
  type: "object",
  required: ["projectId", "title"],
  additionalProperties: false,
  properties: {
    projectId: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1, maxLength: 300 },
    description: { type: "string", maxLength: 5000 },
    priority: taskPrioritySchema,
    assigneeId: { type: "string", minLength: 1 },
    dueDate: { type: "string", format: "date" },
  },
} as const;

export const updateTaskBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 300 },
    description: { type: "string", maxLength: 5000 },
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId: { type: "string", minLength: 1 },
    dueDate: { type: "string", format: "date" },
  },
} as const;

export const listTasksQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    search: { type: "string", maxLength: 200 },
    projectId: { type: "string", minLength: 1 },
    assigneeId: { type: "string", minLength: 1 },
    status: taskStatusSchema,
    priority: taskPrioritySchema,
  },
} as const;

export const taskIdParamsSchema = {
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
