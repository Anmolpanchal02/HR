import type { DocumentSearchResultItem } from "../../documents/document.types.js";
import type { CopilotCitation } from "../copilot.types.js";

const MAX_CONTEXT_CHARS = 12000;

export function buildContextFromChunks(chunks: DocumentSearchResultItem[]): string {
  if (chunks.length === 0) return "";

  const parts: string[] = [];
  let totalChars = 0;

  for (const [index, chunk] of chunks.entries()) {
    const sourceLabel = `SOURCE ${index + 1}
Document: ${chunk.documentName}
Chunk: ${chunk.chunkIndex + 1}

Content:
${chunk.content.trim()}`;

    if (totalChars + sourceLabel.length > MAX_CONTEXT_CHARS) {
      const remaining = MAX_CONTEXT_CHARS - totalChars;
      if (remaining > 200) {
        parts.push(`${sourceLabel.slice(0, remaining)}\n...[truncated]`);
      }
      break;
    }

    parts.push(sourceLabel);
    totalChars += sourceLabel.length + 2;
  }

  return parts.join("\n\n");
}

export function chunksToCitations(chunks: DocumentSearchResultItem[]): CopilotCitation[] {
  return chunks.map((chunk) => {
    const citation: CopilotCitation = {
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkId: chunk.chunkId,
      score: chunk.score,
      chunkIndex: chunk.chunkIndex,
    };

    // Only include page if explicitly stored in chunk metadata — never invent
    return citation;
  });
}

export function enrichCitationsWithChunkMetadata(
  citations: CopilotCitation[],
  chunkMetadata: Map<string, Record<string, unknown>>,
): CopilotCitation[] {
  return citations.map((citation) => {
    const meta = chunkMetadata.get(citation.chunkId);
    if (!meta) return citation;

    const page = typeof meta.page === "number" ? meta.page : undefined;
    const section = typeof meta.section === "string" ? meta.section : undefined;

    return {
      ...citation,
      ...(page !== undefined ? { page } : {}),
      ...(section !== undefined ? { section } : {}),
    };
  });
}
