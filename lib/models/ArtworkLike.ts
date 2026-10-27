import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * One like: a visitor liking one artwork. Visitors are anonymous; `visitor` is
 * the random id from the visitor cookie, and `network` a salted hash of the IP,
 * used only to cap likes from one network (see lib/likes.ts).
 */
const artworkLikeSchema = new Schema(
  {
    artwork: { type: String, required: true, maxlength: 120 },
    visitor: { type: String, required: true, maxlength: 64 },
    network: { type: String, required: true, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "artwork_likes" },
);

// One like per visitor per artwork; also serves "which pieces has this visitor liked?".
artworkLikeSchema.index({ visitor: 1, artwork: 1 }, { unique: true });
// Counting likes per artwork, and per network per day for the abuse cap.
artworkLikeSchema.index({ artwork: 1, network: 1, createdAt: -1 });

export type ArtworkLike = InferSchemaType<typeof artworkLikeSchema>;

export const ArtworkLikeModel: Model<ArtworkLike> =
  (models.ArtworkLike as Model<ArtworkLike> | undefined) ?? model<ArtworkLike>("ArtworkLike", artworkLikeSchema);
