import type { Types } from "mongoose";

import { ConversationModel, type IConversation } from "./conversation.model.js";
import { MessageModel, type IMessage } from "./message.model.js";
import { AIUsageModel } from "./ai-usage.model.js";
import { MessageRole, type CopilotCitation } from "./copilot.types.js";

export async function createConversationRecord(input: {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
}): Promise<IConversation> {
  return ConversationModel.create(input);
}

export async function findConversationByIdUserAndOrg(
  id: string,
  userId: string,
  organizationId: string,
): Promise<IConversation | null> {
  return ConversationModel.findOne({ _id: id, userId, organizationId });
}

export async function listConversationsByUserAndOrg(
  userId: string,
  organizationId: string,
): Promise<IConversation[]> {
  return ConversationModel.find({ userId, organizationId })
    .sort({ updatedAt: -1 })
    .limit(50);
}

export async function deleteConversationByIdUserAndOrg(
  id: string,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const conversation = await ConversationModel.findOneAndDelete({
    _id: id,
    userId,
    organizationId,
  });
  if (!conversation) return false;

  await MessageModel.deleteMany({
    conversationId: conversation._id,
    organizationId,
  });

  return true;
}

export async function touchConversationUpdatedAt(
  conversationId: string,
  organizationId: string,
): Promise<void> {
  await ConversationModel.updateOne(
    { _id: conversationId, organizationId },
    { updatedAt: new Date() },
  );
}

export async function createMessageRecord(input: {
  organizationId: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: MessageRole;
  content: string;
  citations?: CopilotCitation[];
  toolCalls?: import("./tools/tool.types.js").ToolCallSummary[];
}): Promise<IMessage> {
  return MessageModel.create(input);
}

export async function listMessagesByConversation(
  conversationId: string,
  organizationId: string,
): Promise<IMessage[]> {
  return MessageModel.find({ conversationId, organizationId }).sort({ createdAt: 1 });
}

export async function recordAIUsage(input: {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  provider: string;
  llmModel: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
}): Promise<void> {
  await AIUsageModel.create(input);
}
