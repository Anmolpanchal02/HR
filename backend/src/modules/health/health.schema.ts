export const healthResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
  },
  required: ["success", "message", "timestamp"],
  additionalProperties: false,
} as const;

export interface HealthResponse {
  success: true;
  message: string;
  timestamp: string;
}
