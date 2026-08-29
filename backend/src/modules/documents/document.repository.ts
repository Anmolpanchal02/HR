import type { FilterQuery, Types } from "mongoose";

import { DocumentModel, type IDocument } from "./document.model.js";
import type { DocumentQueryParams, DocumentStatus } from "./document.types.js";

export interface CreateDocumentInput {
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
}

export async function createDocumentRecord(input: CreateDocumentInput): Promise<IDocument> {
  return DocumentModel.create(input);
}

export async function findDocumentByIdAndOrganization(
  id: string,
  organizationId: string,
): Promise<IDocument | null> {
  return DocumentModel.findOne({ _id: id, organizationId });
}

export async function updateDocumentByIdAndOrganization(
  id: string,
  organizationId: string,
  updates: Partial<
    Pick<
      IDocument,
      "status" | "processingError" | "metadata" | "name" | "version"
    >
  >,
): Promise<IDocument | null> {
  return DocumentModel.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listDocumentsByOrganization(
  organizationId: string,
  params: DocumentQueryParams,
): Promise<{ documents: IDocument[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IDocument> = {
    organizationId,
    status: { $ne: "ARCHIVED" },
  };

  if (params.status) filter.status = params.status;
  if (params.search) {
    const regex = new RegExp(params.search.trim(), "i");
    filter.$or = [{ name: regex }, { originalName: regex }];
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DocumentModel.countDocuments(filter),
  ]);

  return { documents, total };
}
