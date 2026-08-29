"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { archiveDocument, getDocument, getDocumentDownloadUrl } from "@/lib/api/documents.api";
import { ApiError } from "@/lib/api/client";
import { getStoredToken } from "@/lib/auth/token-storage";
import { useAuth } from "@/providers/auth-provider";
import type { DocumentDetail } from "@/types/document";
import { canArchiveDocuments, formatFileSize, mimeTypeLabel } from "@/types/document";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    async function loadDocument() {
      try {
        const response = await getDocument(params.id);
        setDocument(response.data.document);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      void loadDocument();
    }
  }, [isAuthenticated, isLoading, params.id, router]);

  async function handleDownload() {
    const token = getStoredToken();
    const url = getDocumentDownloadUrl(params.id);
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      alert("Download failed");
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = document?.originalName ?? "document";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  async function handleArchive() {
    if (!confirm("Archive this document?")) return;
    try {
      const response = await archiveDocument(params.id);
      setDocument(response.data.document);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to archive");
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-600">Loading document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6">
        <p className="text-sm text-red-600">{error ?? "Document not found"}</p>
        <Link href="/documents" className="mt-4 text-sm underline">
          Back to documents
        </Link>
      </div>
    );
  }

  const canArchive = user ? canArchiveDocuments(user.role) : false;

  return (
    <div className="min-h-full bg-zinc-50 px-6 py-16">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link href="/documents" className="text-sm text-zinc-700 underline">
          Back to documents
        </Link>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">{document.name}</h1>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Type</dt>
              <dd className="font-medium text-zinc-900">{mimeTypeLabel(document.mimeType)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Size</dt>
              <dd className="font-medium text-zinc-900">{formatFileSize(document.size)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="font-medium text-zinc-900">{document.status.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Uploaded by</dt>
              <dd className="font-medium text-zinc-900">{document.uploadedBy?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Created</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(document.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Version</dt>
              <dd className="font-medium text-zinc-900">{document.version}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-medium text-zinc-700">Processing status</h2>
            {document.status === "PROCESSING" && (
              <p className="mt-2 text-sm text-amber-700">Document is being processed...</p>
            )}
            {document.status === "FAILED" && (
              <p className="mt-2 text-sm text-red-600">
                {document.processingError ?? "Processing failed"}
              </p>
            )}
            {document.status === "READY" && (
              <p className="mt-2 text-sm text-green-700">Document is searchable</p>
            )}
            {document.status === "UPLOADED" && (
              <p className="mt-2 text-sm text-zinc-600">Waiting to process...</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Download
            </button>
            {canArchive && document.status !== "ARCHIVED" && (
              <button
                type="button"
                onClick={() => void handleArchive()}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Archive
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
