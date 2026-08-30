"use client";

import Link from "next/link";

import type { CopilotCitation } from "@/types/copilot";
import { formatCitationLabel } from "@/types/copilot";

interface CitationListProps {
  citations: CopilotCitation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sources</p>
      <ul className="mt-2 space-y-1">
        {citations.map((citation) => (
          <li key={citation.chunkId}>
            <Link
              href={`/documents/${citation.documentId}`}
              className="text-sm text-foreground hover:underline"
            >
              • {formatCitationLabel(citation)}
            </Link>
            <span className="ml-2 text-xs text-subtle-foreground">
              ({citation.score.toFixed(2)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
