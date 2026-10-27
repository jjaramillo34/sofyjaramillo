import { model, models, Schema, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import { budgetRanges, contactLanguages, projectTypes } from "@/lib/validation/commission";

export const commissionStatuses = ["pending", "reviewed", "completed"] as const;
export type CommissionStatus = (typeof commissionStatuses)[number];

const referenceImageSchema = new Schema(
  {
    url: { type: String, required: true },
    pathname: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const commissionRequestSchema = new Schema(
  {
    client: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 20 },
      contactLanguage: { type: String, enum: contactLanguages, required: true },
    },
    project: {
      type: { type: String, enum: projectTypes, required: true },
      size: { type: String, required: true, maxlength: 80 },
      description: { type: String, required: true, maxlength: 2000 },
      colors: { type: String, maxlength: 300 },
      budget: { type: String, enum: budgetRanges, required: true },
      deadline: { type: Date },
    },
    references: {
      links: { type: [String], default: [] },
      images: { type: [referenceImageSchema], default: [] },
    },
    /** Slug of the gallery piece the visitor came from via "Inquire about a similar piece". */
    sourceArtwork: { type: String, maxlength: 120 },
    /** Site language the form was submitted in. */
    locale: { type: String, enum: contactLanguages, required: true },
    status: { type: String, enum: commissionStatuses, default: "pending", index: true },
    notes: { type: String, maxlength: 5000 },
  },
  { timestamps: true, collection: "commission_requests" },
);

commissionRequestSchema.index({ status: 1, createdAt: -1 });

export type CommissionRequest = InferSchemaType<typeof commissionRequestSchema>;
export type CommissionRequestDocument = HydratedDocument<CommissionRequest>;

// Reuse the compiled model across hot reloads.
export const CommissionRequestModel: Model<CommissionRequest> =
  (models.CommissionRequest as Model<CommissionRequest> | undefined) ??
  model<CommissionRequest>("CommissionRequest", commissionRequestSchema);
