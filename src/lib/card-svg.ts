import { getLanguageTheme, type PokemonCardData } from "@/lib/card";
import { hash32 } from "@/lib/art/pick";
import type { Rarity } from "@/lib/art/families";

/* ─────────────────────────────────────────────
   Image loading (network) — kept apart from rendering so the
   renderer is pure and snapshot-testable.
   ───────────────────────────────────────────── */

export async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      cache: "force-cache",
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mimeType = response.headers.get("content-type") ?? "image/png";

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

/** Ask GitHub for a small avatar: the badge is 28px, so 96px is plenty. */
export function smallAvatarUrl(avatarUrl: string): string {
  const url = new URL(avatarUrl);
  url.searchParams.set("s", "96");
  return url.toString();
}

/**
 * Images embedded as data: URIs. README cards are served through GitHub's
 * image proxy, which won't load anything the SVG references externally.
 */
export async function loadCardImages(data: PokemonCardData, origin: string): Promise<CardImages> {
  const avatarUrl = smallAvatarUrl(data.avatarUrl);
  const proxiedAvatarUrl = `https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl.replace("https://", ""))}`;
  const [cardArt, avatar] = await Promise.all([
    fetchImageAsBase64(`${origin}${data.art.file}`),
    fetchImageAsBase64(avatarUrl).then(uri => uri ?? fetchImageAsBase64(proxiedAvatarUrl)),
  ]);
  return { cardArt, avatar };
}

/** For in-app rendering: plain URLs, the browser loads them itself. */
export function cardImageUrls(data: PokemonCardData): CardImages {
  return { cardArt: data.art.file, avatar: smallAvatarUrl(data.avatarUrl) };
}

/* ─────────────────────────────────────────────
   Layout — every position on the 358×498 card, in one place.
   Content is drawn inside a 4px frame, so y=0 below is the frame's inner
   top edge (350×490).
   ───────────────────────────────────────────── */

export const LAYOUT = {
  frame: { width: 358, height: 498, radius: 20, inset: 4 },
  inner: { width: 350, height: 490, radius: 16 },
  header: { x: 8, y: 8, width: 334, height: 40, radius: 12 },
  art: { fadeStart: 0.46, fadeEnd: 0.66 },
  horizon: { x0: 14, x1: 336, baseline: 272, amplitude: 38 },
  ability: { x: 12, y: 286, width: 326, height: 64, radius: 10 },
  attacks: { x: 12, y: 356, width: 326, height: 84, radius: 10 },
  stats: { x: 12, y: 446, width: 326, height: 24, radius: 8 },
  footerY: 483,
} as const;

/* ─────────────────────────────────────────────
   Rarity treatments (Kimi design): frame colour, foil strength, sparkles.
   ───────────────────────────────────────────── */

interface RarityStyle {
  /** Frame gradient; null = use the language theme's colours. */
  frame: [string, string] | null;
  label: string;
  labelColor: string;
  symbol: string;
  foilOpacity: number;
  sparkles: number;
}

export const RARITY_STYLE: Record<Rarity, RarityStyle> = {
  common: { frame: null, label: "COMMON", labelColor: "#cbd5e1", symbol: "●", foilOpacity: 0, sparkles: 0 },
  uncommon: { frame: ["#9fb6c9", "#5f7a91"], label: "UNCOMMON", labelColor: "#7dd3fc", symbol: "◆", foilOpacity: 0.10, sparkles: 3 },
  rare: { frame: ["#d8c7ff", "#8b6fd6"], label: "RARE", labelColor: "#c4b5fd", symbol: "◆", foilOpacity: 0.18, sparkles: 5 },
  legendary: { frame: ["#ffe27a", "#d99a00"], label: "LEGENDARY", labelColor: "#fbbf24", symbol: "◆", foilOpacity: 0.28, sparkles: 8 },
};

