import { getLanguageColor, type UserStats } from "@/types/github";

/**
 * README badges. Pure renderer (like card-svg.ts): the route fetches the
 * profile and avatar, this turns them into an SVG string.
 *
 * Constraints of an SVG shown through GitHub's image proxy: no web fonts,
 * no scripts, no external references (the avatar arrives as a data: URI).
 * CSS animation works, so the one bit of motion (a slow sheen across the
 * frame) sits behind prefers-reduced-motion.
 */

export type BadgeVariant = "compact" | "minimal" | "identity";
export type BadgeTheme = "light" | "dark" | "mono";

export const BADGE_VARIANTS: BadgeVariant[] = ["compact", "minimal", "identity"];
export const BADGE_THEMES: BadgeTheme[] = ["light", "dark", "mono"];

export interface BadgeData {
    login: string;
    name: string | null;
    avatar: string | null;
    repos: number;
    languageCount: number;
    /** Contributions in the last 12 months. */
    contributions: number;
    topLanguage: string | null;
    /** Contributions per calendar week, oldest first (up to 53). */
    weekly: number[];
    since: number;
    portfolio: string;
    linkedin: string;
}

export function badgeDataFrom(stats: UserStats, avatar: string | null, links: { portfolio: string; linkedin: string }): BadgeData {
    return {
        login: stats.user.login,
        name: stats.user.name,
        avatar,
        repos: stats.ownRepoCount,
        languageCount: stats.languageCount,
        contributions: stats.activity.total,
        topLanguage: stats.topLanguage,
        weekly: stats.activity.weeks.map(w => w.reduce((sum, d) => sum + d.count, 0)),
        since: new Date(stats.user.created_at).getUTCFullYear(),
        ...links,
    };
}

export function parseVariant(value: string | null): BadgeVariant {
    return BADGE_VARIANTS.includes(value as BadgeVariant) ? (value as BadgeVariant) : "compact";
}

export function parseTheme(value: string | null): BadgeTheme {
    return BADGE_THEMES.includes(value as BadgeTheme) ? (value as BadgeTheme) : "light";
}

/* ─────────────── tokens ─────────────── */

interface Tokens {
    bgTop: string;
    bgBottom: string;
    text: string;
    /** ≥ 4.5:1 against both background stops. */
    muted: string;
    hairline: string;
    /** Frame gradient: gold (the card's legendary frame) → violet → cyan. */
    frame: [string, string, string];
    sheen: string;
    barLow: string;
    chipBg: string;
    /** False for mono: brand and language colours become greys. */
    colorful: boolean;
}

const TOKENS: Record<BadgeTheme, Tokens> = {
    dark: {
        bgTop: "#121826", bgBottom: "#0a0e16", text: "#f0f6fc", muted: "#a3adbb", hairline: "#ffffff14",
        frame: ["#f5c451", "#a78bfa", "#22d3ee"], sheen: "#ffffff", barLow: "#ffffff1f", chipBg: "#ffffff0f", colorful: true,
    },
    light: {
        bgTop: "#ffffff", bgBottom: "#f4f6fa", text: "#0f172a", muted: "#475569", hairline: "#0f172a12",
        frame: ["#c99a1c", "#7c3aed", "#0891b2"], sheen: "#ffffff", barLow: "#0f172a14", chipBg: "#0f172a0a", colorful: true,
    },
    mono: {
        bgTop: "#ffffff", bgBottom: "#f6f6f6", text: "#111111", muted: "#555555", hairline: "#00000014",
        frame: ["#111111", "#777777", "#bbbbbb"], sheen: "#ffffff", barLow: "#00000014", chipBg: "#0000000a", colorful: false,
    },
};

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

/* ─────────────── helpers ─────────────── */

export function escapeXml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Shorten to `max` characters with an ellipsis, then escape. */
function fit(str: string, max: number): string {
    const chars = [...str];
    return escapeXml(chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : str);
}

const fmt = (n: number) => n.toLocaleString("en-US");
/** Rough width of sans text, for laying out chips without measuring. */
const textWidth = (str: string, size: number) => [...str].length * size * 0.56;

