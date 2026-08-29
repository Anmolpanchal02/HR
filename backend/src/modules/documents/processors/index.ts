import type { AllowedMimeType } from "../document.types.js";
import { AppError } from "../../../utils/app-error.js";
import { extractDocxText } from "./docx.processor.js";
import { mimeTypeToProcessorKey } from "./file-type.js";
import { extractPdfText } from "./pdf.processor.js";
import { extractTxtText } from "./txt.processor.js";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: AllowedMimeType,
): Promise<string> {
  const processor = mimeTypeToProcessorKey(mimeType);

  switch (processor) {
    case "pdf":
      return extractPdfText(buffer);
    case "docx":
      return extractDocxText(buffer);
    case "txt":
      return extractTxtText(buffer);
    default:
      throw new AppError("Unsupported file type", 400);
  }
}