/* ─────────────────────────────────────────────
   Pure helpers (exported for tests)
   ───────────────────────────────────────────── */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanText(str: string): string {
  return str.replace(/[—–]/g, "-");
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/**
 * The 52-week horizon: one point per calendar week, height relative to the
 * user's own busiest week (square-root scaled so quiet weeks still show),
 * empty weeks sit on the baseline as valleys.
 */
export function horizonPoints(weekly: number[], x0: number, x1: number, baseline: number, amplitude: number): string {
  if (weekly.length === 0) return `${x0},${baseline} ${x1},${baseline}`;
  const max = Math.max(1, ...weekly);
  const step = weekly.length > 1 ? (x1 - x0) / (weekly.length - 1) : 0;
  return weekly
    .map((count, i) => {
      const height = Math.sqrt(count / max) * amplitude;
      return `${(x0 + i * step).toFixed(1)},${(baseline - height).toFixed(1)}`;
    })
    .join(" ");
}

/** Sparkle positions in the art window, fixed per user so cards don't flicker. */
export function sparklePositions(seed: string, count: number): { x: number; y: number; size: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const h = hash32(`${seed}:sparkle:${i}`);
    return {
      x: 24 + (h % 302),
      y: 62 + ((h >>> 9) % 170),
      size: 4 + ((h >>> 18) % 6),
    };
  });
}

function sparklePath({ x, y, size }: { x: number; y: number; size: number }): string {
  const s = size;
  const w = s * 0.22;
  return `M${x},${y - s} Q${x + w},${y - w} ${x + s},${y} Q${x + w},${y + w} ${x},${y + s} Q${x - w},${y + w} ${x - s},${y} Q${x - w},${y - w} ${x},${y - s}Z`;
}

/* ─────────────────────────────────────────────
   SVG rendering
   ───────────────────────────────────────────── */

export interface CardImages {
  /** Card art (data: URI for README cards, plain URL in-app), or null for gradient only. */
  cardArt: string | null;
  /** Avatar (data: URI or URL), or null to draw the initial instead. */
  avatar: string | null;
}

export interface RenderOptions {
  /** Prefix for SVG element ids, so several inline cards can share a page. */
  idPrefix?: string;
}

const HEADING_FONT = "'Archivo Black', 'Arial Black', 'Segoe UI Black', 'Helvetica Neue', sans-serif";
const MONO_FONT = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

