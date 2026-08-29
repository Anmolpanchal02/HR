import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAgentToolCallDoc extends Document {
  agentRunId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  toolName: string;
  status: "success" | "error";
  summary?: string;
  latencyMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const agentToolCallSchema = new Schema<IAgentToolCallDoc>(
  {
    agentRunId: { type: Schema.Types.ObjectId, ref: "AgentRun", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toolName: { type: String, required: true },
    status: { type: String, enum: ["success", "error"], required: true },
    summary: { type: String },
    latencyMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const AgentToolCallModel: Model<IAgentToolCallDoc> =
  mongoose.models.AgentToolCall ??
  mongoose.model<IAgentToolCallDoc>("AgentToolCall", agentToolCallSchema);

export async function recordAgentToolCall(input: {
  agentRunId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  toolName: string;
  status: "success" | "error";
  summary?: string;
  latencyMs: number;
}): Promise<void> {
  await AgentToolCallModel.create(input);
}
