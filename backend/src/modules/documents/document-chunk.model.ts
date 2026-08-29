import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IDocumentChunk extends Document {
  organizationId: Types.ObjectId;
  documentId: Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[];
  tokenCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    tokenCount: {
      type: Number,
      required: true,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

documentChunkSchema.index({ organizationId: 1, documentId: 1 });
documentChunkSchema.index({ organizationId: 1, documentId: 1, chunkIndex: 1 }, { unique: true });

export const DocumentChunkModel: Model<IDocumentChunk> =
  mongoose.models.DocumentChunk ??
  mongoose.model<IDocumentChunk>("DocumentChunk", documentChunkSchema);
