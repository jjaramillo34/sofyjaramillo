import { makeRouteHandler } from "@keystatic/next/route-handler";
import { revalidateTag } from "next/cache";
import config from "@/keystatic.config";
import { contentTags } from "@/lib/content";

const handlers = makeRouteHandler({ config });

export const GET = handlers.GET;

// Keystatic saves through POST. After a successful one, mark the cached content
// stale so the edited artwork or bio shows on the next page load.
export async function POST(request: Request) {
  const response = await handlers.POST(request);
  if (response.ok) for (const tag of contentTags) revalidateTag(tag, { expire: 0 });
  return response;
}
