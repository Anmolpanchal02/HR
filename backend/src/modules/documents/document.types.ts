export enum DocumentStatus {
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
  ARCHIVED = "ARCHIVED",
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

export const EXTENSION_TO_MIME: Record<string, AllowedMimeType> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

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

export interface DocumentListResult {
  documents: DocumentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentQueryParams {
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

export interface DocumentSearchResult {
  results: DocumentSearchResultItem[];
  query: string;
}

export function canUploadDocuments(role: string): boolean {
  return role === "ADMIN" || role === "HR" || role === "ENGINEER";
}

export function canArchiveDocuments(role: string): boolean {
  return role === "ADMIN" || role === "HR";
}

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}
