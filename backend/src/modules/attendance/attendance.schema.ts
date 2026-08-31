export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;

export const attendanceStatusSchema = {
  type: "string",
  enum: ["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"],
} as const;

export const listAttendanceQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    employeeId: { type: "string", minLength: 1 },
    from: { type: "string", format: "date" },
    to: { type: "string", format: "date" },
    status: attendanceStatusSchema,
  },
} as const;
