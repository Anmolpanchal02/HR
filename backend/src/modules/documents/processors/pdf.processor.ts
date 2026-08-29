import { PDFParse } from "pdf-parse";

import { AppError } from "../../../utils/app-error.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } catch {
    throw new AppError("Failed to extract text from PDF", 400);
  } finally {
    await parser.destroy();
  }
}
