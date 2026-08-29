import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

import { DocumentStatus } from "./document.types.js";

export interface IDocument extends Document {
  organizationId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  status: DocumentStatus;
  version: number;
  checksum: string;
  metadata?: Record<string, unknown>;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    storageKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.UPLOADED,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    checksum: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    processingError: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

documentSchema.index({ organizationId: 1, status: 1 });
documentSchema.index({ organizationId: 1, createdAt: -1 });
documentSchema.index({ organizationId: 1, uploadedBy: 1 });

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document ??
  mongoose.model<IDocument>("Document", documentSchema);