function defs(id: string, t: Tokens, w: number, h: number): string {
    return `<defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bgTop}"/><stop offset="1" stop-color="${t.bgBottom}"/></linearGradient>
    <linearGradient id="${id}-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.frame[0]}"/><stop offset="0.55" stop-color="${t.frame[1]}"/><stop offset="1" stop-color="${t.frame[2]}"/></linearGradient>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.sheen}" stop-opacity="0"/><stop offset="0.5" stop-color="${t.sheen}" stop-opacity="0.16"/><stop offset="1" stop-color="${t.sheen}" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}-clip"><rect width="${w}" height="${h}" rx="14"/></clipPath>
  </defs>
  <style>
    .sheen { animation: sheen 9s ease-in-out infinite; }
    @keyframes sheen { 0%, 70% { transform: translateX(-160px); } 100% { transform: translateX(${w + 40}px); } }
    @media (prefers-reduced-motion: reduce) { .sheen { animation: none; opacity: 0; } }
  </style>`;
}

function frame(id: string, w: number, h: number): string {
    return `<rect width="${w}" height="${h}" rx="14" fill="url(#${id}-bg)"/>
  <g clip-path="url(#${id}-clip)"><rect class="sheen" x="0" y="-10" width="120" height="${h + 20}" fill="url(#${id}-sheen)" transform="translate(-160 0)"/></g>
  <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="13.25" fill="none" stroke="url(#${id}-frame)" stroke-width="1.5"/>`;
}

/** 52 weekly columns, heights on a square-root scale so one huge week doesn't flatten the rest. */
function bars(id: string, t: Tokens, weekly: number[], x: number, y: number, w: number, h: number): string {
    const weeks = weekly.slice(-52);
    if (weeks.length === 0) return "";
    const max = Math.max(1, ...weeks);
    const step = w / weeks.length;
    const bw = Math.max(1.5, step * 0.62);
    // One gradient across the whole year (user space), so colour tracks time.
    const gradient = `<linearGradient id="${id}-bars" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0"><stop offset="0" stop-color="${t.frame[0]}"/><stop offset="0.55" stop-color="${t.frame[1]}"/><stop offset="1" stop-color="${t.frame[2]}"/></linearGradient>`;
    return `<defs>${gradient}</defs>` + weeks
        .map((count, i) => {
            const bh = count === 0 ? 2 : Math.max(3, Math.sqrt(count / max) * h);
            const fill = count === 0 ? t.barLow : `url(#${id}-bars)`;
            return `<rect x="${(x + i * step).toFixed(1)}" y="${(y + h - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${Math.min(1.5, bw / 2).toFixed(1)}" fill="${fill}"/>`;
        })
        .join("");
}

function avatar(id: string, t: Tokens, data: BadgeData, cx: number, cy: number, r: number): string {
    const ring = `<circle cx="${cx}" cy="${cy}" r="${r + 2.5}" fill="none" stroke="url(#${id}-frame)" stroke-width="2"/>`;
    if (data.avatar) {
        return `<clipPath id="${id}-av"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  <image href="${data.avatar}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id}-av)" preserveAspectRatio="xMidYMid slice"/>${ring}`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.chipBg}"/>${ring}
  <text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" font-family="${SANS}" font-size="${r}" font-weight="700" fill="${t.text}">${escapeXml(data.login[0].toUpperCase())}</text>`;
}

/** The GitWrapped mark: a 2×2 slice of a contribution heatmap. */
function mark(id: string, t: Tokens, x: number, y: number, label = true): string {
    const cells = [[0, 0, 1], [7, 0, 0.55], [0, 7, 0.55], [7, 7, 0.3]]
        .map(([dx, dy, o]) => `<rect x="${x + dx}" y="${y + dy}" width="6" height="6" rx="1.5" fill="url(#${id}-frame)" opacity="${o}"/>`)
        .join("");
    const text = label
        ? `<text x="${x + 19}" y="${y + 10.5}" font-family="${MONO}" font-size="9.5" font-weight="600" letter-spacing="1.2" fill="${t.muted}">GITWRAPPED</text>`
        : "";
    return cells + text;
}

