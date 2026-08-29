export const memberRoleSchema = {
  type: "string",
  enum: ["HR", "ENGINEER", "EMPLOYEE"],
} as const;

export const memberUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    role: { type: "string" },
    isActive: { type: "boolean" },
  },
  required: ["id", "name", "email", "role", "isActive"],
  additionalProperties: false,
} as const;

export const createMemberBodySchema = {
  type: "object",
  required: ["name", "email", "password", "role"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 2, maxLength: 200 },
    email: { type: "string", format: "email", maxLength: 320 },
    password: { type: "string", minLength: 8, maxLength: 128 },
    role: memberRoleSchema,
  },
} as const;

export const updateMemberBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: { type: "string", minLength: 2, maxLength: 200 },
    role: memberRoleSchema,
  },
} as const;

export const updateMemberStatusBodySchema = {
  type: "object",
  required: ["isActive"],
  additionalProperties: false,
  properties: {
    isActive: { type: "boolean" },
  },
} as const;

export const userIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 1 },
  },
} as const;

export const listMembersResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: memberUserSchema,
        },
      },
      required: ["users"],
    },
  },
  required: ["success", "data"],
} as const;

export const memberResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        user: memberUserSchema,
      },
      required: ["user"],
    },
  },
  required: ["success", "data"],
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;
