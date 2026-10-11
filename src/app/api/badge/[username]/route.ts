import { NextRequest } from "next/server";
import { badgeDataFrom, parseTheme, parseVariant, renderBadgeErrorSVG, renderBadgeSVG } from "@/lib/badge-svg";
import { fetchImageAsBase64, smallAvatarUrl } from "@/lib/card-svg";
import { isGitHubError, type GitHubErrorKind } from "@/lib/github/errors";
import { getProfile } from "@/lib/profile";
import { rateLimit, GITHUB_USERNAME_RE } from "@/lib/rate-limit";

/**
 * A rate limit or outage must not tell a README visitor the user doesn't
 * exist, and must not be cached as long as a real "not found".
 */
const ERROR_BADGES: Record<GitHubErrorKind, { text: string; cacheSeconds: number }> = {
  "not-found": { text: "User not found", cacheSeconds: 3600 },
  "rate-limited": { text: "GitHub busy, retrying soon", cacheSeconds: 120 },
  upstream: { text: "GitHub unavailable", cacheSeconds: 60 },
  config: { text: "Badge unavailable", cacheSeconds: 60 },
};

/** Links are display text only; cap them so a long URL can't stretch the badge. */
const LINK_MAX = 80;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const theme = parseTheme(searchParams.get("theme"));

  if (!GITHUB_USERNAME_RE.test(username)) {
    return new Response(JSON.stringify({ error: "Invalid GitHub username" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit: 30 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit(`badge:${ip}`, 30, 60_000);
  if (limited) return limited;

  try {
    const stats = await getProfile(username);
    const avatarUrl = smallAvatarUrl(stats.user.avatar_url);
    const avatar =
      (await fetchImageAsBase64(avatarUrl)) ??
      (await fetchImageAsBase64(`https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl.replace("https://", ""))}`));

    const svg = renderBadgeSVG(
      badgeDataFrom(stats, avatar, {
        portfolio: (searchParams.get("portfolio") ?? "").slice(0, LINK_MAX),
        linkedin: (searchParams.get("linkedin") ?? "").slice(0, LINK_MAX),
      }),
      parseVariant(searchParams.get("variant")),
      theme
    );

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    const kind: GitHubErrorKind = isGitHubError(error) ? error.kind : "upstream";
    const { text, cacheSeconds } = ERROR_BADGES[kind];
    // Always 200: GitHub's image proxy shows a broken image for non-2xx.
    return new Response(renderBadgeErrorSVG(text, theme), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": `public, max-age=${cacheSeconds}` },
      status: 200,
    });
  }
}
