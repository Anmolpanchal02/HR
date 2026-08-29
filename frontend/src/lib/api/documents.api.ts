import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  DocumentDetail,
  DocumentListItem,
  DocumentListParams,
  DocumentSearchResultItem,
  PaginationMeta,
} from "@/types/document";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function listDocuments(
  params: DocumentListParams = {},
): Promise<ApiDataResponse<{ documents: DocumentListItem[]; pagination: PaginationMeta }>> {
  return apiClient.get(`/documents${buildQuery(params as Record<string, string | number | undefined>)}`, true);
}

export async function getDocument(id: string): Promise<ApiDataResponse<{ document: DocumentDetail }>> {
  return apiClient.get(`/documents/${id}`, true);
}

export async function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ApiDataResponse<{ document: DocumentDetail }>> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.postForm("/documents", formData, true, onProgress);
}

export async function archiveDocument(
  id: string,
): Promise<ApiDataResponse<{ document: DocumentDetail }>> {
  return apiClient.patch(`/documents/${id}/archive`, {}, true);
}

export async function searchDocuments(
  query: string,
): Promise<ApiDataResponse<{ results: DocumentSearchResultItem[]; query: string }>> {
  return apiClient.get(`/documents/search?q=${encodeURIComponent(query)}`, true);
}

export function getDocumentDownloadUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/documents/${id}/download`;
}
