import { NextRequest } from "next/server";
import { fetchUser, fetchRepositories } from "@/lib/github";
import { rateLimit, GITHUB_USERNAME_RE } from "@/lib/rate-limit";

type BadgeVariant = "compact" | "minimal" | "identity";
type BadgeTheme = "light" | "dark" | "mono";

interface BadgeData {
  username: string;
  repos: number;
  languageCount: number;
  activeYear: number;
  portfolio?: string;
  linkedin?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validate username format
    if (!GITHUB_USERNAME_RE.test(username)) {
      return new Response(JSON.stringify({ error: "Invalid GitHub username" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limit: 30 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limited = rateLimit(`badge:${ip}`, 30, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);

    const variant = (searchParams.get("variant") || "compact") as BadgeVariant;
    const theme = (searchParams.get("theme") || "light") as BadgeTheme;
    const portfolio = searchParams.get("portfolio") || "";
    const linkedin = searchParams.get("linkedin") || "";

    const [user, repositories] = await Promise.all([
      fetchUser(username),
      fetchRepositories(username),
    ]);

    const ownRepos = repositories.filter(r => !r.fork);

    // Get unique language count
    const uniqueLanguages = new Set(
      ownRepos.map(r => r.language).filter(Boolean)
    );

    const data: BadgeData = {
      username: user.login,
      repos: ownRepos.length,
      languageCount: uniqueLanguages.size,
      activeYear: new Date().getFullYear(),
      portfolio,
      linkedin,
    };

    let svg: string;
    switch (variant) {
      case "minimal":
        svg = generateMinimalBadge(data, theme);
        break;
      case "identity":
        svg = generateIdentityBadge(data, theme);
        break;
      default:
        svg = generateCompactBadge(data, theme);
    }

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new Response(generateErrorBadge(), {
      headers: { "Content-Type": "image/svg+xml" },
      status: 200,
    });
  }
}

function getThemeColors(theme: BadgeTheme) {
  switch (theme) {
    case "dark":
      return {
        bg: "#0d1117",
        bgSecondary: "#161b22",
        border: "#30363d",
        text: "#e6edf3",
        textMuted: "#8b949e",
        accent: "#58a6ff",
        accentGradientStart: "#58a6ff",
        accentGradientEnd: "#3b82f6",
        linkIcon: "#58a6ff",
      };
    case "mono":
      return {
        bg: "#ffffff",
        bgSecondary: "#f8f9fa",
        border: "#e5e7eb",
        text: "#111827",
        textMuted: "#6b7280",
        accent: "#111827",
        accentGradientStart: "#374151",
        accentGradientEnd: "#111827",
        linkIcon: "#6b7280",
      };
    default: // light
      return {
        bg: "#ffffff",
        bgSecondary: "#f8fafc",
        border: "#e2e8f0",
        text: "#1e293b",
        textMuted: "#64748b",
        accent: "#3b82f6",
        accentGradientStart: "#3b82f6",
        accentGradientEnd: "#2563eb",
        linkIcon: "#3b82f6",
      };
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Compact badge (default) - redesigned with accent bar, portfolio & LinkedIn
 * ┌─────────────────────────────────────────────────┐
 * │ ▊  GitWrapped  |  username                      │
 * │ ▊  12 Repos · 6 Languages · Active 2026        │
 * │ ▊  🔗 portfolio.dev  ·  💼 linkedin.com/in/... │
 * └─────────────────────────────────────────────────┘
 */
function generateCompactBadge(data: BadgeData, theme: BadgeTheme): string {
  const c = getThemeColors(theme);
  const hasLinks = data.portfolio || data.linkedin;
  const height = hasLinks ? 88 : 66;

  // Build links row
  let linksRow = "";
  if (hasLinks) {
    const parts: string[] = [];
    if (data.portfolio) {
      parts.push(`<tspan fill="${c.linkIcon}">⬡</tspan> ${escapeXml(data.portfolio)}`);
    }
    if (data.linkedin) {
      if (parts.length > 0) parts.push("·");
      parts.push(`<tspan fill="${c.linkIcon}">in</tspan> ${escapeXml(data.linkedin)}`);
    }
    linksRow = `<text x="22" y="${height - 14}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="${c.textMuted}">${parts.join(" ")}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="${height}" viewBox="0 0 380 ${height}">
  <defs>
    <linearGradient id="accentBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.accentGradientStart}"/>
      <stop offset="100%" stop-color="${c.accentGradientEnd}"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="379" height="${height - 1}" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  <rect x="0.5" y="0.5" width="4" height="${height - 1}" rx="2" fill="url(#accentBar)"/>
  <text x="22" y="26" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="${c.accent}">GitWrapped</text>
  <text x="105" y="26" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" fill="${c.textMuted}">|</text>
  <text x="118" y="26" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" fill="${c.text}">${escapeXml(data.username)}</text>
  <text x="22" y="48" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" fill="${c.textMuted}">${data.repos} Repos · ${data.languageCount} Languages · Active ${data.activeYear}</text>
  ${linksRow}
</svg>`;
}

/**
 * Minimal badge
 */
function generateMinimalBadge(data: BadgeData, theme: BadgeTheme): string {
  const c = getThemeColors(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="58" viewBox="0 0 200 58">
  <rect x="0.5" y="0.5" width="199" height="57" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  <rect x="0.5" y="0.5" width="3" height="57" rx="2" fill="${c.accent}"/>
  <text x="14" y="24" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" fill="${c.text}">${escapeXml(data.username)}</text>
  <text x="14" y="44" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="${c.textMuted}">${data.repos} Repos · ${data.languageCount} Langs</text>
</svg>`;
}

/**
 * Identity badge
 */
function generateIdentityBadge(data: BadgeData, theme: BadgeTheme): string {
  const c = getThemeColors(theme);
  const hasLinks = data.portfolio || data.linkedin;
  const height = hasLinks ? 78 : 58;

  let linksRow = "";
  if (hasLinks) {
    const parts: string[] = [];
    if (data.portfolio) {
      parts.push(`⬡ ${escapeXml(data.portfolio)}`);
    }
    if (data.linkedin) {
      if (parts.length > 0) parts.push("·");
      parts.push(`in ${escapeXml(data.linkedin)}`);
    }
    linksRow = `<text x="14" y="${height - 14}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="10" fill="${c.textMuted}">${parts.join(" ")}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}" viewBox="0 0 320 ${height}">
  <defs>
    <linearGradient id="accentBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.accentGradientStart}"/>
      <stop offset="100%" stop-color="${c.accentGradientEnd}"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="319" height="${height - 1}" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  <rect x="0.5" y="0.5" width="4" height="${height - 1}" rx="2" fill="url(#accentBar)"/>
  <text x="14" y="24" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" fill="${c.text}">${escapeXml(data.username)}.dev</text>
  <text x="14" y="44" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="${c.textMuted}">Developer Snapshot · GitWrapped</text>
  ${linksRow}
</svg>`;
}

function generateErrorBadge(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="44" viewBox="0 0 200 44">
  <rect x="0.5" y="0.5" width="199" height="43" rx="8" fill="#ffffff" stroke="#e5e7eb"/>
  <text x="12" y="28" font-family="Inter, sans-serif" font-size="12" fill="#9ca3af">User not found</text>
</svg>`;
}