function languageChip(t: Tokens, language: string, x: number, y: number): { svg: string; width: number } {
    const width = 22 + textWidth(language, 11);
    return {
        width,
        svg: `<rect x="${x}" y="${y}" width="${width.toFixed(1)}" height="20" rx="10" fill="${t.chipBg}" stroke="${t.hairline}"/>
  <circle cx="${x + 11}" cy="${y + 10}" r="4" fill="${t.colorful ? getLanguageColor(language) : t.muted}"/>
  <text x="${x + 19}" y="${y + 14}" font-family="${SANS}" font-size="11" font-weight="600" fill="${t.text}">${escapeXml(language)}</text>`,
    };
}

const GLOBE = (x: number, y: number, c: string) =>
    `<g fill="none" stroke="${c}" stroke-width="1.2"><circle cx="${x + 6}" cy="${y + 6}" r="5.4"/><ellipse cx="${x + 6}" cy="${y + 6}" rx="2.4" ry="5.4"/><path d="M${x + 0.8} ${y + 6}h10.4"/></g>`;
const LINKEDIN = (x: number, y: number, c: string) =>
    `<rect x="${x}" y="${y}" width="12" height="12" rx="2.5" fill="${c}"/><path d="M${x + 3} ${y + 5}v4.5M${x + 6} ${y + 9.5}v-2.7a1.5 1.5 0 0 1 3 0v2.7M${x + 6} ${y + 5}v4.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><circle cx="${x + 3}" cy="${y + 3}" r="0.85" fill="#fff"/>`;

