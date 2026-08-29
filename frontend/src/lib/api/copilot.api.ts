import { apiClient } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ChatResponse,
  ConversationDetail,
  ConversationListItem,
} from "@/types/copilot";

export async function sendChatMessage(payload: {
  message: string;
  conversationId?: string;
}): Promise<ApiDataResponse<ChatResponse>> {
  return apiClient.post("/copilot/chat", payload, true);
}

export async function listConversations(): Promise<
  ApiDataResponse<{ conversations: ConversationListItem[] }>
> {
  return apiClient.get("/copilot/conversations", true);
}

export async function getConversation(
  id: string,
): Promise<ApiDataResponse<{ conversation: ConversationDetail }>> {
  return apiClient.get(`/copilot/conversations/${id}`, true);
}

export async function deleteConversation(
  id: string,
): Promise<ApiDataResponse<{ deleted: boolean }>> {
  return apiClient.delete(`/copilot/conversations/${id}`, true);
}
