"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentUpload } from "@/components/documents/document-upload";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { listDocuments, searchDocuments } from "@/lib/api/documents.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type {
  DocumentListItem,
  DocumentStatus,
  PaginationMeta,
  DocumentSearchResultItem,
} from "@/types/document";
import { canUploadDocuments } from "@/types/document";

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchResults, setSearchResults] = useState<DocumentSearchResultItem[] | null>(null);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DocumentStatus | "">("");
  const [page, setPage] = useState(1);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    try {
      const response = await listDocuments({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
      });
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load documents from API
    void loadDocuments();
  }, [loadDocuments]);

  async function handleSemanticSearch() {
    if (!semanticQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await searchDocuments(semanticQuery.trim());
      setSearchResults(response.data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Company documents used by AI Copilot."
      />

      {canUploadDocuments(user.role) && (
        <DocumentUpload onUploaded={() => void loadDocuments()} />
      )}

      <Card padding="sm">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Semantic search</p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. leave policy"
            value={semanticQuery}
            onChange={(e) => setSemanticQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => void handleSemanticSearch()}>Search</Button>
        </div>
      </Card>

      <DocumentFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onApply={() => {
          setPage(1);
          void loadDocuments();
        }}
      />

      {error && <ErrorState message={error} onRetry={() => void loadDocuments()} />}

      {searchResults && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Semantic search results</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching content found.</p>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div key={result.chunkId} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/documents/${result.documentId}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {result.documentName}
                    </Link>
                    <span className="text-xs text-muted-foreground">Score: {result.score.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{result.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {loading ? <TableSkeleton /> : <DocumentTable documents={documents} />}

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