/** "https://www.example.com/" → "example.com" */
export function displayUrl(url: string): string {
    return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

/** The icon already says LinkedIn, so show just the handle: "linkedin.com/in/aryan" → "aryan". */
export function linkedinHandle(url: string): string {
    return displayUrl(url).replace(/^([a-z]{2,3}\.)?linkedin\.com\/in\//i, "");
}

function links(t: Tokens, data: BadgeData, x: number, y: number, maxWidth: number): string {
    const items: { icon: string; text: string }[] = [];
    const per = Math.floor((data.portfolio && data.linkedin ? maxWidth / 2 - 28 : maxWidth - 24) / 6.4);
    if (data.portfolio) items.push({ icon: GLOBE(0, 0, t.muted), text: fit(displayUrl(data.portfolio), per) });
    if (data.linkedin) items.push({ icon: LINKEDIN(0, 0, t.colorful ? "#0a66c2" : t.text), text: fit(linkedinHandle(data.linkedin), per) });
    let cx = x;
    return items
        .map(item => {
            const g = `<g transform="translate(${cx.toFixed(1)} ${y - 10})">${item.icon}</g><text x="${(cx + 18).toFixed(1)}" y="${y}" font-family="${MONO}" font-size="11" fill="${t.muted}">${item.text}</text>`;
            cx += 18 + [...item.text].length * 6.6 + 18;
            return g;
        })
        .join("");
}

function svg(w: number, h: number, title: string, body: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  ${body}
</svg>`;
}

const summary = (d: BadgeData) =>
    `${d.login} on GitWrapped: ${fmt(d.repos)} repos, ${d.languageCount} languages, ${fmt(d.contributions)} contributions in the last year`;

/* ─────────────── variants ─────────────── */

function compact(d: BadgeData, t: Tokens): string {
    const id = "gwc";
    const w = 480;
    const hasLinks = Boolean(d.portfolio || d.linkedin);
    const h = hasLinks ? 148 : 120;
    const stats = `${fmt(d.repos)} repos · ${d.languageCount} languages · ${fmt(d.contributions)} contributions this year`;
    return svg(w, h, summary(d), `${defs(id, t, w, h)}
  ${frame(id, w, h)}
  ${avatar(id, t, d, 42, 42, 22)}
  <text x="76" y="38" font-family="${SANS}" font-size="17" font-weight="700" fill="${t.text}">@${fit(d.login, 22)}</text>
  <text x="76" y="58" font-family="${SANS}" font-size="12" fill="${t.muted}">${escapeXml(stats)}</text>
  ${mark(id, t, w - 108, 18)}
  ${bars(id, t, d.weekly, 20, 78, w - 40, 26)}
  <text x="20" y="${hasLinks ? 120 : 113}" font-family="${MONO}" font-size="9" letter-spacing="0.6" fill="${t.muted}">LAST 52 WEEKS</text>
  ${d.topLanguage ? `<text x="${w - 20}" y="${hasLinks ? 120 : 113}" text-anchor="end" font-family="${MONO}" font-size="9" letter-spacing="0.6" fill="${t.muted}">MOSTLY ${fit(d.topLanguage.toUpperCase(), 18)}</text>` : ""}
  ${hasLinks ? `<line x1="20" y1="128" x2="${w - 20}" y2="128" stroke="${t.hairline}"/>` : ""}
  ${hasLinks ? links(t, d, 20, 143, w - 40) : ""}`);
}

function minimal(d: BadgeData, t: Tokens): string {
    const id = "gwm";
    const w = 340;
    const h = 72;
    return svg(w, h, summary(d), `${defs(id, t, w, h)}
  ${frame(id, w, h)}
  <rect x="14" y="16" width="3" height="40" rx="1.5" fill="url(#${id}-frame)"/>
  <text x="28" y="34" font-family="${SANS}" font-size="16" font-weight="700" fill="${t.text}">@${fit(d.login, 16)}</text>
  <text x="28" y="53" font-family="${SANS}" font-size="12" fill="${t.muted}">${fmt(d.repos)} repos · ${d.languageCount} langs</text>
  ${bars(id, t, d.weekly.slice(-26), 196, 20, 128, 32)}`);
}

function identity(d: BadgeData, t: Tokens): string {
    const id = "gwi";
    const w = 480;
    const hasLinks = Boolean(d.portfolio || d.linkedin);
    const h = hasLinks ? 156 : 128;
    const display = d.name?.trim() || d.login;
    const chip = d.topLanguage ? languageChip(t, d.topLanguage, 100, 78) : null;
    const sinceX = 100 + (chip ? chip.width + 8 : 0);
    // A faint heatmap texture behind the right side, from the real last 20 weeks.
    const recent = d.weekly.slice(-20);
    const max = Math.max(1, ...recent);
    const texture = recent
        .flatMap((count, col) =>
            Array.from({ length: 5 }, (_, row) => {
                const on = count > 0 && Math.sqrt(count / max) * 5 > 4 - row;
                return `<rect x="${w - 16 - (20 - col) * 9}" y="${22 + row * 9}" width="6.5" height="6.5" rx="1.5" fill="${on ? `url(#${id}-frame)` : t.barLow}" opacity="${on ? 0.5 : 1}"/>`;
            })
        )
        .join("");
    return svg(w, h, summary(d), `${defs(id, t, w, h)}
  ${frame(id, w, h)}
  <g opacity="0.9">${texture}</g>
  ${avatar(id, t, d, 54, 58, 30)}
  <text x="100" y="48" font-family="${SANS}" font-size="20" font-weight="700" fill="${t.text}">${fit(display, 20)}</text>
  <text x="100" y="67" font-family="${MONO}" font-size="12" fill="${t.muted}">@${fit(d.login, 30)}</text>
  ${chip?.svg ?? ""}
  <text x="${sinceX.toFixed(1)}" y="92" font-family="${SANS}" font-size="11" fill="${t.muted}">on GitHub since ${d.since} · ${fmt(d.contributions)} contributions this year</text>
  ${mark(id, t, w - 108, h - 26)}
  ${hasLinks ? `<line x1="20" y1="114" x2="${w - 20}" y2="114" stroke="${t.hairline}"/>` : ""}
  ${hasLinks ? links(t, d, 20, 136, w - 150) : ""}`);
}

export function renderBadgeSVG(data: BadgeData, variant: BadgeVariant, theme: BadgeTheme): string {
    const t = TOKENS[theme];
    if (variant === "minimal") return minimal(data, t);
    if (variant === "identity") return identity(data, t);
    return compact(data, t);
}

export function renderBadgeErrorSVG(text: string, theme: BadgeTheme = "light"): string {
    const t = TOKENS[theme];
    const id = "gwe";
    const w = 260;
    const h = 48;
    return svg(w, h, `GitWrapped: ${text}`, `${defs(id, t, w, h)}
  ${frame(id, w, h)}
  ${mark(id, t, 16, 17, false)}
  <text x="38" y="29" font-family="${SANS}" font-size="12.5" font-weight="600" fill="${t.muted}">${escapeXml(text)}</text>`);
}
