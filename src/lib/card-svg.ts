import { getLanguageTheme, type PokemonCardData } from "@/lib/card";
import { FAMILIES, type Rarity } from "@/lib/art/families";
import { hash32 } from "@/lib/art/pick";

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
  footerY: 492,
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

/** Average glyph width as a fraction of font size (conservative, for fitting). */
const EM = { mono: 0.6, display: 0.7 } as const;

/**
 * Shrink text to fit its box, down to a readable minimum; only then
 * truncate. Returns escaped text plus the size to render it at.
 */
export function fitText(text: string, maxWidth: number, size: number, font: keyof typeof EM, minSize: number): { text: string; size: number } {
  const em = EM[font];
  if (text.length * size * em <= maxWidth) return { text: escapeXml(text), size };
  const fitted = maxWidth / (text.length * em);
  if (fitted >= minSize) return { text: escapeXml(text), size: Math.floor(fitted * 10) / 10 };
  return { text: escapeXml(truncate(text, Math.floor(maxWidth / (minSize * em)))), size: minSize };
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

/**
 * One-of-ones swap sparkles for a signal glitch: the painting sits still,
 * then every few seconds a handful of horizontal bands tear sideways and
 * the red and cyan channels split for a fraction of a second. Bands, tear
 * distances and timing come from the username, so a card never reshuffles
 * and two one-of-ones on the same page don't glitch in sync.
 */
export const GLITCH_BANDS = 4;

export interface Glitch {
  /** Seconds per cycle; the burst sits near the end of it. */
  period: number;
  /** Negative start offset, so cards desync. */
  phase: number;
  /** Horizontal channel split in px during the burst. */
  split: number;
  bands: { y: number; height: number; shift: number; lag: number }[];
  /** A 1px interference line that flashes with the burst. */
  lineY: number;
}

export function glitch(seed: string): Glitch {
  const h = (key: string) => hash32(`${seed}:glitch:${key}`);
  const top = LAYOUT.header.y + LAYOUT.header.height + 6;
  const bottom = LAYOUT.ability.y - 6; // tears stay in the art window, clear of the panels
  return {
    period: 6 + (h("period") % 30) / 10, // 6–8.9s
    phase: -((h("phase") % 60) / 10),
    split: 2 + (h("split") % 2), // 2–3px: felt more than seen
    bands: Array.from({ length: GLITCH_BANDS }, (_, i) => {
      const b = h(`band:${i}`);
      const height = 3 + (b % 16); // 3–18px
      const sign = (b >>> 8) & 1 ? 1 : -1;
      return {
        y: top + ((b >>> 12) % (bottom - top - height)),
        height,
        shift: sign * (6 + ((b >>> 20) % 13)), // 6–18px
        lag: ((b >>> 26) % 4) * 0.04, // stagger inside the burst
      };
    }),
    lineY: top + (h("line") % (bottom - top)),
  };
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

  // Motion is the top-tier perk: legendary cards shimmer, one-of-ones also
  // get a travelling glint on a gold frame and a signal glitch. Everything else stays static.
  const oneOfOne = data.art.custom;
  const animated = oneOfOne || data.rarity === "legendary";
  const cls = (name: string) => (animated ? ` class="${id(name)}"` : "");

  const sparkleShapes = oneOfOne
    ? ""
    : sparkles(data.rarity)
        .map((s, i) => `<path d="${sparklePath(s)}" fill="#FFFFFF" opacity="${(0.55 + 0.3 * foil).toFixed(2)}" filter="url(#${id("sparkle")})"${cls("twinkle")}${animated ? ` style="animation-delay:${(i * 0.37).toFixed(2)}s"` : ""}/>`)
        .join("");

  // Glitch layers default to opacity 0, so a renderer without CSS (or a
  // reduced-motion viewer) sees the painting untouched.
  const g = oneOfOne ? glitch(data.username.toLowerCase()) : null;
  const timing = (lag = 0) => g ? `animation-duration:${g.period.toFixed(1)}s;animation-delay:${(g.phase + lag).toFixed(2)}s` : "";
  const glitchClips = g
    ? g.bands.map((b, i) => `<clipPath id="${id(`tear${i}`)}"><rect x="0" y="${b.y}" width="${W}" height="${b.height}"/></clipPath>`).join("")
    : "";
  const glitchLayers = g
    ? `<use href="#${id("art")}" filter="url(#${id("red")})" opacity="0" class="${id("split")}" style="--gx:${g.split}px;mix-blend-mode:screen;${timing()}"/>
  <use href="#${id("art")}" filter="url(#${id("cyan")})" opacity="0" class="${id("split")}" style="--gx:-${g.split}px;mix-blend-mode:screen;${timing()}"/>
  ${g.bands.map((b, i) => `<g clip-path="url(#${id(`tear${i}`)})"><use href="#${id("art")}" opacity="0" class="${id("tear")}" style="--gx:${b.shift}px;${timing(b.lag)}"/></g>`).join("")}
  <rect x="0" y="${g.lineY}" width="${W}" height="1" fill="#FFFFFF" opacity="0" class="${id("line")}" style="${timing(0.04)}"/>`
    : "";

  const motionStyle = animated
    ? `<style>
    @keyframes ${id("sweep")} { 0% { transform: translateX(-160px) } 55%, 100% { transform: translateX(560px) } }
    @keyframes ${id("twinkle")} { 0%, 100% { opacity: 0.15 } 50% { opacity: 0.95 } }
    @keyframes ${id("pulse")} { 0%, 100% { stroke-opacity: 0.2 } 50% { stroke-opacity: 0.65 } }
    ${oneOfOne ? `@keyframes ${id("tear")} { 0%, 91% { opacity: 0; transform: translateX(0) } 91.5% { opacity: 1; transform: translateX(var(--gx)) } 93% { transform: translateX(calc(var(--gx) * -0.5)) } 94.5% { opacity: 1; transform: translateX(calc(var(--gx) * 0.25)) } 95.5%, 100% { opacity: 0; transform: translateX(0) } }
    @keyframes ${id("split")} { 0%, 44% { opacity: 0; transform: translateX(0) } 44.5% { opacity: 0.35; transform: translateX(calc(var(--gx) * 0.5)) } 45.5%, 90.5% { opacity: 0; transform: translateX(0) } 91% { opacity: 0.6; transform: translateX(var(--gx)) } 93.5% { opacity: 0.45; transform: translateX(calc(var(--gx) * -1)) } 96%, 100% { opacity: 0; transform: translateX(0) } }
    @keyframes ${id("line")} { 0%, 91.5% { opacity: 0 } 92% { opacity: 0.35 } 93% { opacity: 0.1 } 94% { opacity: 0.3 } 95%, 100% { opacity: 0 } }
    @keyframes ${id("glint")} { to { transform: rotate(360deg) } }
    .${id("glint")} { animation: ${id("glint")} 6s linear infinite; transform-box: view-box; transform-origin: ${W / 2}px ${H / 2}px; }
    .${id("tear")}, .${id("split")}, .${id("line")} { animation-timing-function: steps(1, end); animation-iteration-count: infinite; }
    .${id("tear")} { animation-name: ${id("tear")}; }
    .${id("split")} { animation-name: ${id("split")}; }
    .${id("line")} { animation-name: ${id("line")}; }
    @media (prefers-reduced-motion: reduce) { .${id("tear")}, .${id("split")}, .${id("line")}, .${id("glint")} { animation: none; } }` : ""}
    .${id("sweep")} { animation: ${id("sweep")} 5.5s ease-in-out infinite; }
    .${id("twinkle")} { animation: ${id("twinkle")} 2.4s ease-in-out infinite; }
    .${id("pulse")} { animation: ${id("pulse")} 3s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .${id("sweep")}, .${id("twinkle")}, .${id("pulse")} { animation: none; } }
  </style>`
    : "";
  const sweep = animated
    ? `<g transform="skewX(-18)" style="mix-blend-mode:screen"><rect${cls("sweep")} x="-40" y="-20" width="90" height="${H + 40}" fill="url(#${id("sweepGrad")})"/></g>`
    : "";

  const attackRows = [data.attack1, data.attack2].map((attack, i) => {
    const rowY = L.attacks.rows[i];
    const dots = Math.min(Math.max(attack.energyCost, 0), 4);
    const nameX = 24 + dots * 14 + 6;
    // Name and subtitle stop before the damage number (right-aligned at 334).
    const room = 334 - 52 - 6 - nameX;
    const name = fitText(attack.name, room, 12.5, "display", 10);
    const sub = fitText(cleanText(attack.description), room, 8, "mono", 7);
    const dotShapes = Array.from({ length: dots }, (_, d) =>
      `<circle cx="${24 + d * 14 + 5.5}" cy="${rowY + 7.5}" r="5.5" fill="${accent}" stroke="rgba(255,255,255,0.35)"/>`).join("");
    return `${dotShapes}
  <text x="${nameX}" y="${rowY + 12}" font-family="${DISPLAY}" font-size="${name.size}" fill="#FFFFFF">${name.text}</text>
  <text x="${nameX}" y="${rowY + 25}" font-family="${MONO}" font-size="${sub.size}" fill="${TEXT.attackSub}">${sub.text}</text>
  <text x="334" y="${rowY + 21}" text-anchor="end" font-family="${DISPLAY}" font-size="21" fill="#FFFFFF" filter="url(#${id("shadow")})">${attack.damage}</text>`;
  });

  // Weakness / resist / retreat: three equal columns, centred.
  const colW = L.stats.width / 3;
  const statsBaseline = L.stats.y + 19.5;
  const column = (i: number, label: string, value: string, dotColor: string) =>
    `<text x="${(L.stats.x + colW * i + colW / 2).toFixed(1)}" y="${statsBaseline}" text-anchor="middle" font-family="${MONO}"><tspan font-size="7" letter-spacing="1" fill="${TEXT.statsLabel}">${label}</tspan><tspan font-size="9.5" fill="${dotColor}" dx="6">●</tspan><tspan font-size="9.5" fill="${TEXT.statsValue}" dx="4">${escapeXml(value)}</tspan></text>`;
  const retreat = `<text x="${(L.stats.x + colW * 2 + colW / 2).toFixed(1)}" y="${statsBaseline}" text-anchor="middle" font-family="${MONO}"><tspan font-size="7" letter-spacing="1" fill="${TEXT.statsLabel}">RETREAT</tspan><tspan font-size="9.5" fill="${accent}" dx="6" letter-spacing="1">${"●".repeat(Math.min(data.retreatCost, 4)) || "–"}</tspan></text>`;

  // Footer, Kimi style: quiet small print naming the painting.
  const artLabel = data.art.custom
      ? `${data.art.variant} · 1 of 1`
      : data.art.poolSize > 1
    ? `${data.art.species} · ${data.art.variant} · 1 of ${data.art.poolSize}`
    : data.art.variant
      ? `${data.art.species} · ${data.art.variant}`
      : `${data.art.species} · since ${data.memberSince}`;

  const username = fitText(data.username, 170, 15.5, "display", 11);
  const abilityName = fitText(data.ability.name, 250, 14.5, "display", 11);
  const abilityDesc = fitText(cleanText(data.ability.description), 310, 9.5, "mono", 8);

  const t = oneOfOne ? 3.5 : rarity.frameWidth;
  const frameRect = (stroke: string, opacity: number) =>
    `<rect x="${t / 2}" y="${t / 2}" width="${W - t}" height="${H - t}" rx="${L.frame.radius - t / 2}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${t}"/>`;
  // One-of-ones: the gold gradient is painted on a square that turns behind
  // a frame-shaped mask, so the bright band travels around the frame (a
  // glint, not a colour cycle). It's a CSS animation rather than SMIL so
  // reduced motion can stop it; the square covers the card at every angle.
  const reach = Math.ceil(Math.hypot(W / 2, H / 2)) + 4;
  const frame = oneOfOne
    ? `<g mask="url(#${id("frame")})" opacity="0.9"><rect class="${id("glint")}" x="${W / 2 - reach}" y="${H / 2 - reach}" width="${reach * 2}" height="${reach * 2}" fill="url(#${id("holo")})"/></g>`
    : frameRect(rarity.frameColor, 0.9);
  const rarityLabel = oneOfOne ? "◆ ONE OF ONE" : `${rarity.symbol} ${rarity.label}`;
  const rarityLabelColor = oneOfOne ? "#F5C518" : accent;
  // Footer left gets whatever the right-hand rarity label leaves (8px mono, 1px tracking).
  const footerLeft = fitText(`gitwrapped · ${artLabel}`, 340 - rarityLabel.length * (8 * EM.mono + 1) - 12 - 18, 8, "mono", 7);
  const { cx, cy, r } = L.avatar;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    ${motionStyle}
    ${animated ? `<linearGradient id="${id("sweepGrad")}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.32"/>
      <stop offset="0.6" stop-color="${accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>` : ""}
    ${oneOfOne ? `<linearGradient id="${id("holo")}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}">
      <stop offset="0" stop-color="#6E4F0E"/>
      <stop offset="0.38" stop-color="#C9971C"/>
      <stop offset="0.48" stop-color="#FFF4C2"/>
      <stop offset="0.58" stop-color="#C9971C"/>
      <stop offset="1" stop-color="#6E4F0E"/>
    </linearGradient>
    <mask id="${id("frame")}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${frameRect("#FFFFFF", 1)}</mask>` : ""}
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
    ${oneOfOne ? `<filter id="${id("red")}" color-interpolation-filters="sRGB"><feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
    <filter id="${id("cyan")}" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>` : ""}
    <filter id="${id("shadow")}" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
    <filter id="${id("lift")}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <clipPath id="${id("card")}"><rect width="${W}" height="${H}" rx="${L.frame.radius}"/></clipPath>
    <clipPath id="${id("avatar")}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    ${panelClips}
    ${glitchClips}
  </defs>

  <g clip-path="url(#${id("card")})">
  <rect width="${W}" height="${H}" fill="#070914"/>
  ${art}
  ${glitchLayers}
  <rect y="${L.scrim.y}" width="${W}" height="${H - L.scrim.y}" fill="url(#${id("scrim")})"/>
  <rect width="${W}" height="${H}" fill="url(#${id("foil")})" style="mix-blend-mode:overlay"/>
  ${sweep}
  ${sparkleShapes}

  <!-- 52-week contribution horizon -->
  <polyline${cls("pulse")} points="${horizon}" stroke="${accent}" stroke-width="4.5" stroke-opacity="0.35" stroke-linejoin="round" stroke-linecap="round"/>
  <polyline points="${horizon}" stroke="#EAFBFF" stroke-opacity="0.95" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id("glow")})"/>

  <!-- Avatar: large circle over the art -->
  <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="rgba(10,15,29,0.55)" filter="url(#${id("lift")})"/>
  ${images.avatar
    ? `<image href="${images.avatar}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id("avatar")})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${theme.borderColor}"/><text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="${DISPLAY}" font-size="30" fill="#FFFFFF">${escapeXml(data.username.charAt(0).toUpperCase())}</text>`}
  <circle cx="${cx}" cy="${cy}" r="${r + 1.2}" stroke="${accent}" stroke-opacity="0.85" stroke-width="2.4"/>

  <!-- Header -->
  <rect x="${L.header.x}" y="${L.header.y}" width="${L.header.width}" height="${L.header.height}" rx="${L.header.radius}" fill="rgba(10,15,29,0.92)" stroke="rgba(255,255,255,0.15)"/>
  <rect x="${L.stagePill.x}" y="${L.stagePill.y}" width="${L.stagePill.width}" height="${L.stagePill.height}" rx="${L.stagePill.height / 2}" fill="${pill.bg}"/>
  <text x="${L.stagePill.x + L.stagePill.width / 2}" y="${L.stagePill.y + 18.5}" text-anchor="middle" font-family="${DISPLAY}" font-size="9.5" letter-spacing="0.5" fill="${pill.text}">${escapeXml(data.evolutionStage)}</text>
  <text x="${cx}" y="${L.header.y + 29.5}" text-anchor="middle" font-family="${DISPLAY}" font-size="${username.size}" fill="#FFFFFF">${username.text}</text>
  <text x="340" y="${L.header.y + 33}" text-anchor="end" font-family="${DISPLAY}" font-size="24" fill="#FFFFFF">${data.hp}</text>
  <text x="${340 - String(data.hp).length * 16.5 - 4}" y="${L.header.y + 33}" text-anchor="end" font-family="${DISPLAY}" font-size="8" fill="${TEXT.hpLabel}">HP</text>

  <!-- Frosted panels -->
  ${glass}

  <!-- Ability -->
  <text x="24" y="313" font-family="${MONO}" font-size="7.5" letter-spacing="2" fill="${accent}">ABILITY</text>
  <text x="84" y="314" font-family="${DISPLAY}" font-size="${abilityName.size}" fill="#FFFFFF">${abilityName.text}</text>
  <text x="24" y="332" font-family="${MONO}" font-size="${abilityDesc.size}" font-style="italic" fill="${TEXT.abilityDesc}">${abilityDesc.text}</text>
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
  <text x="18" y="${L.footerY}" font-family="${MONO}" font-size="${footerLeft.size}" fill="${TEXT.footer}" filter="url(#${id("shadow")})">${footerLeft.text}</text>
  <text x="340" y="${L.footerY}" text-anchor="end" font-family="${MONO}" font-size="8" letter-spacing="1" fill="${rarityLabelColor}" filter="url(#${id("shadow")})">${rarityLabel}</text>
  </g>

  <!-- Rarity frame -->
  ${frame}
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
