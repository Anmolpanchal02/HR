export type MessageRole = "USER" | "ASSISTANT";

export interface CopilotCitation {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  chunkIndex?: number;
  page?: number;
  section?: string;
}

export interface ToolCallSummary {
  tool: string;
  status: "success" | "error";
  summary?: string;
}

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: CopilotCitation[];
  toolCalls?: ToolCallSummary[];
  createdAt: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: CopilotMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface ChatResponse {
  conversationId: string;
  message: CopilotMessage;
  citations: CopilotCitation[];
  toolCalls: ToolCallSummary[];
}

export function formatCitationLabel(citation: CopilotCitation): string {
  if (citation.page !== undefined) {
    return `${citation.documentName} — Page ${citation.page}`;
  }
  if (citation.section) {
    return `${citation.documentName} — ${citation.section}`;
  }
  if (citation.chunkIndex !== undefined) {
    return `${citation.documentName} — Section ${citation.chunkIndex + 1}`;
  }
  return citation.documentName;
}
