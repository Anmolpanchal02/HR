export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
} as const;

export const workHoursSettingsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    timezone: { type: "string", minLength: 1, maxLength: 100 },
    workDays: {
      type: "array",
      items: { type: "integer", minimum: 0, maximum: 6 },
      minItems: 1,
    },
    graceMinutes: { type: "integer", minimum: 0, maximum: 120 },
  },
} as const;

export const leavePolicySettingsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    annualLeaveDays: { type: "integer", minimum: 0, maximum: 365 },
    sickLeaveDays: { type: "integer", minimum: 0, maximum: 365 },
    casualLeaveDays: { type: "integer", minimum: 0, maximum: 365 },
  },
} as const;

export const updateOrganizationSettingsBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    workHours: workHoursSettingsSchema,
    leavePolicy: leavePolicySettingsSchema,
  },
} as const;
