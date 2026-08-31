import mongoose, { Schema, type Document, type Model } from "mongoose";

import type { OrganizationSettings } from "./organization.types.js";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  settings?: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ??
  mongoose.model<IOrganization>("Organization", organizationSchema);
