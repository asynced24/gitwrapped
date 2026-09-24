import { getLanguageTheme, type PokemonCardData } from "@/lib/card";
import { FAMILIES, type Rarity } from "@/lib/art/families";

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
   Layout — Kimi's measured spec on the 358×498 card, with the avatar as a
   large circle in the art window. The painting is full-bleed under
   everything; the rarity frame is a stroke on top.
   ───────────────────────────────────────────── */

export const LAYOUT = {
  frame: { width: 358, height: 498, radius: 20 },
  header: { x: 10, y: 10, width: 338, height: 48, radius: 11.5 },
  stagePill: { x: 20, y: 19, width: 58, height: 30 },
  avatar: { cx: 179, cy: 132, r: 40 },
  horizon: { x0: 8, x1: 350, baseline: 277, amplitude: 34 },
  scrim: { y: 255 },
  ability: { x: 12, y: 296, width: 334, height: 64, radius: 10 },
  attacks: { x: 12, y: 366, width: 334, height: 80, radius: 10, rows: [372, 410], dividerY: 406 },
  stats: { x: 12, y: 452, width: 334, height: 30, radius: 7 },
  footerY: 494,
} as const;

/** Sparkle anchors in paint order; a card draws the first N for its rarity. */
export const SPARKLE_ANCHORS: readonly (readonly [number, number])[] = [
  [48, 96], [300, 80], [232, 196], [90, 210], [320, 190], [250, 120], [140, 70], [270, 240],
];

/* ─────────────────────────────────────────────
   Rarity treatments (Kimi spec)
   ───────────────────────────────────────────── */

interface RarityStyle {
  frameColor: string;
  frameWidth: number;
  label: string;
  symbol: string;
  /** Foil intensity "A" in the spec. */
  foil: number;
  sparkles: number;
}

export const RARITY_STYLE: Record<Rarity, RarityStyle> = {
  common: { frameColor: "#6B7A90", frameWidth: 1, label: "COMMON", symbol: "●", foil: 0.06, sparkles: 2 },
  uncommon: { frameColor: "#8FB6D9", frameWidth: 1.5, label: "UNCOMMON", symbol: "◆", foil: 0.10, sparkles: 3 },
  rare: { frameColor: "#C9B8F0", frameWidth: 2, label: "RARE", symbol: "◆", foil: 0.17, sparkles: 5 },
  legendary: { frameColor: "#F5C518", frameWidth: 3, label: "LEGENDARY", symbol: "◆", foil: 0.26, sparkles: 8 },
};

const TEXT = {
  hpLabel: "#9FB3CC",
  abilityDesc: "#D5DEEC",
  abilityStats: "#8CA0BC",
  attackSub: "#93A5C0",
  statsLabel: "#7E90AB",
  statsValue: "#C7D2E2",
  statsDot: "#9AA7B8",
  footer: "#A9B8CE",
};

