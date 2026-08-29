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
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-zinc-600">No documents found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
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
            <tr key={document.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/documents/${document.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {document.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-700">{mimeTypeLabel(document.mimeType)}</td>
              <td className="px-4 py-3 text-zinc-700">{formatLabel(document.status)}</td>
              <td className="px-4 py-3 text-zinc-600">{formatFileSize(document.size)}</td>
              <td className="px-4 py-3 text-zinc-600">{document.uploadedBy?.name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
