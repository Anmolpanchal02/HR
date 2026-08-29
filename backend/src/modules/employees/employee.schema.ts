export const employmentTypeSchema = {
  type: "string",
  enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"],
} as const;

export const employeeStatusSchema = {
  type: "string",
  enum: ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"],
} as const;

export const employeeProfileSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    userId: { type: "string" },
    employeeCode: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    department: { type: "string" },
    jobTitle: { type: "string" },
    dateOfJoining: { type: "string" },
    managerId: { type: "string" },
    managerName: { type: "string" },
    location: { type: "string" },
    employmentType: employmentTypeSchema,
    status: employeeStatusSchema,
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: [
    "id",
    "organizationId",
    "userId",
    "employeeCode",
    "firstName",
    "lastName",
    "email",
    "department",
    "jobTitle",
    "dateOfJoining",
    "employmentType",
    "status",
    "createdAt",
    "updatedAt",
  ],
} as const;

export const createEmployeeBodySchema = {
  type: "object",
  required: [
    "firstName",
    "lastName",
    "email",
    "department",
    "jobTitle",
    "dateOfJoining",
    "employmentType",
  ],
  additionalProperties: false,
  properties: {
    firstName: { type: "string", minLength: 1, maxLength: 100 },
    lastName: { type: "string", minLength: 1, maxLength: 100 },
    email: { type: "string", format: "email", maxLength: 320 },
    phone: { type: "string", maxLength: 20 },
    department: { type: "string", minLength: 1, maxLength: 100 },
    jobTitle: { type: "string", minLength: 1, maxLength: 100 },
    dateOfJoining: { type: "string", format: "date" },
    employmentType: employmentTypeSchema,
    managerId: { type: "string", minLength: 1 },
    location: { type: "string", maxLength: 100 },
  },
} as const;

export const updateEmployeeBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    firstName: { type: "string", minLength: 1, maxLength: 100 },
    lastName: { type: "string", minLength: 1, maxLength: 100 },
    phone: { type: "string", maxLength: 20 },
    department: { type: "string", minLength: 1, maxLength: 100 },
    jobTitle: { type: "string", minLength: 1, maxLength: 100 },
    dateOfJoining: { type: "string", format: "date" },
    employmentType: employmentTypeSchema,
    managerId: { type: "string", minLength: 1 },
    location: { type: "string", maxLength: 100 },
  },
} as const;

export const updateEmployeeStatusBodySchema = {
  type: "object",
  required: ["status"],
  additionalProperties: false,
  properties: {
    status: employeeStatusSchema,
  },
} as const;

export const employeeIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 1 },
  },
} as const;

export const listEmployeesQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    search: { type: "string", maxLength: 200 },
    department: { type: "string", maxLength: 100 },
    status: employeeStatusSchema,
  },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;
