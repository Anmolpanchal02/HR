import path from "node:path";

import {
  EXTENSION_TO_MIME,
  type AllowedMimeType,
  isAllowedMimeType,
} from "../document.types.js";
import { AppError } from "../../../utils/app-error.js";

export function detectMimeType(fileName: string, reportedMimeType: string): AllowedMimeType {
  const extension = path.extname(fileName).toLowerCase();
  const mimeFromExtension = EXTENSION_TO_MIME[extension];

  if (!mimeFromExtension) {
    throw new AppError("Unsupported file type", 400);
  }

  if (!isAllowedMimeType(reportedMimeType)) {
    throw new AppError("Unsupported file type", 400);
  }

  if (reportedMimeType !== mimeFromExtension) {
    throw new AppError("File extension does not match MIME type", 400);
  }

  return mimeFromExtension;
}

export function mimeTypeToProcessorKey(mimeType: AllowedMimeType): "pdf" | "docx" | "txt" {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "text/plain":
      return "txt";
    default:
      throw new AppError("Unsupported file type", 400);
  }
}