const STAGE_PILL: Record<string, { bg: string; text: string }> = {
  BASIC: { bg: "#E6B87D", text: "#0A0F1D" },
  "STAGE 1": { bg: "#E8EEF6", text: "#0A0F1D" },
  "STAGE 2": { bg: "#F5C518", text: "#0A0F1D" },
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
 * user's own busiest week. Square-root scaled (the spec is linear) so a
 * quiet week still shows next to one huge week; empty weeks sit on the
 * baseline as valleys — no invented noise.
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

export function sparkles(rarity: Rarity): { x: number; y: number; size: number }[] {
  return SPARKLE_ANCHORS.slice(0, RARITY_STYLE[rarity].sparkles).map(([x, y], i) => ({
    x,
    y,
    size: 5 + 2.5 * (i % 3),
  }));
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

// GitHub's image proxy can't load web fonts, so every stack ends in a
// heavy system font that looks close (Arial Black for Archivo Black).
const DISPLAY = "'Archivo Black', 'Arial Black', 'Segoe UI Black', sans-serif";
const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

/** Pure: the same data + images always renders the same SVG. */
export function renderCardSVG(data: PokemonCardData, images: CardImages, options: RenderOptions = {}): string {
  const id = (name: string) => `${options.idPrefix ?? "gw"}-${name}`;
  const L = LAYOUT;
  const W = L.frame.width;
  const H = L.frame.height;
  const theme = getLanguageTheme(data.topLanguage);
  const rarity = RARITY_STYLE[data.rarity];
  const accent = FAMILIES[data.art.family].accent[data.art.rarity];
  const foil = rarity.foil;
  const pill = STAGE_PILL[data.evolutionStage] ?? STAGE_PILL.BASIC;

  const art = images.cardArt
    ? `<image id="${id("art")}" href="${images.cardArt}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMin slice"/>`
    : `<rect id="${id("art")}" width="${W}" height="${H}" fill="url(#${id("theme")})"/>`;

  // Frosted glass (spec recipe): blurred copy of the art clipped to each
  // panel, a tint on top, then a hairline border.
  const panels = [
    { ...L.ability, tint: "rgba(11,18,32,0.55)" },
    { ...L.attacks, tint: "rgba(11,18,32,0.55)" },
    { ...L.stats, tint: "rgba(10,15,29,0.70)" },
  ];
  const panelClips = panels
    .map((p, i) => `<clipPath id="${id(`p${i}`)}"><rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.radius}"/></clipPath>`)
    .join("");
  const glass = panels
    .map((p, i) => `<g clip-path="url(#${id(`p${i}`)})"><use href="#${id("art")}" filter="url(#${id("frost")})"/></g>
  <rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.radius}" fill="${p.tint}" stroke="rgba(255,255,255,0.14)"/>
  <line x1="${p.x + p.radius}" y1="${p.y + 0.5}" x2="${p.x + p.width - p.radius}" y2="${p.y + 0.5}" stroke="rgba(255,255,255,0.18)"/>`)
    .join("\n  ");

  const horizon = horizonPoints(data.weeklyActivity, L.horizon.x0, L.horizon.x1, L.horizon.baseline, L.horizon.amplitude);

  const sparkleShapes = sparkles(data.rarity)
    .map(s => `<path d="${sparklePath(s)}" fill="#FFFFFF" opacity="${(0.55 + 0.3 * foil).toFixed(2)}" filter="url(#${id("sparkle")})"/>`)
    .join("");

  const attackRows = [data.attack1, data.attack2].map((attack, i) => {
    const rowY = L.attacks.rows[i];
    const dots = Math.min(Math.max(attack.energyCost, 0), 4);
    const nameX = 24 + dots * 14 + 6;
    const dotShapes = Array.from({ length: dots }, (_, d) =>
      `<circle cx="${24 + d * 14 + 5.5}" cy="${rowY + 7.5}" r="5.5" fill="${accent}" stroke="rgba(255,255,255,0.35)"/>`).join("");
    return `${dotShapes}
  <text x="${nameX}" y="${rowY + 12}" font-family="${DISPLAY}" font-size="12.5" fill="#FFFFFF">${escapeXml(truncate(attack.name, 24))}</text>
  <text x="${nameX}" y="${rowY + 25}" font-family="${MONO}" font-size="8" fill="${TEXT.attackSub}">${escapeXml(truncate(cleanText(attack.description), 48))}</text>
  <text x="334" y="${rowY + 21}" text-anchor="end" font-family="${DISPLAY}" font-size="21" fill="#FFFFFF" filter="url(#${id("shadow")})">${attack.damage}</text>`;
  });

  // Weakness / resist / retreat: three equal columns, centred.
  const colW = L.stats.width / 3;
  const statsBaseline = L.stats.y + 19.5;
  const column = (i: number, label: string, value: string, dotColor: string) =>
    `<text x="${(L.stats.x + colW * i + colW / 2).toFixed(1)}" y="${statsBaseline}" text-anchor="middle" font-family="${MONO}"><tspan font-size="7" letter-spacing="1" fill="${TEXT.statsLabel}">${label}</tspan><tspan font-size="9.5" fill="${dotColor}" dx="6">●</tspan><tspan font-size="9.5" fill="${TEXT.statsValue}" dx="4">${escapeXml(value)}</tspan></text>`;
  const retreat = `<text x="${(L.stats.x + colW * 2 + colW / 2).toFixed(1)}" y="${statsBaseline}" text-anchor="middle" font-family="${MONO}"><tspan font-size="7" letter-spacing="1" fill="${TEXT.statsLabel}">RETREAT</tspan><tspan font-size="9.5" fill="${accent}" dx="6" letter-spacing="1">${"●".repeat(Math.min(data.retreatCost, 4)) || "–"}</tspan></text>`;

  const artLabel = data.art.custom
    ? `${data.art.variant} · 1 of 1`
    : data.art.poolSize > 1
    ? `${data.art.species} · ${data.art.variant} · 1 of ${data.art.poolSize}`
    : data.art.variant
      ? `${data.art.species} · ${data.art.variant}`
      : `${data.art.species} · since ${data.memberSince}`;

  // Passion edition pill, centred under the avatar.
  const editionLabel = data.passion ? `${data.passion.edition.toUpperCase()}` : "";
  const editionWidth = 28 + editionLabel.length * 5.6;
  const editionBadge = data.passion
    ? `<rect x="${(L.avatar.cx - editionWidth / 2).toFixed(1)}" y="${L.avatar.cy + L.avatar.r + 10}" width="${editionWidth.toFixed(1)}" height="18" rx="9" fill="rgba(10,15,29,0.85)" stroke="${data.passion.color}" stroke-width="1.2"/>
  <text x="${L.avatar.cx}" y="${L.avatar.cy + L.avatar.r + 22.5}" text-anchor="middle" font-family="${MONO}" font-size="8" letter-spacing="1" fill="#FFFFFF"><tspan font-size="9">${data.passion.emoji}</tspan><tspan dx="4" fill="${data.passion.color}">${escapeXml(editionLabel)}</tspan></text>`
    : "";

  const t = rarity.frameWidth;
  const { cx, cy, r } = L.avatar;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="${id("theme")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.borderColor}"/>
      <stop offset="1" stop-color="${theme.accentColor}"/>
    </linearGradient>
    <linearGradient id="${id("scrim")}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05080F" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#05080F" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#05080F" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="${id("foil")}" x1="0" y1="0" x2="1" y2="0.7">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="${(0.9 * foil).toFixed(3)}"/>
      <stop offset="0.28" stop-color="${accent}" stop-opacity="${foil.toFixed(3)}"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.72" stop-color="#FF9FF0" stop-opacity="${(0.8 * foil).toFixed(3)}"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="${(0.6 * foil).toFixed(3)}"/>
    </linearGradient>
    <filter id="${id("frost")}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${id("glow")}" x="-5%" y="-80%" width="110%" height="260%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b"/>
      <feFlood flood-color="${accent}" flood-opacity="0.95"/>
      <feComposite in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id("sparkle")}" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b"/>
      <feFlood flood-color="${accent}" flood-opacity="0.9"/>
      <feComposite in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id("shadow")}" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
    <filter id="${id("lift")}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <clipPath id="${id("card")}"><rect width="${W}" height="${H}" rx="${L.frame.radius}"/></clipPath>
    <clipPath id="${id("avatar")}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    ${panelClips}
  </defs>

  <g clip-path="url(#${id("card")})">
  <rect width="${W}" height="${H}" fill="#070914"/>
  ${art}
  <rect y="${L.scrim.y}" width="${W}" height="${H - L.scrim.y}" fill="url(#${id("scrim")})"/>
  <rect width="${W}" height="${H}" fill="url(#${id("foil")})" style="mix-blend-mode:overlay"/>
  ${sparkleShapes}

  <!-- 52-week contribution horizon -->
  <polyline points="${horizon}" stroke="${accent}" stroke-width="4.5" stroke-opacity="0.35" stroke-linejoin="round" stroke-linecap="round"/>
  <polyline points="${horizon}" stroke="#EAFBFF" stroke-opacity="0.95" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id("glow")})"/>

  <!-- Avatar: large circle over the art -->
  <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="rgba(10,15,29,0.55)" filter="url(#${id("lift")})"/>
  ${images.avatar
    ? `<image href="${images.avatar}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id("avatar")})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${theme.borderColor}"/><text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="${DISPLAY}" font-size="30" fill="#FFFFFF">${escapeXml(data.username.charAt(0).toUpperCase())}</text>`}
  <circle cx="${cx}" cy="${cy}" r="${r + 1.2}" stroke="${accent}" stroke-opacity="0.85" stroke-width="2.4"/>
  ${editionBadge}

  <!-- Header -->
  <rect x="${L.header.x}" y="${L.header.y}" width="${L.header.width}" height="${L.header.height}" rx="${L.header.radius}" fill="rgba(10,15,29,0.92)" stroke="rgba(255,255,255,0.15)"/>
  <rect x="${L.stagePill.x}" y="${L.stagePill.y}" width="${L.stagePill.width}" height="${L.stagePill.height}" rx="${L.stagePill.height / 2}" fill="${pill.bg}"/>
  <text x="${L.stagePill.x + L.stagePill.width / 2}" y="${L.stagePill.y + 18.5}" text-anchor="middle" font-family="${DISPLAY}" font-size="9.5" letter-spacing="0.5" fill="${pill.text}">${escapeXml(data.evolutionStage)}</text>
  <text x="${cx}" y="${L.header.y + 29.5}" text-anchor="middle" font-family="${DISPLAY}" font-size="15.5" fill="#FFFFFF">${escapeXml(truncate(data.username, 14))}</text>
  <text x="340" y="${L.header.y + 33}" text-anchor="end" font-family="${DISPLAY}" font-size="24" fill="#FFFFFF">${data.hp}</text>
  <text x="${340 - String(data.hp).length * 16.5 - 4}" y="${L.header.y + 33}" text-anchor="end" font-family="${DISPLAY}" font-size="8" fill="${TEXT.hpLabel}">HP</text>

  <!-- Frosted panels -->
  ${glass}

  <!-- Ability -->
  <text x="24" y="313" font-family="${MONO}" font-size="7.5" letter-spacing="2" fill="${accent}">ABILITY</text>
  <text x="84" y="314" font-family="${DISPLAY}" font-size="14.5" fill="#FFFFFF">${escapeXml(truncate(data.ability.name, 24))}</text>
  <text x="24" y="332" font-family="${MONO}" font-size="9.5" font-style="italic" fill="${TEXT.abilityDesc}">${escapeXml(truncate(cleanText(data.ability.description), 54))}</text>
  <text x="24" y="347" font-family="${MONO}" font-size="8.5" letter-spacing="0.5" fill="${TEXT.abilityStats}">${data.contributions.toLocaleString("en-US")} contribs · ${data.activeWeeks}/${data.totalWeeks} wks active</text>

  <!-- Attacks -->
  ${attackRows[0]}
  <rect x="24" y="${L.attacks.dividerY}" width="310" height="1" fill="rgba(255,255,255,0.09)"/>
  ${attackRows[1]}

  <!-- Weakness / resist / retreat -->
  ${column(0, "WEAKNESS", data.weakness.modifier, TEXT.statsDot)}
  <rect x="${(L.stats.x + colW).toFixed(1)}" y="459" width="1" height="16" fill="rgba(255,255,255,0.09)"/>
  ${column(1, "RESIST", data.resistance.modifier, TEXT.statsDot)}
  <rect x="${(L.stats.x + colW * 2).toFixed(1)}" y="459" width="1" height="16" fill="rgba(255,255,255,0.09)"/>
  ${retreat}

  <!-- Footer -->
  <text x="18" y="${L.footerY}" font-family="${MONO}" font-size="8" fill="${TEXT.footer}" filter="url(#${id("shadow")})">gitwrapped · ${escapeXml(truncate(artLabel, 42))}</text>
  <text x="340" y="${L.footerY}" text-anchor="end" font-family="${MONO}" font-size="8" letter-spacing="1" fill="${accent}" filter="url(#${id("shadow")})">${rarity.symbol} ${rarity.label}</text>
  </g>

  <!-- Rarity frame -->
  <rect x="${t / 2}" y="${t / 2}" width="${W - t}" height="${H - t}" rx="${L.frame.radius - t / 2}" stroke="${rarity.frameColor}" stroke-opacity="0.9" stroke-width="${t}"/>
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
