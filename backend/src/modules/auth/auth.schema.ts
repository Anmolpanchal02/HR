export const registerBodySchema = {
  type: "object",
  required: ["organizationName", "name", "email", "password"],
  additionalProperties: false,
  properties: {
    organizationName: {
      type: "string",
      minLength: 2,
      maxLength: 200,
    },
    name: {
      type: "string",
      minLength: 2,
      maxLength: 200,
    },
    email: {
      type: "string",
      format: "email",
      maxLength: 320,
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 128,
    },
  },
} as const;

export const loginBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: {
      type: "string",
      format: "email",
      maxLength: 320,
    },
    password: {
      type: "string",
      minLength: 1,
      maxLength: 128,
    },
  },
} as const;

export const authSuccessSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            organizationId: { type: "string" },
            organizationName: { type: "string" },
            employeeId: { type: "string" },
            hasDirectReports: { type: "boolean" },
          },
          required: ["id", "name", "email", "role", "organizationId"],
        },
        token: { type: "string" },
      },
      required: ["user", "token"],
    },
  },
  required: ["success", "data"],
} as const;

export const meSuccessSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
        organizationId: { type: "string" },
        organizationName: { type: "string" },
        employeeId: { type: "string" },
        hasDirectReports: { type: "boolean" },
      },
      required: ["id", "name", "email", "role", "organizationId"],
    },
  },
  required: ["success", "data"],
} as const;

export const logoutSuccessSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
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
