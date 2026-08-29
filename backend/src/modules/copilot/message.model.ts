import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

import { MessageRole, type CopilotCitation } from "./copilot.types.js";
import type { ToolCallSummary } from "./tools/tool.types.js";

export interface IMessage extends Document {
  organizationId: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: MessageRole;
  content: string;
  citations?: CopilotCitation[];
  toolCalls?: ToolCallSummary[];
  createdAt: Date;
  updatedAt: Date;
}

const citationSchema = new Schema(
  {
    documentId: { type: String, required: true },
    documentName: { type: String, required: true },
    chunkId: { type: String, required: true },
    score: { type: Number, required: true },
    chunkIndex: { type: Number },
    page: { type: Number },
    section: { type: String },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(MessageRole),
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    citations: {
      type: [citationSchema],
      default: undefined,
    },
    toolCalls: {
      type: [
        new Schema(
          {
            tool: { type: String, required: true },
            status: { type: String, enum: ["success", "error"], required: true },
            summary: { type: String },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
  },
  { timestamps: true },
);

messageSchema.index({ organizationId: 1, conversationId: 1, createdAt: 1 });

export const MessageModel: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>("Message", messageSchema);
