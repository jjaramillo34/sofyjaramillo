import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getArtworks } from "@/lib/content";
import {
  getLikeSummary,
  isVisitorId,
  networkId,
  newVisitorId,
  setLike,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  type LikeSummary,
} from "@/lib/likes";

export type LikesGetResponse = ({ ok: true } & LikeSummary) | { ok: false };
export type LikesPostResponse = { ok: true; slug: string; liked: boolean; count: number } | { ok: false; error: string };

const bodySchema = z.object({ slug: z.string().min(1).max(120), liked: z.boolean() });

const noStore = { "Cache-Control": "no-store" };

/** All like counts, plus which pieces this visitor has liked. */
export async function GET() {
  if (!process.env.MONGODB_URI) return NextResponse.json<LikesGetResponse>({ ok: false }, { status: 503 });

  const visitor = (await cookies()).get(VISITOR_COOKIE)?.value;
  try {
    const summary = await getLikeSummary(isVisitorId(visitor) ? visitor : null);
    return NextResponse.json<LikesGetResponse>({ ok: true, ...summary }, { headers: noStore });
  } catch (error) {
    console.error("[likes] Failed to read likes:", error);
    return NextResponse.json<LikesGetResponse>({ ok: false }, { status: 500 });
  }
}

/** { slug, liked } — like or unlike one artwork. */
export async function POST(request: Request) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json<LikesPostResponse>({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<LikesPostResponse>({ ok: false, error: "invalid" }, { status: 400 });
  }
  const { slug, liked } = parsed.data;

  // Only real artworks can collect likes.
  const artworks = await getArtworks("en");
  if (artworks.length === 0) {
    // Content didn't load: a deployment problem, not a bad request. Say so in the logs.
    console.error("[likes] No artworks found; is content/ included in the deployment?");
    return NextResponse.json<LikesPostResponse>({ ok: false, error: "unavailable" }, { status: 503 });
  }
  if (!artworks.some((artwork) => artwork.slug === slug)) {
    return NextResponse.json<LikesPostResponse>({ ok: false, error: "not_found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitor = isVisitorId(existing) ? existing : newVisitorId();
  if (visitor !== existing) {
    cookieStore.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }

  try {
    const result = await setLike(slug, visitor, networkId(request), liked);
    if ("error" in result) {
      return NextResponse.json<LikesPostResponse>({ ok: false, error: result.error }, { status: 429 });
    }
    return NextResponse.json<LikesPostResponse>({ ok: true, slug, ...result }, { headers: noStore });
  } catch (error) {
    console.error("[likes] Failed to save like:", error);
    return NextResponse.json<LikesPostResponse>({ ok: false, error: "server" }, { status: 500 });
  }
}
