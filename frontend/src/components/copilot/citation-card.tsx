"use client";

import Link from "next/link";

import type { CopilotCitation } from "@/types/copilot";
import { formatCitationLabel } from "@/types/copilot";

interface CitationCardProps {
  citation: CopilotCitation;
}

export function CitationCard({ citation }: CitationCardProps) {
  const label = formatCitationLabel(citation);
  const href = `/documents/${citation.documentId}`;

  return (
    <Link
      href={href}
      className="block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 transition-colors hover:border-zinc-300 hover:bg-white"
    >
      <p className="text-xs font-medium text-zinc-900">{citation.documentName}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label.replace(`${citation.documentName} — `, "")}</p>
    </Link>
  );
}

interface CitationListProps {
  citations: CopilotCitation[];
}

export function CitationCards({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Sources</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation) => (
          <CitationCard key={citation.chunkId} citation={citation} />
        ))}
      </div>
    </div>
  );
}
