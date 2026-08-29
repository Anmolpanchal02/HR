import crypto from "node:crypto";

export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export async function generateEmployeeCode(organizationId: string): Promise<string> {
  const { EmployeeSequence } = await import("./employee.model.js");
  const counter = await EmployeeSequence.findOneAndUpdate(
    { organizationId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  const seq = counter?.seq ?? 1;
  return `EMP-${String(seq).padStart(4, "0")}`;
}
