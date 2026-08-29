export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

export interface CopilotCitation {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  chunkIndex?: number;
  page?: number;
  section?: string;
}

export interface CopilotMessageDto {
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
  updatedAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: CopilotMessageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  conversationId: string;
  message: CopilotMessageDto;
  citations: CopilotCitation[];
  toolCalls: ToolCallSummary[];
}

import type { ToolCallSummary } from "./tools/tool.types.js";

export { type ToolCallSummary };

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export const INSUFFICIENT_CONTEXT_RESPONSE =
  "I couldn't find enough information in your organization's documents to answer that confidently.";
