import { NextRequest } from "next/server";
import { buildCardData } from "@/lib/card";
import { loadCardImages, renderCardSVG, renderErrorSVG, type CardErrorKind } from "@/lib/card-svg";
import { isGitHubError } from "@/lib/github/errors";
import { getProfile } from "@/lib/profile";
import { rateLimit, GITHUB_USERNAME_RE } from "@/lib/rate-limit";

/** Error cards: short cache so a transient failure doesn't stick in READMEs. */
const ERROR_CACHE_SECONDS: Record<CardErrorKind, number> = {
  "not-found": 3600,
  invalid: 86400,
  "rate-limited": 120,
  upstream: 60,
  config: 60,
};

function errorCard(kind: CardErrorKind): Response {
  return new Response(renderErrorSVG(kind), {
    // Always 200: GitHub's image proxy shows a broken image for non-2xx.
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${ERROR_CACHE_SECONDS[kind]}`,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  const { username } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (!GITHUB_USERNAME_RE.test(username)) {
    return format === "json"
      ? Response.json({ error: "Invalid GitHub username" }, { status: 400 })
      : errorCard("invalid");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit(`card:${ip}`, 30, 60_000);
  if (limited) return limited;

  try {
    const data = buildCardData(await getProfile(username));

    // JSON for the generate page's interactive preview.
    if (format === "json") {
      return Response.json(data, {
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
      });
    }

    const svg = renderCardSVG(data, await loadCardImages(data, request.nextUrl.origin));
    console.log(`[card] ${username} rendered in ${Date.now() - startTime}ms`);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const kind: CardErrorKind = isGitHubError(error) ? error.kind : "upstream";
    console.log(`[card] ${username} failed after ${Date.now() - startTime}ms: ${kind}`, error instanceof Error ? error.message : "");

    if (format === "json") {
      const status = kind === "not-found" ? 404 : kind === "rate-limited" ? 429 : 502;
      return Response.json({ error: kind }, { status, headers: { "Cache-Control": "no-store" } });
    }
    return errorCard(kind);
  }
}