/** Pure: the same data + images always renders the same SVG. */
export function renderCardSVG(data: PokemonCardData, images: CardImages, options: RenderOptions = {}): string {
  const id = (name: string) => `${options.idPrefix ?? "gw"}-${name}`;
  const L = LAYOUT;
  const theme = getLanguageTheme(data.topLanguage);
  const weaknessTheme = getLanguageTheme(data.weakness.type);
  const resistanceTheme = getLanguageTheme(data.resistance.type);
  const rarity = RARITY_STYLE[data.rarity];
  const [frameA, frameB] = rarity.frame ?? [theme.borderColor, theme.accentColor];
  // Horizon, energy and retreat dots: rarity colour, or the language colour for commons.
  const accent = data.rarity === "common" ? theme.accentColor : rarity.labelColor;

  const stagePill =
    data.evolutionStage === "STAGE 2"
      ? { fill: "#fbbf24", text: "#1a1405" }
      : data.evolutionStage === "STAGE 1"
        ? { fill: "#e5e7eb", text: "#111827" }
        : { fill: "#e6b87d", text: "#1f1407" };
  const pillWidth = data.evolutionStage === "BASIC" ? 52 : 62;
  const avatarCx = L.header.x + 8 + pillWidth + 6 + 14;
  const avatarCy = L.header.y + L.header.height / 2;
  const usernameX = avatarCx + 14 + 8;

  const artImage = images.cardArt
    ? `<image id="${id("art")}" href="${images.cardArt}" x="0" y="0" width="${L.inner.width}" height="${L.inner.height}" preserveAspectRatio="xMidYMin slice"/>`
    : `<rect id="${id("art")}" width="${L.inner.width}" height="${L.inner.height}" fill="url(#${id("theme")})"/>`;

  // Frosted panels: a blurred copy of the art, clipped to each panel.
  const panels = [L.ability, L.attacks, L.stats];
  const glass = panels
    .map((p, i) => `<clipPath id="${id(`panel${i}`)}"><rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.radius}"/></clipPath>`)
    .join("");
  const frosted = panels
    .map((p, i) => `<g clip-path="url(#${id(`panel${i}`)})"><use href="#${id("art")}" filter="url(#${id("frost")})"/></g>
  <rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.radius}" fill="rgba(10,12,24,0.66)" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>`)
    .join("\n  ");

  const horizon = horizonPoints(data.weeklyActivity, L.horizon.x0, L.horizon.x1, L.horizon.baseline, L.horizon.amplitude);
  const sparkles = sparklePositions(data.username.toLowerCase(), rarity.sparkles)
    .map(s => `<path d="${sparklePath(s)}" fill="white" opacity="0.85"/>`)
    .join("");

  const ability = cleanText(data.ability.description);
  const attacks = [data.attack1, data.attack2].map((attack, i) => {
    const top = L.attacks.y + 8 + i * 40;
    const dots = Math.min(Math.max(attack.energyCost, 0), 4);
    const nameX = L.attacks.x + 12 + dots * 16 + 4;
    return `${Array.from({ length: dots }, (_, d) =>
      `<circle cx="${L.attacks.x + 18 + d * 16}" cy="${top + 11}" r="6.5" fill="url(#${id("energy")})"/>`).join("")}
    <text x="${nameX}" y="${top + 16}" font-family="${HEADING_FONT}" font-size="14" fill="white">${escapeXml(truncate(attack.name, 22))}</text>
    <text x="${nameX}" y="${top + 30}" font-family="${MONO_FONT}" font-size="8.5" fill="rgba(255,255,255,0.62)">${escapeXml(truncate(cleanText(attack.description), 44))}</text>
    <text x="${L.attacks.x + L.attacks.width - 12}" y="${top + 24}" text-anchor="end" font-family="${HEADING_FONT}" font-size="24" fill="white">${attack.damage}</text>`;
  });

  const retreatDots = Array.from({ length: Math.min(data.retreatCost, 4) }, (_, i) =>
    `<circle cx="${292 + i * 10}" cy="${L.stats.y + 12}" r="3.4" fill="${accent}"/>`).join("");

  const artLabel = data.art.poolSize > 1
    ? `${data.art.species} · ${data.art.variant} · 1 of ${data.art.poolSize}`
    : data.art.variant
      ? `${data.art.species} · ${data.art.variant}`
      : `${data.art.species} · since ${data.memberSince}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.frame.width}" height="${L.frame.height}" viewBox="0 0 ${L.frame.width} ${L.frame.height}" fill="none">
  <defs>
    <linearGradient id="${id("frame")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${frameA}"/>
      <stop offset="0.5" stop-color="${frameB}"/>
      <stop offset="1" stop-color="${frameA}"/>
    </linearGradient>
    <linearGradient id="${id("theme")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.borderColor}"/>
      <stop offset="1" stop-color="${theme.accentColor}"/>
    </linearGradient>
    <linearGradient id="${id("fade")}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070914" stop-opacity="0"/>
      <stop offset="${L.art.fadeStart}" stop-color="#070914" stop-opacity="0"/>
      <stop offset="${L.art.fadeEnd}" stop-color="#070914" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#070914" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="${id("foil")}" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stop-color="#ff5ea8"/>
      <stop offset="0.25" stop-color="#ffd35e"/>
      <stop offset="0.5" stop-color="#5effc1"/>
      <stop offset="0.75" stop-color="#5eb8ff"/>
      <stop offset="1" stop-color="#b45eff"/>
    </linearGradient>
    <radialGradient id="${id("energy")}" cx="35%" cy="35%">
      <stop offset="0" stop-color="white" stop-opacity="0.9"/>
      <stop offset="0.35" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.75"/>
    </radialGradient>
    <filter id="${id("frost")}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${id("glow")}" x="-10%" y="-60%" width="120%" height="220%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="${id("card")}"><rect width="${L.inner.width}" height="${L.inner.height}" rx="${L.inner.radius}"/></clipPath>
    <clipPath id="${id("avatar")}"><circle cx="${avatarCx}" cy="${avatarCy}" r="13"/></clipPath>
    ${glass}
  </defs>

  <!-- Frame: colour follows rarity -->
  <rect width="${L.frame.width}" height="${L.frame.height}" rx="${L.frame.radius}" fill="url(#${id("frame")})"/>

  <g transform="translate(${L.frame.inset},${L.frame.inset})" clip-path="url(#${id("card")})">
  <rect width="${L.inner.width}" height="${L.inner.height}" fill="#070914"/>
  ${artImage}
  <rect width="${L.inner.width}" height="${L.inner.height}" fill="url(#${id("fade")})"/>
  ${rarity.foilOpacity > 0 ? `<rect width="${L.inner.width}" height="${L.horizon.baseline + 10}" fill="url(#${id("foil")})" opacity="${rarity.foilOpacity}" style="mix-blend-mode:screen"/>` : ""}
  ${sparkles}

  <!-- 52-week contribution horizon -->
  <polyline points="${horizon}" stroke="${accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id("glow")})"/>

  <!-- Header -->
  <rect x="${L.header.x}" y="${L.header.y}" width="${L.header.width}" height="${L.header.height}" rx="${L.header.radius}" fill="rgba(8,10,20,0.78)" stroke="rgba(255,255,255,0.10)"/>
  <rect x="${L.header.x + 8}" y="${avatarCy - 10}" width="${pillWidth}" height="20" rx="10" fill="${stagePill.fill}"/>
  <text x="${L.header.x + 8 + pillWidth / 2}" y="${avatarCy + 4}" text-anchor="middle" font-family="${HEADING_FONT}" font-size="9.5" letter-spacing="0.6" fill="${stagePill.text}">${escapeXml(data.evolutionStage)}</text>
  <circle cx="${avatarCx}" cy="${avatarCy}" r="14.5" fill="${frameA}"/>
  ${images.avatar
    ? `<image href="${images.avatar}" x="${avatarCx - 13}" y="${avatarCy - 13}" width="26" height="26" clip-path="url(#${id("avatar")})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${avatarCx}" cy="${avatarCy}" r="13" fill="${theme.borderColor}"/><text x="${avatarCx}" y="${avatarCy + 5}" text-anchor="middle" font-family="${HEADING_FONT}" font-size="13" fill="white">${escapeXml(data.username.charAt(0).toUpperCase())}</text>`}
  <text x="${usernameX}" y="${avatarCy + 6}" font-family="${HEADING_FONT}" font-size="15" fill="white">${escapeXml(truncate(data.username, 13))}</text>
  <text x="${L.header.x + L.header.width - 12}" y="${avatarCy + 9}" text-anchor="end" font-family="${HEADING_FONT}" font-size="25" fill="white">${data.hp}</text>
  <text x="${L.header.x + L.header.width - 12 - String(data.hp).length * 17 - 4}" y="${avatarCy + 9}" text-anchor="end" font-family="${HEADING_FONT}" font-size="8.5" fill="rgba(255,255,255,0.7)">HP</text>

  <!-- Frosted glass panels -->
  ${frosted}

  <!-- Ability -->
  <text x="${L.ability.x + 12}" y="${L.ability.y + 20}" font-family="${MONO_FONT}" font-size="8" letter-spacing="2" fill="${rarity.labelColor}">ABILITY</text>
  <text x="${L.ability.x + 64}" y="${L.ability.y + 21}" font-family="${HEADING_FONT}" font-size="14" fill="white">${escapeXml(truncate(data.ability.name, 24))}</text>
  <text x="${L.ability.x + 12}" y="${L.ability.y + 38}" font-family="${MONO_FONT}" font-size="8.5" font-style="italic" fill="rgba(255,255,255,0.88)">${escapeXml(truncate(ability, 58))}</text>
  <text x="${L.ability.x + 12}" y="${L.ability.y + 54}" font-family="${MONO_FONT}" font-size="8" fill="rgba(255,255,255,0.55)">${data.contributions.toLocaleString("en-US")} contribs · ${data.activeWeeks}/${data.totalWeeks} wks active</text>

  <!-- Attacks -->
  ${attacks[0]}
  <line x1="${L.attacks.x + 12}" y1="${L.attacks.y + L.attacks.height / 2}" x2="${L.attacks.x + L.attacks.width - 12}" y2="${L.attacks.y + L.attacks.height / 2}" stroke="rgba(255,255,255,0.10)"/>
  ${attacks[1]}

  <!-- Weakness / resist / retreat -->
  <text x="${L.stats.x + 14}" y="${L.stats.y + 15}" font-family="${MONO_FONT}" font-size="7.5" letter-spacing="1.2" fill="rgba(255,255,255,0.5)">WEAKNESS</text>
  <circle cx="${L.stats.x + 70}" cy="${L.stats.y + 12}" r="3.4" fill="${weaknessTheme.accentColor}"/>
  <text x="${L.stats.x + 77}" y="${L.stats.y + 15.5}" font-family="${MONO_FONT}" font-size="9" fill="white">${escapeXml(data.weakness.modifier)}</text>
  <line x1="${L.stats.x + 108}" y1="${L.stats.y + 6}" x2="${L.stats.x + 108}" y2="${L.stats.y + 18}" stroke="rgba(255,255,255,0.12)"/>
  <text x="${L.stats.x + 122}" y="${L.stats.y + 15}" font-family="${MONO_FONT}" font-size="7.5" letter-spacing="1.2" fill="rgba(255,255,255,0.5)">RESIST</text>
  <circle cx="${L.stats.x + 162}" cy="${L.stats.y + 12}" r="3.4" fill="${resistanceTheme.accentColor}"/>
  <text x="${L.stats.x + 169}" y="${L.stats.y + 15.5}" font-family="${MONO_FONT}" font-size="9" fill="white">${escapeXml(data.resistance.modifier)}</text>
  <line x1="${L.stats.x + 214}" y1="${L.stats.y + 6}" x2="${L.stats.x + 214}" y2="${L.stats.y + 18}" stroke="rgba(255,255,255,0.12)"/>
  <text x="${L.stats.x + 228}" y="${L.stats.y + 15}" font-family="${MONO_FONT}" font-size="7.5" letter-spacing="1.2" fill="rgba(255,255,255,0.5)">RETREAT</text>
  ${retreatDots}

  <!-- Footer -->
  <text x="14" y="${L.footerY}" font-family="${MONO_FONT}" font-size="7.5" fill="rgba(255,255,255,0.5)">gitwrapped · ${escapeXml(truncate(artLabel, 44))}</text>
  <text x="336" y="${L.footerY}" text-anchor="end" font-family="${MONO_FONT}" font-size="7.5" letter-spacing="1.2" fill="${rarity.labelColor}">${rarity.symbol} ${rarity.label}</text>
  </g>
</svg>`;
}

