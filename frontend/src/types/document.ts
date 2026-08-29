export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "ARCHIVED";

export interface DocumentUploader {
  id: string;
  name: string;
}

export interface DocumentListItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  version: number;
  uploadedBy?: DocumentUploader;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends DocumentListItem {
  checksum?: string;
  metadata?: Record<string, unknown>;
  processingError?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
}

export interface DocumentSearchResultItem {
  documentId: string;
  documentName: string;
  chunkId: string;
  content: string;
  score: number;
  chunkIndex: number;
}

export function canUploadDocuments(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}

export function canArchiveDocuments(role: string): boolean {
  return role === "ADMIN" || role === "HR";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mimeTypeLabel(mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("wordprocessingml")) return "DOCX";
  if (mimeType.includes("text/plain")) return "TXT";
  return mimeType;
}
