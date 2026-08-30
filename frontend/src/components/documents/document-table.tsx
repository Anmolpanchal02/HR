"use client";

import Link from "next/link";

import type { DocumentListItem } from "@/types/document";
import { formatFileSize, mimeTypeLabel } from "@/types/document";

interface DocumentTableProps {
  documents: DocumentListItem[];
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function DocumentTable({ documents }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">No documents found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/documents/${document.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {document.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">{mimeTypeLabel(document.mimeType)}</td>
              <td className="px-4 py-3 text-foreground">{formatLabel(document.status)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatFileSize(document.size)}</td>
              <td className="px-4 py-3 text-muted-foreground">{document.uploadedBy?.name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