/* ─────────────────────────────────────────────
   Error card SVG
   ───────────────────────────────────────────── */

export type CardErrorKind = "not-found" | "invalid" | "rate-limited" | "upstream" | "config";

const ERROR_COPY: Record<CardErrorKind, [string, string]> = {
  "not-found": ["User Not Found", "Check the username and try again"],
  invalid: ["Invalid Username", "GitHub usernames use letters, digits and hyphens"],
  "rate-limited": ["Back Soon", "GitHub rate limit reached — the card will return shortly"],
  upstream: ["GitHub Didn't Answer", "Temporary problem reaching GitHub — try again soon"],
  config: ["Not Configured", "The server has no GitHub token"],
};

export function renderErrorSVG(kind: CardErrorKind): string {
  const [title, detail] = ERROR_COPY[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="490" viewBox="0 0 350 490" fill="none">
  <rect width="350" height="490" rx="16" fill="#6b7280"/>
  <rect x="8" y="8" width="334" height="474" rx="10" fill="#FFF8F0"/>
  <text x="175" y="230" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="16" font-weight="700" fill="#1a1a2e">${escapeXml(title)}</text>
  <text x="175" y="255" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" fill="#6b7280">${escapeXml(detail)}</text>
  <text x="175" y="465" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" fill="#d1d5db">gitwrapped</text>
</svg>`;
}
