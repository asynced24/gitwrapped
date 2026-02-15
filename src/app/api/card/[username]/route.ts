import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { fetchCardData, getCardArtPath, getLanguageTheme, PokemonCardData } from "@/lib/card";

const imageDataUriCache = new Map<string, string>();

function toMimeType(fileExt: string): string {
  if (fileExt === ".png") return "image/png";
  if (fileExt === ".webp") return "image/webp";
  return "image/jpeg";
}

function readPublicImageAsDataUri(publicPath: string): string | null {
  const normalizedPath = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  if (imageDataUriCache.has(normalizedPath)) {
    return imageDataUriCache.get(normalizedPath) ?? null;
  }

  try {
    const absolutePath = path.join(process.cwd(), "public", normalizedPath);
    const extension = path.extname(absolutePath).toLowerCase();
    const mimeType = toMimeType(extension);
    const fileBuffer = fs.readFileSync(absolutePath);
    const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    imageDataUriCache.set(normalizedPath, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

async function fetchImageAsDataUri(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, { cache: "force-cache" });
    if (!response.ok) {
      return null;
    }
    const mimeType = response.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format");
        const data = await fetchCardData(username);

        // Return JSON for the generate page client
        if (format === "json") {
            return new Response(JSON.stringify(data), {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=3600, s-maxage=3600",
                },
            });
        }

        const svg = await generateCardSVG(data);

        return new Response(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch {
        const errorSvg = generateErrorSVG();
        return new Response(errorSvg, {
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

async function generateCardSVG(data: PokemonCardData): Promise<string> {
    const theme = getLanguageTheme(data.topLanguage);
  const cardArtPath = getCardArtPath(data.topLanguage);
  const cardArtDataUri = readPublicImageAsDataUri(cardArtPath);
    const weaknessTheme = getLanguageTheme(data.weakness.type);
    const resistanceTheme = getLanguageTheme(data.resistance.type);
    const sinceYear = new Date().getFullYear() - data.accountAgeYears;

    const evoBadgeGradient =
        data.evolutionStage === "STAGE 2"
            ? "#FFD700, #FFA500"
            : data.evolutionStage === "STAGE 1"
            ? "#E8E8E8, #B0B0B0"
            : "#E6B87D, #C4926E";

    const usernameDisplay =
        data.username.length > 14 ? data.username.slice(0, 14) + "…" : data.username;

    const proxiedAvatarUrl = `https://images.weserv.nl/?url=${encodeURIComponent(data.avatarUrl.replace("https://", ""))}`;
    const avatarDataUri =
      (await fetchImageAsDataUri(data.avatarUrl)) ??
      (await fetchImageAsDataUri(proxiedAvatarUrl));

    return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="490" viewBox="0 0 350 490" fill="none">
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
    
    <!-- Avatar hexagon clip (larger size) -->
    <clipPath id="hexClip">
      <polygon points="175,75 210,95 210,135 175,155 140,135 140,95"/>
    </clipPath>
  </defs>

  <!-- ═══ FULL-ART BACKGROUND ═══ -->
  <rect width="350" height="490" rx="16" fill="url(#bgGradient)"/>
  ${cardArtDataUri ? `<image href="${cardArtDataUri}" x="0" y="0" width="350" height="490" preserveAspectRatio="xMidYMid slice" opacity="0.58"/>` : ""}
  <rect width="350" height="490" rx="16" fill="url(#bgGradient)" opacity="0.72"/>
  
  <!-- ═══ SUBTLE DIAGONAL PATTERN OVERLAY ═══ -->
  <g opacity="0.06">
    ${Array.from({ length: 60 }).map((_, i) => {
        return `<line x1="${i * 10 - 100}" y1="0" x2="${i * 10 + 400}" y2="490" stroke="white" stroke-width="0.5"/>`;
    }).join("\n    ")}
  </g>
  
  <!-- ═══ RADIAL GLOW BEHIND AVATAR ═══ -->
  <circle cx="175" cy="120" r="100" fill="white" opacity="0.15" filter="url(#blur)"/>
  <defs><filter id="blur"><feGaussianBlur stdDeviation="40"/></filter></defs>
  
  <!-- ═══ SILVER BORDER ═══ -->
  <rect width="350" height="490" rx="16" fill="none" stroke="rgba(220,220,220,0.6)" stroke-width="2"/>

  <!-- ═══ HEADER BAR ═══ -->
  <rect width="350" height="48" rx="16" fill="rgba(0,0,0,0.60)"/>
  <rect width="350" height="48" fill="rgba(0,0,0,0.40)"/>
  
  <!-- Evolution badge -->
  <rect x="16" y="12" width="${Math.max(data.evolutionStage.length * 7.5 + 12, 65)}" height="22" rx="11" fill="url(#evoBadge)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
  <text x="${16 + Math.max(data.evolutionStage.length * 7.5 + 12, 65) / 2}" y="27" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" font-weight="800" fill="#1a1a1a" letter-spacing="1">${escapeXml(data.evolutionStage)}</text>
  
  <!-- Username V -->
  <text x="${28 + Math.max(data.evolutionStage.length * 7.5 + 12, 65)}" y="30" font-family="'Mona Sans', -apple-system, sans-serif" font-size="18" font-weight="900" fill="white" letter-spacing="-0.4" stroke="rgba(0,0,0,0.3)" stroke-width="0.5">${escapeXml(usernameDisplay)} V</text>
  
  <!-- HP -->
  <text x="260" y="26" font-family="'Mona Sans', -apple-system, sans-serif" font-size="10" font-weight="600" fill="rgba(255,255,255,0.7)" letter-spacing="1">HP</text>
  <text x="280" y="34" font-family="'Mona Sans', -apple-system, sans-serif" font-size="30" font-weight="900" fill="white" letter-spacing="-0.5">${data.hp}</text>
  
  <!-- Type emoji -->
  <text x="320" y="33" font-size="20">${theme.emoji}</text>

  <!-- ═══ AVATAR (Hexagon - Larger) ═══ -->
  <polygon points="175,75 210,95 210,135 175,155 140,135 140,95" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
  <polygon points="175,78 207,97 207,133 175,152 143,133 143,97" fill="white" fill-opacity="0.1"/>
  ${avatarDataUri ? `<image href="${avatarDataUri}" x="140" y="75" width="70" height="80" clip-path="url(#hexClip)" preserveAspectRatio="xMidYMid slice"/>` : ""}
  
  <!-- Avatar drop shadow -->
  <ellipse cx="175" cy="156" rx="30" ry="8" fill="rgba(0,0,0,0.2)" filter="url(#blur)"/>

  <!-- ═══ INFO BAR ═══ -->
  ${
      data.location
          ? `<text x="175" y="172" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="rgba(255,255,255,0.7)" letter-spacing="0.5">@${escapeXml(data.username)} · ${escapeXml(data.location.length > 15 ? data.location.slice(0, 13) + ".." : data.location)} · Since ${sinceYear}</text>`
          : ""
  }

  <!-- ═══ ABILITY SECTION ═══ -->
  <rect x="12" y="185" width="326" height="${data.ability.description.length > 50 ? 44 : 38}" rx="8" fill="rgba(0,0,0,0.40)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <rect x="16" y="192" width="44" height="14" rx="3" fill="#FF4444"/>
  <linearGradient id="abilityBadge"><stop offset="0%" stop-color="#FF4444"/><stop offset="100%" stop-color="#CC0000"/></linearGradient>
  <rect x="16" y="192" width="44" height="14" rx="3" fill="url(#abilityBadge)"/>
  <text x="38" y="202.5" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="8" font-weight="900" fill="white" letter-spacing="1">ABILITY</text>
  <text x="68" y="201" font-family="'Mona Sans', -apple-system, sans-serif" font-size="12" font-weight="700" fill="white">${escapeXml(data.ability.name)}</text>
  <text x="68" y="215" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" fill="rgba(255,255,255,0.85)" font-style="italic">${escapeXml(data.ability.description.length > 55 ? data.ability.description.slice(0, 52) + "..." : data.ability.description)}</text>

  <!-- ═══ ATTACK 1 ═══ -->
  <g>
    ${Array.from({ length: data.attack1.energyCost }).map((_, i) =>
        `<circle cx="${20 + i * 22}" cy="250" r="9" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
    <text x="${30 + data.attack1.energyCost * 22}" y="254" font-family="'Mona Sans', -apple-system, sans-serif" font-size="14" font-weight="800" fill="white" letter-spacing="-0.3">${escapeXml(data.attack1.name)}</text>
    <text x="330" y="256" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="900" fill="white">${data.attack1.damage}</text>
    <text x="${30 + data.attack1.energyCost * 22}" y="272" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" fill="rgba(255,255,255,0.8)">${escapeXml(data.attack1.description.length > 45 ? data.attack1.description.slice(0, 42) + "..." : data.attack1.description)}</text>
  </g>

  <!-- Divider -->
  <line x1="20" y1="290" x2="330" y2="290" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <!-- ═══ ATTACK 2 ═══ -->
  <g>
    ${Array.from({ length: data.attack2.energyCost }).map((_, i) =>
        `<circle cx="${20 + i * 22}" cy="316" r="9" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
    <text x="${30 + data.attack2.energyCost * 22}" y="320" font-family="'Mona Sans', -apple-system, sans-serif" font-size="14" font-weight="800" fill="white" letter-spacing="-0.3">${escapeXml(data.attack2.name)}</text>
    <text x="330" y="322" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="900" fill="white">${data.attack2.damage}</text>
    <text x="${30 + data.attack2.energyCost * 22}" y="338" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" fill="rgba(255,255,255,0.8)">${escapeXml(data.attack2.description.length > 45 ? data.attack2.description.slice(0, 42) + "..." : data.attack2.description)}</text>
  </g>

  <!-- ═══ BOTTOM STATS BAR ═══ -->
  <rect y="370" width="350" height="120" fill="rgba(0,0,0,0.55)"/>
  
  <!-- Weakness -->
  <text x="30" y="396" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="1.2">WEAKNESS</text>
  <circle cx="30" cy="414" r="9" fill="url(#energyWeak)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="44" y="418" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="white">${escapeXml(data.weakness.modifier)}</text>
  
  <!-- Resistance -->
  <text x="145" y="396" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="1.2">RESISTANCE</text>
  <circle cx="145" cy="414" r="9" fill="url(#energyResist)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="159" y="418" font-family="'Mona Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="white">${escapeXml(data.resistance.modifier)}</text>
  
  <!-- Retreat -->
  <text x="270" y="396" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="1.2">RETREAT</text>
  <g>
    ${Array.from({ length: Math.min(data.retreatCost, 4) }).map((_, i) =>
        `<circle cx="${270 + i * 22}" cy="414" r="9" fill="url(#energyMain)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
    ).join("\n    ")}
  </g>
  
  <!-- Footer branding -->
  <line x1="20" y1="440" x2="330" y2="440" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
  <text x="175" y="460" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" fill="rgba(255,255,255,0.5)" letter-spacing="1">gitwrapped · ${data.programmingLanguageCount} lang · ${data.topLanguage}</text>
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
