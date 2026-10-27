import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ArtworkLikeModel } from "@/lib/models/ArtworkLike";

export const VISITOR_COOKIE = "sofy_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

/**
 * Likes from one network per artwork per day. Mobile carriers put many phones
 * behind a few shared IPs (carrier-grade NAT, common in Ecuador), so this has
 * to allow lots of real people on one address while still stopping someone
 * clearing cookies in a loop. The visitor cookie already limits each browser
 * to one like per piece.
 */
const MAX_LIKES_PER_NETWORK_PER_DAY = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export type LikeSummary = {
  counts: Record<string, number>;
  liked: string[];
};

export const newVisitorId = () => randomUUID();
export const isVisitorId = (value: string | undefined): value is string =>
  !!value && /^[0-9a-f-]{36}$/.test(value);

/** Salted hash of the client IP: lets us cap likes per network without storing addresses. */
export function networkId(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const salt = process.env.LIKES_SALT ?? process.env.MONGODB_URI ?? "sofy";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function getLikeSummary(visitor: string | null): Promise<LikeSummary> {
  await connectToDatabase();
  const [totals, mine] = await Promise.all([
    ArtworkLikeModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$artwork", count: { $sum: 1 } } },
    ]),
    visitor ? ArtworkLikeModel.find({ visitor }, { artwork: 1, _id: 0 }).lean() : [],
  ]);
  return {
    counts: Object.fromEntries(totals.map((t) => [t._id, t.count])),
    liked: mine.map((like) => like.artwork),
  };
}

export type SetLikeResult = { liked: boolean; count: number } | { error: "rate_limited" };

/** Likes or unlikes; idempotent, so double clicks and retries are safe. */
export async function setLike(
  artwork: string,
  visitor: string,
  network: string,
  liked: boolean,
): Promise<SetLikeResult> {
  await connectToDatabase();

  if (liked) {
    const alreadyLiked = await ArtworkLikeModel.exists({ artwork, visitor });
    if (!alreadyLiked) {
      const fromNetworkToday = await ArtworkLikeModel.countDocuments({
        artwork,
        network,
        createdAt: { $gte: new Date(Date.now() - DAY_MS) },
      });
      if (fromNetworkToday >= MAX_LIKES_PER_NETWORK_PER_DAY) return { error: "rate_limited" };
      try {
        await ArtworkLikeModel.create({ artwork, visitor, network });
      } catch (error) {
        // A concurrent request already inserted it (unique index): that's the state we wanted.
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
  } else {
    await ArtworkLikeModel.deleteOne({ artwork, visitor });
  }

  return { liked, count: await ArtworkLikeModel.countDocuments({ artwork }) };
}
