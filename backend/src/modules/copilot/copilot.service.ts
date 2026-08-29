import mongoose from "mongoose";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { AuthContext } from "../users/user.types.js";
import {
  createConversationRecord,
  createMessageRecord,
  deleteConversationByIdUserAndOrg,
  findConversationByIdUserAndOrg,
  listConversationsByUserAndOrg,
  listMessagesByConversation,
  recordAIUsage,
  touchConversationUpdatedAt,
} from "./copilot.repository.js";
import {
  type ChatRequest,
  type ChatResponse,
  type ConversationDetail,
  type ConversationListItem,
  type CopilotCitation,
  type CopilotMessageDto,
  MessageRole,
} from "./copilot.types.js";
import type { AgentMessage } from "./agent/llm/agent-llm.provider.js";
import { agentService } from "./agent/agent.service.js";
import { enrichCitationsWithChunkMetadata } from "./retrieval/context-builder.js";
import { DocumentChunkModel } from "../documents/document-chunk.model.js";

function toMessageDto(message: {
  _id: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  citations?: CopilotCitation[];
  toolCalls?: import("./tools/tool.types.js").ToolCallSummary[];
  createdAt: Date;
}): CopilotMessageDto {
  return {
    id: message._id.toString(),
    role: message.role,
    content: message.content,
    citations: message.citations,
    toolCalls: message.toolCalls,
    createdAt: message.createdAt.toISOString(),
  };
}

function toAgentHistory(messages: Array<{ role: MessageRole; content: string }>): AgentMessage[] {
  return messages
    .filter((m) => m.role === MessageRole.USER || m.role === MessageRole.ASSISTANT)
    .slice(-8)
    .map((m) => ({
      role: m.role === MessageRole.USER ? "user" : "assistant",
      content: m.content,
    }));
}

function conversationTitleFromMessage(message: string): string {
  const trimmed = message.trim();
  return trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57)}...`;
}

async function loadChunkMetadataMap(
  chunkIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  if (chunkIds.length === 0) return new Map();

  const chunks = await DocumentChunkModel.find({ _id: { $in: chunkIds } }).select(
    "metadata",
  );
  return new Map(
    chunks.map((chunk) => [chunk._id.toString(), (chunk.metadata ?? {}) as Record<string, unknown>]),
  );
}

export class CopilotService {
  async chat(authUser: AuthContext, input: ChatRequest): Promise<ChatResponse> {
    const message = input.message?.trim();
    if (!message) {
      throw new AppError("Message is required", 400);
    }
    if (message.length > env.copilotMaxMessageLength) {
      throw new AppError(`Message exceeds maximum length of ${env.copilotMaxMessageLength}`, 400);
    }

    const orgObjectId = new mongoose.Types.ObjectId(authUser.organizationId);
    const userObjectId = new mongoose.Types.ObjectId(authUser.userId);

    let conversation = input.conversationId
      ? await findConversationByIdUserAndOrg(
          input.conversationId,
          authUser.userId,
          authUser.organizationId,
        )
      : null;

    if (input.conversationId && !conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (!conversation) {
      conversation = await createConversationRecord({
        organizationId: orgObjectId,
        userId: userObjectId,
        title: conversationTitleFromMessage(message),
      });
    }

    const conversationId = conversation._id.toString();

    const priorMessages = conversation
      ? await listMessagesByConversation(conversationId, authUser.organizationId)
      : [];
    const agentHistory = toAgentHistory(priorMessages);

    await createMessageRecord({
      organizationId: orgObjectId,
      conversationId: conversation._id,
      role: MessageRole.USER,
      content: message,
    });

    const startMs = Date.now();

    let agentResult;
    try {
      agentResult = await agentService.run(authUser, message, conversation._id, agentHistory);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to generate answer", 502);
    }

    let citations = agentResult.citations;
    const metadataMap = await loadChunkMetadataMap(citations.map((c) => c.chunkId));
    citations = enrichCitationsWithChunkMetadata(citations, metadataMap);

    await recordAIUsage({
      organizationId: orgObjectId,
      userId: userObjectId,
      conversationId: conversation._id,
      provider: agentResult.provider,
      llmModel: agentResult.model,
      inputTokens: agentResult.usage.inputTokens,
      outputTokens: agentResult.usage.outputTokens,
      totalTokens: agentResult.usage.totalTokens,
      latencyMs: Date.now() - startMs,
    });

    const assistantMessage = await createMessageRecord({
      organizationId: orgObjectId,
      conversationId: conversation._id,
      role: MessageRole.ASSISTANT,
      content: agentResult.content,
      citations: citations.length > 0 ? citations : undefined,
      toolCalls: agentResult.toolCalls.length > 0 ? agentResult.toolCalls : undefined,
    });

    await touchConversationUpdatedAt(conversationId, authUser.organizationId);

    return {
      conversationId,
      message: toMessageDto(assistantMessage),
      citations,
      toolCalls: agentResult.toolCalls,
    };
  }

  async listConversations(authUser: AuthContext): Promise<ConversationListItem[]> {
    const conversations = await listConversationsByUserAndOrg(
      authUser.userId,
      authUser.organizationId,
    );

    return conversations.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getConversation(authUser: AuthContext, conversationId: string): Promise<ConversationDetail> {
    const conversation = await findConversationByIdUserAndOrg(
      conversationId,
      authUser.userId,
      authUser.organizationId,
    );
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const messages = await listMessagesByConversation(conversationId, authUser.organizationId);

    return {
      id: conversation._id.toString(),
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: messages.map(toMessageDto),
    };
  }

  async deleteConversation(authUser: AuthContext, conversationId: string): Promise<void> {
    const deleted = await deleteConversationByIdUserAndOrg(
      conversationId,
      authUser.userId,
      authUser.organizationId,
    );
    if (!deleted) {
      throw new AppError("Conversation not found", 404);
    }
  }
}

export const copilotService = new CopilotService();

export const copilotServiceApi = {
  chat: (authUser: AuthContext, input: ChatRequest) => copilotService.chat(authUser, input),
};
