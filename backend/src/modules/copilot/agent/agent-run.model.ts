import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

import { AgentRunStatus } from "./agent.types.js";

export interface IAgentRunDoc extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  status: AgentRunStatus;
  toolCallCount: number;
  llmModel: string;
  latencyMs: number;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const agentRunSchema = new Schema<IAgentRunDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    status: { type: String, enum: Object.values(AgentRunStatus), required: true },
    toolCallCount: { type: Number, default: 0, min: 0 },
    llmModel: { type: String, required: true },
    latencyMs: { type: Number, required: true, min: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

agentRunSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export const AgentRunModel: Model<IAgentRunDoc> =
  mongoose.models.AgentRun ?? mongoose.model<IAgentRunDoc>("AgentRun", agentRunSchema);

export async function createAgentRun(input: {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  llmModel: string;
}): Promise<IAgentRunDoc> {
  return AgentRunModel.create({
    ...input,
    status: AgentRunStatus.RUNNING,
    toolCallCount: 0,
    latencyMs: 0,
  });
}

export async function completeAgentRun(
  id: Types.ObjectId,
  update: {
    status: AgentRunStatus;
    toolCallCount: number;
    latencyMs: number;
  },
): Promise<void> {
  await AgentRunModel.updateOne(
    { _id: id },
    { ...update, completedAt: new Date() },
  );
}
