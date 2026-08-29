import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAIUsage extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  provider: string;
  llmModel: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  latencyMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiUsageSchema = new Schema<IAIUsage>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    provider: { type: String, required: true },
    llmModel: { type: String, required: true },
    inputTokens: { type: Number, default: null },
    outputTokens: { type: Number, default: null },
    totalTokens: { type: Number, default: null },
    latencyMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

aiUsageSchema.index({ organizationId: 1, createdAt: -1 });
aiUsageSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export const AIUsageModel: Model<IAIUsage> =
  mongoose.models.AIUsage ?? mongoose.model<IAIUsage>("AIUsage", aiUsageSchema);
