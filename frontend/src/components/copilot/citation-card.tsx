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
  const subtitle = label.replace(`${citation.documentName} — `, "");

  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-background/80 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface"
    >
      <p className="truncate text-xs font-medium text-foreground">{citation.documentName}</p>
      {subtitle !== citation.documentName && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
      )}
    </Link>
  );
}

interface CitationListProps {
  citations: CopilotCitation[];
}

export function CitationCards({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
        Sources
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation) => (
          <CitationCard key={citation.chunkId} citation={citation} />
        ))}
      </div>
    </div>
  );
}
