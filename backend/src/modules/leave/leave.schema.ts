export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;

export const leaveTypeSchema = {
  type: "string",
  enum: ["ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"],
} as const;

export const leaveStatusSchema = {
  type: "string",
  enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
} as const;

export const createLeaveRequestBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["leaveType", "startDate", "endDate", "reason"],
  properties: {
    leaveType: leaveTypeSchema,
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
    reason: { type: "string", minLength: 3, maxLength: 1000 },
  },
} as const;

export const rejectLeaveRequestBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rejectionReason: { type: "string", maxLength: 500 },
  },
} as const;

export const listLeaveQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    status: leaveStatusSchema,
    employeeId: { type: "string", minLength: 1 },
  },
} as const;

export const leaveIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", minLength: 1 } },
} as const;
