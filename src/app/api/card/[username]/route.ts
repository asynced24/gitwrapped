import { NextRequest } from "next/server";
import { fetchCardStatsEdge, getCardArtPath, getLanguageTheme, PokemonCardData } from "@/lib/card";
import { rateLimit, GITHUB_USERNAME_RE } from "@/lib/rate-limit";

export const runtime = "edge";

/* ─────────────────────────────────────────────
   Edge-compatible image utilities
   ───────────────────────────────────────────── */

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
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

    // Edge-compatible base64 encoding
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────
   Main route handler
   ───────────────────────────────────────────── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  let usedFallback = false;

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
    const limited = rateLimit(`card:${ip}`, 30, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    // Fetch card data using lightweight Edge-compatible function
    const data = await fetchCardStatsEdge(username);

    // Return JSON for the generate page client
    if (format === "json") {
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    const svg = await generateCardSVG(data, request.url);

    const renderTime = Date.now() - startTime;
    console.log(`[card] ${username} rendered in ${renderTime}ms`);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    usedFallback = true;
    const renderTime = Date.now() - startTime;
    console.log(`[card] fallback used after ${renderTime}ms:`, error instanceof Error ? error.message : "unknown error");

    const errorSvg = generateErrorSVG();
    return new Response(errorSvg, {
      status: 200, // Always 200 for image embeds
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}

/* ─────────────────────────────────────────────
   SVG Generation
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

async function generateCardSVG(data: PokemonCardData, requestUrl: string): Promise<string> {
  const theme = getLanguageTheme(data.topLanguage);
  const cardArtPath = getCardArtPath(data.topLanguage);
  const weaknessTheme = getLanguageTheme(data.weakness.type);
  const resistanceTheme = getLanguageTheme(data.resistance.type);
  const sinceYear = new Date().getFullYear() - data.accountAgeYears;
  const raritySymbol = data.rarity === "rare" ? "★" : data.rarity === "uncommon" ? "◆" : "●";

  const evoBadgeGradient =
    data.evolutionStage === "STAGE 2"
      ? "#FFD700, #FFA500"
      : data.evolutionStage === "STAGE 1"
        ? "#E8E8E8, #B0B0B0"
        : "#E6B87D, #C4926E";

  const usernameDisplay =
    data.username.length > 14 ? data.username.slice(0, 14) + "…" : data.username;

  const maxEnergyIcons = 14;
  const attack1EnergyIcons = Math.min(Math.max(data.attack1.energyCost ?? 0, 0), maxEnergyIcons);
  const attack2EnergyIcons = Math.min(Math.max(data.attack2.energyCost ?? 0, 0), maxEnergyIcons);

  // Fetch card art from our own public URL
  const url = new URL(requestUrl);
  const origin = url.origin;
  const cardArtUrl = `${origin}${cardArtPath}`;
  const cardArtDataUri = await fetchImageAsBase64(cardArtUrl);

  // Fetch avatar with proxy fallback
  const proxiedAvatarUrl = `https://images.weserv.nl/?url=${encodeURIComponent(data.avatarUrl.replace("https://", ""))}`;
  const avatarDataUri =
    (await fetchImageAsBase64(data.avatarUrl)) ??
    (await fetchImageAsBase64(proxiedAvatarUrl));

  // Split ability description at the em-dash separator so both lines show in SVG
  const cleanedAbilityDesc = cleanText(data.ability.description);
  const descDashIdx = cleanedAbilityDesc.indexOf(' - ');
  let svgDescLine1: string;
  let svgDescLine2: string;
  if (descDashIdx !== -1) {
    svgDescLine1 = cleanedAbilityDesc.slice(0, descDashIdx + 2); // e.g. "Fluent in 7 languages -"
    svgDescLine2 = cleanedAbilityDesc.slice(descDashIdx + 3);    // e.g. "attacks deal 10 extra damage"
  } else {
    svgDescLine1 = cleanedAbilityDesc.length > 40 ? cleanedAbilityDesc.slice(0, 38) + '...' : cleanedAbilityDesc;
    svgDescLine2 = '';
  }
  if (svgDescLine1.length > 42) svgDescLine1 = svgDescLine1.slice(0, 40) + '...';
  if (svgDescLine2.length > 42) svgDescLine2 = svgDescLine2.slice(0, 40) + '...';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="358" height="498" viewBox="0 0 358 498" fill="none">
  <defs>
    <!-- Full-art background gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.borderColor}"/>
      <stop offset="40%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.borderColor}"/>
    </linearGradient>

    <!-- Evolution badge gradient -->
    <linearGradient id="evoBadge" x1="0" y1="0" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${evoBadgeGradient.split(", ")[0]}"/>
      <stop offset="100%" stop-color="${evoBadgeGradient.split(", ")[1]}"/>
    </linearGradient>

    <!-- Ability badge gradient -->
    <linearGradient id="abilityBadge" x1="0" y1="0" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.borderColor}"/>
    </linearGradient>

    <!-- Energy dot gradients -->
    <radialGradient id="energyMain" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.borderColor}"/>
    </radialGradient>
    <radialGradient id="energyWeak" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${weaknessTheme.accentColor}"/>
      <stop offset="100%" stop-color="${weaknessTheme.borderColor}"/>
    </radialGradient>
    <radialGradient id="energyResist" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${resistanceTheme.accentColor}"/>
      <stop offset="100%" stop-color="${resistanceTheme.borderColor}"/>
    </radialGradient>

    <!-- Avatar clip -->
    <clipPath id="octClip">
      <polygon points="175,60 212,73 225,110 225,150 212,187 175,200 138,187 125,150 125,110 138,73"/>
    </clipPath>

    <!-- Vignette for avatar -->
    <radialGradient id="avatarFade" cx="50%" cy="50%" r="50%">
      <stop offset="56%" stop-color="white" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
    </radialGradient>

    <!-- Blur filter for drop shadows -->
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>

    <!-- Gradient border frame -->
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(145)">
      <stop offset="0%" stop-color="${theme.borderColor}"/>
      <stop offset="100%" stop-color="${theme.accentColor}"/>
    </linearGradient>
    <clipPath id="cardClip">
      <rect width="350" height="490" rx="16"/>
    </clipPath>
    <clipPath id="abilityClip">
      <rect x="12" y="228" width="326" height="68" rx="8"/>
    </clipPath>
    <clipPath id="attacksClip">
      <rect x="12" y="300" width="326" height="100" rx="8"/>
    </clipPath>
    <!-- Metallic V gradient for header -->
    <linearGradient id="silverV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#aaaaaa"/>
    </linearGradient>
  </defs>

  <!-- ═══ OUTER GRADIENT BORDER FRAME ═══ -->
  <rect width="358" height="498" rx="20" fill="url(#borderGradient)"/>

  <!-- ═══ CARD CONTENT (clipped + offset by 4px border) ═══ -->
  <g transform="translate(4,4)" clip-path="url(#cardClip)">

  <!-- ═══ FULL-ART BACKGROUND ═══ -->
  <rect width="350" height="490" rx="16" fill="url(#bgGradient)"/>
  ${cardArtDataUri ? `<image href="${cardArtDataUri}" x="0" y="0" width="350" height="490" preserveAspectRatio="xMidYMid slice" opacity="0.62"/>` : ""}
  <!-- Lighter theme wash — lets illustration show through -->
  <rect width="350" height="490" rx="16" fill="url(#bgGradient)" opacity="0.50"/>

  <!-- ═══ INNER BORDER (subtle inset) ═══ -->
  <rect width="350" height="490" rx="16" fill="none" stroke="rgba(220,220,220,0.35)" stroke-width="1.5"/>

  <!-- ═══ HEADER BAR — lightened ═══ -->
  <rect width="350" height="48" rx="16" fill="rgba(0,0,0,0.60)"/>
  <rect width="350" height="48" rx="16" fill="rgba(0,0,0,0.38)"/>

  <!-- Evolution badge -->
  <rect x="16" y="10" width="${Math.max(data.evolutionStage.length * 9 + 20, 80)}" height="26" rx="13" fill="url(#evoBadge)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
  <text x="${16 + Math.max(data.evolutionStage.length * 9 + 20, 80) / 2}" y="28" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#1a1a1a" letter-spacing="0.8">${escapeXml(data.evolutionStage)}</text>

  <!-- Username + metallic V (single text element so SVG handles spacing natively) -->
  <text x="${28 + Math.max(data.evolutionStage.length * 9 + 20, 80)}" y="30" font-family="'Mona Sans', -apple-system, sans-serif" font-size="19" font-weight="900" fill="white" letter-spacing="-0.4" stroke="rgba(0,0,0,0.3)" stroke-width="0.5">${escapeXml(usernameDisplay)}<tspan fill="url(#silverV)" stroke="none" letter-spacing="0" dx="8">V</tspan></text>

  <!-- HP -->
  <text x="260" y="26" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.90)" letter-spacing="1.2">HP</text>
  <text x="280" y="34" font-family="'Mona Sans', -apple-system, sans-serif" font-size="30" font-weight="900" fill="white" letter-spacing="-0.5">${data.hp}</text>

  <!-- Type emoji -->
  <text x="320" y="33" font-size="20">${theme.emoji}</text>

  <!-- ═══ AVATAR — lighter shell ═══ -->
  <polygon points="175,60 212,73 225,110 225,150 212,187 175,200 138,187 125,150 125,110 138,73" fill="rgba(10,12,18,0.42)" stroke="rgba(255,255,255,0.38)" stroke-width="2.5"/>
  <polygon points="175,64 209,76 221,110 221,150 209,184 175,196 141,184 129,150 129,110 141,76" fill="rgba(17,24,39,0.50)"/>
  ${avatarDataUri ? `<image href="${avatarDataUri}" x="125" y="60" width="100" height="140" clip-path="url(#octClip)" preserveAspectRatio="xMidYMid slice"/>` : `
  <!-- Initials fallback -->
  <circle cx="175" cy="130" r="35" fill="${theme.borderColor}" opacity="0.8"/>
  <text x="175" y="140" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="32" font-weight="900" fill="white" opacity="0.9">${escapeXml(data.username.charAt(0).toUpperCase())}</text>
  `}
  <rect x="125" y="60" width="100" height="140" fill="url(#avatarFade)" clip-path="url(#octClip)"/>

  <!-- ═══ INFO BAR ═══ -->
  <text x="175" y="220" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="white" letter-spacing="0.3" stroke="rgba(0,0,0,0.6)" stroke-width="0.6" paint-order="stroke">@${escapeXml(data.username)}${data.location ? ` · ${escapeXml(data.location.length > 15 ? data.location.slice(0, 13) + ".." : data.location)}` : ""} · Since ${sinceYear}</text>

  <!-- ═══ ABILITY + XP/VELOCITY (combined panel — height 68px) ═══ -->
  <rect x="12" y="228" width="326" height="68" rx="8" fill="rgba(0,0,0,0.28)" stroke="${theme.accentColor}60" stroke-width="1.5"/>
  <!-- Accent left border -->
  <rect x="12" y="228" width="3" height="68" rx="1.5" fill="${theme.accentColor}80"/>
  <g clip-path="url(#abilityClip)">
    <rect x="19" y="234" width="44" height="14" rx="3" fill="url(#abilityBadge)"/>
    <text x="41" y="245" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="900" fill="white" letter-spacing="0.5">ABILITY</text>
    <text x="70" y="245" font-family="'Mona Sans', -apple-system, sans-serif" font-size="13" font-weight="760" fill="white">${escapeXml(data.ability.name.length > 26 ? data.ability.name.slice(0, 24) + "…" : data.ability.name)}</text>
    <!-- Description split across 2 lines so nothing is cut -->
    <text x="19" y="261" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.90)" font-style="italic">${escapeXml(svgDescLine1)}</text>
    ${svgDescLine2 ? `<text x="19" y="275" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.90)" font-style="italic">${escapeXml(svgDescLine2)}</text>` : ""}
    <!-- XP + Velocity -->
    <text x="19" y="289" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="500" fill="rgba(255,255,255,0.55)" letter-spacing="0.3">XP ${data.xp.toLocaleString()} · Velocity ${data.codeVelocity}%</text>
  </g>

  <!-- ═══ ATTACKS PANEL (shifted down 8px, height trimmed to 100px) ═══ -->
  <rect x="12" y="300" width="326" height="100" rx="8" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>

  <g clip-path="url(#attacksClip)">
  <!-- ═══ ATTACK 1 ═══ -->
  <g>
    ${Array.from({ length: attack1EnergyIcons }).map((_, i) =>
      `<circle cx="${24 + i * 20}" cy="314" r="9" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
    <text x="${20 + attack1EnergyIcons * 20}" y="318" font-family="'Mona Sans', -apple-system, sans-serif" font-size="15" font-weight="850" fill="white" letter-spacing="-0.2" stroke="rgba(0,0,0,0.7)" stroke-width="0.8" paint-order="stroke">${escapeXml(data.attack1.name)}</text>
    <text x="326" y="320" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="900" fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9" paint-order="stroke">${data.attack1.damage}</text>
    <text x="${20 + attack1EnergyIcons * 20}" y="333" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.45)" stroke-width="0.5" paint-order="stroke">${escapeXml(cleanText(data.attack1.description.length > 42 ? data.attack1.description.slice(0, 39) + "..." : data.attack1.description))}</text>
  </g>

  <!-- Divider -->
  <line x1="20" y1="346" x2="330" y2="346" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>

  <!-- ═══ ATTACK 2 ═══ -->
  <g>
    ${Array.from({ length: attack2EnergyIcons }).map((_, i) =>
      `<circle cx="${24 + i * 20}" cy="362" r="9" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
    <text x="${20 + attack2EnergyIcons * 20}" y="366" font-family="'Mona Sans', -apple-system, sans-serif" font-size="15" font-weight="850" fill="white" letter-spacing="-0.2" stroke="rgba(0,0,0,0.7)" stroke-width="0.8" paint-order="stroke">${escapeXml(data.attack2.name)}</text>
    <text x="326" y="368" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="900" fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9" paint-order="stroke">${data.attack2.damage}</text>
    <text x="${20 + attack2EnergyIcons * 20}" y="381" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.45)" stroke-width="0.5" paint-order="stroke">${escapeXml(cleanText(data.attack2.description.length > 42 ? data.attack2.description.slice(0, 39) + "..." : data.attack2.description))}</text>
  </g>
  </g>

  <!-- ═══ BOTTOM STATS BAR — lightened ═══ -->
  <rect y="402" width="350" height="88" rx="16" fill="rgba(0,0,0,0.62)"/>
  <line x1="116" y1="416" x2="116" y2="450" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
  <line x1="234" y1="416" x2="234" y2="450" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>

  <!-- Weakness -->
  <text x="58" y="420" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="rgba(255,255,255,0.60)" letter-spacing="0.5">WEAKNESS</text>
  <circle cx="46" cy="436" r="8" fill="url(#energyWeak)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="58" y="440" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="white">${escapeXml(data.weakness.modifier)}</text>

  <!-- Resistance -->
  <text x="175" y="420" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="rgba(255,255,255,0.60)" letter-spacing="0.5">RESIST</text>
  <circle cx="163" cy="436" r="8" fill="url(#energyResist)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="175" y="440" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="white">${escapeXml(data.resistance.modifier)}</text>

  <!-- Retreat -->
  <text x="292" y="420" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="rgba(255,255,255,0.60)" letter-spacing="0.5">RETREAT</text>
  <g>
    ${Array.from({ length: Math.min(data.retreatCost, 4) }).map((_, i) =>
      `<circle cx="${272 + i * 18}" cy="436" r="8" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
  </g>

  <!-- Footer branding -->
  <line x1="20" y1="458" x2="330" y2="458" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
  <text x="20" y="476" font-family="'JetBrains Mono', monospace" font-size="11" fill="rgba(255,255,255,0.45)" letter-spacing="0.5">gitwrapped · ${data.programmingLanguageCount} lang · ${escapeXml(data.topLanguage ?? "")}</text>
  <text x="330" y="476" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" fill="rgba(255,255,255,0.45)" letter-spacing="0.3">#${data.cardNumber} ${raritySymbol}</text>
  </g>
</svg>`;
}

/* ─────────────────────────────────────────────
   Error card SVG
   ───────────────────────────────────────────── */

function generateErrorSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="490" viewBox="0 0 350 490" fill="none">
  <rect width="350" height="490" rx="16" fill="#6b7280"/>
  <rect x="8" y="8" width="334" height="474" rx="10" fill="#FFF8F0"/>
  <text x="175" y="230" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="16" font-weight="700" fill="#1a1a2e">User Not Found</text>
  <text x="175" y="255" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" fill="#6b7280">Check the username and try again</text>
  <text x="175" y="465" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" fill="#d1d5db">gitwrapped</text>
</svg>`;
}
