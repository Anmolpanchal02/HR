import mammoth from "mammoth";

import { AppError } from "../../../utils/app-error.js";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  } catch {
    throw new AppError("Failed to extract text from DOCX", 400);
  }
}
