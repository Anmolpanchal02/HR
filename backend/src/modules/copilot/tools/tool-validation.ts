export function validateToolInput(
  schema: Record<string, unknown>,
  input: Record<string, unknown>,
): { valid: true; normalized: Record<string, unknown> } | { valid: false; message: string } {
  const required = (schema.required as string[] | undefined) ?? [];
  const properties = (schema.properties as Record<string, { type?: string }> | undefined) ?? {};

  for (const field of required) {
    const value = input[field];
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      return { valid: false, message: `${field} is required` };
    }
  }

  const normalized: Record<string, unknown> = { ...input };
  for (const [field, value] of Object.entries(normalized)) {
    const expectedType = properties[field]?.type;
    if (!expectedType || value === undefined || value === null) continue;

    if (expectedType === "string" && typeof value !== "string") {
      return { valid: false, message: `${field} must be a string` };
    }
    if (expectedType === "string" && typeof value === "string") {
      normalized[field] = value.trim();
    }
  }

  return { valid: true, normalized };
}
