import { NextRequest } from "next/server";
import { fetchCardData, getLanguageTheme, PokemonCardData } from "@/lib/card";

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

        const svg = generateCardSVG(data);

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

function generateCardSVG(data: PokemonCardData): string {
    const theme = getLanguageTheme(data.topLanguage);
    const weakTheme = getLanguageTheme(data.leastUsedLanguage);
    const sinceYear = new Date().getFullYear() - data.accountAgeYears;

    const evoBadgeColor = data.evolutionStage === "STAGE 2" ? "#FFD700"
        : data.evolutionStage === "STAGE 1" ? "#C0C0C0" : "#CD7F32";

    // Truncate bio for SVG
    const bio = data.bio.length > 80 ? data.bio.slice(0, 77) + "..." : data.bio;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="490" viewBox="0 0 350 490" fill="none">
  <defs>
    <!-- Holo shimmer gradient -->
    <linearGradient id="holo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff000008"/>
      <stop offset="16%" stop-color="#ff880008"/>
      <stop offset="33%" stop-color="#ffff0008"/>
      <stop offset="50%" stop-color="#00ff0008"/>
      <stop offset="66%" stop-color="#0088ff08"/>
      <stop offset="83%" stop-color="#8800ff08"/>
      <stop offset="100%" stop-color="#ff000008"/>
    </linearGradient>
    <!-- Gold accent gradient -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4A853"/>
      <stop offset="50%" stop-color="#F0D68A"/>
      <stop offset="100%" stop-color="#D4A853"/>
    </linearGradient>
    <!-- Artwork bg gradient -->
    <linearGradient id="artBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.borderColor}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${theme.accentColor}" stop-opacity="0.03"/>
    </linearGradient>
    <!-- Avatar clip -->
    <clipPath id="avatarClip">
      <circle cx="175" cy="220" r="48"/>
    </clipPath>
    <!-- Energy dot gradients -->
    <radialGradient id="energy1" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.borderColor}"/>
    </radialGradient>
    <radialGradient id="energyWeak" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${weakTheme.accentColor}"/>
      <stop offset="100%" stop-color="${weakTheme.borderColor}"/>
    </radialGradient>
  </defs>

  <!-- OUTER BORDER -->
  <rect width="350" height="490" rx="16" fill="${theme.borderColor}"/>

  <!-- GOLD INNER ACCENT -->
  <rect x="6" y="6" width="338" height="478" rx="12" fill="none" stroke="url(#gold)" stroke-width="2"/>

  <!-- CARD BODY -->
  <rect x="8" y="8" width="334" height="474" rx="10" fill="#FFF8F0"/>

  <!-- Holo overlay -->
  <rect x="0" y="0" width="350" height="490" rx="16" fill="url(#holo)" opacity="0.5"/>

  <!-- ═══ HEADER ═══ -->
  <!-- Evolution badge -->
  <rect x="16" y="16" width="${data.evolutionStage.length * 7 + 12}" height="18" rx="4" fill="${evoBadgeColor}"/>
  <text x="${16 + (data.evolutionStage.length * 7 + 12) / 2}" y="28" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" font-weight="700" fill="#1a1a2e" letter-spacing="0.5">${escapeXml(data.evolutionStage)}</text>

  <!-- Username -->
  <text x="${16 + data.evolutionStage.length * 7 + 20}" y="30" font-family="'Mona Sans', -apple-system, sans-serif" font-size="15" font-weight="800" fill="#1a1a2e">${escapeXml(data.name.length > 16 ? data.name.slice(0, 14) + ".." : data.name)}</text>

  <!-- HP -->
  <text x="280" y="27" font-family="'Mona Sans', -apple-system, sans-serif" font-size="10" font-weight="600" fill="#6b7280">HP</text>
  <text x="296" y="30" font-family="'Mona Sans', -apple-system, sans-serif" font-size="20" font-weight="900" fill="#1a1a2e">${data.totalStars}</text>

  <!-- Type badge -->
  <rect x="260" y="36" width="${theme.type.length * 6 + 26}" height="16" rx="8" fill="${theme.borderColor}15" stroke="${theme.borderColor}30" stroke-width="0.5"/>
  <text x="${260 + (theme.type.length * 6 + 26) / 2}" y="47" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="9" font-weight="700" fill="${theme.borderColor}">${theme.emoji} ${escapeXml(theme.type)}</text>

  <!-- ═══ ARTWORK FRAME ═══ -->
  <rect x="20" y="60" width="310" height="140" rx="8" fill="url(#artBg)" stroke="${theme.borderColor}" stroke-opacity="0.15" stroke-width="1.5"/>

  <!-- Pattern lines -->
  <g opacity="0.03">
    ${Array.from({ length: 20 }).map((_, i) =>
        `<line x1="${20 + i * 22}" y1="60" x2="${20 + i * 22 - 70}" y2="200" stroke="${theme.borderColor}" stroke-width="1"/>`
    ).join("\n    ")}
  </g>

  <!-- Avatar ring -->
  <circle cx="175" cy="130" r="52" fill="none" stroke="${theme.borderColor}" stroke-opacity="0.2" stroke-width="3"/>
  <circle cx="175" cy="130" r="49" fill="#FFF8F0"/>

  <!-- Avatar image -->
  <clipPath id="avatarClipMain">
    <circle cx="175" cy="130" r="47"/>
  </clipPath>
  <image href="${escapeXml(data.avatarUrl)}" x="128" y="83" width="94" height="94" clip-path="url(#avatarClipMain)" preserveAspectRatio="xMidYMid slice"/>

  <!-- ═══ FLAVOR BAR ═══ -->
  <text x="175" y="215" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="#9ca3af" letter-spacing="0.3">@${escapeXml(data.username)} · ${escapeXml(data.location.length > 12 ? data.location.slice(0, 10) + ".." : data.location)} · Since ${sinceYear}</text>

  <!-- ═══ DIVIDER ═══ -->
  <line x1="30" y1="228" x2="320" y2="228" stroke="${theme.borderColor}" stroke-opacity="0.15" stroke-width="1"/>

  <!-- ═══ ATTACK 1 ═══ -->
  <!-- Energy dot -->
  <circle cx="30" cy="252" r="9" fill="url(#energy1)" stroke="white" stroke-opacity="0.4" stroke-width="1.5"/>

  <!-- Attack name -->
  <text x="48" y="256" font-family="'Mona Sans', -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#1a1a2e">${escapeXml(data.topRepos[0].name.toUpperCase().replace(/-/g, " ").slice(0, 22))}</text>

  <!-- Damage -->
  <text x="325" y="258" text-anchor="end" font-family="'Mona Sans', -apple-system, sans-serif" font-size="18" font-weight="900" fill="#1a1a2e">${data.topRepos[0].stars > 0 ? data.topRepos[0].stars * 10 : 20}</text>

  <!-- Description -->
  <text x="48" y="271" font-family="'Mona Sans', -apple-system, sans-serif" font-size="8.5" fill="#6b7280">${escapeXml(data.topRepos[0].description.slice(0, 50))}</text>

  <!-- ═══ ATTACK 2 ═══ -->
  <!-- Energy dots -->
  <circle cx="24" cy="302" r="9" fill="url(#energy1)" stroke="white" stroke-opacity="0.4" stroke-width="1.5"/>
  <circle cx="40" cy="302" r="9" fill="url(#energy1)" stroke="white" stroke-opacity="0.4" stroke-width="1.5"/>

  <!-- Attack name -->
  <text x="58" y="306" font-family="'Mona Sans', -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#1a1a2e">${escapeXml(data.topRepos[1].name.toUpperCase().replace(/-/g, " ").slice(0, 20))}</text>

  <!-- Damage -->
  <text x="325" y="308" text-anchor="end" font-family="'Mona Sans', -apple-system, sans-serif" font-size="18" font-weight="900" fill="#1a1a2e">${data.topRepos[1].stars > 0 ? data.topRepos[1].stars * 10 : 20}</text>

  <!-- Description -->
  <text x="58" y="321" font-family="'Mona Sans', -apple-system, sans-serif" font-size="8.5" fill="#6b7280">${escapeXml(data.topRepos[1].description.slice(0, 50))}</text>

  <!-- ═══ DIVIDER ═══ -->
  <line x1="30" y1="340" x2="320" y2="340" stroke="${theme.borderColor}" stroke-opacity="0.15" stroke-width="1"/>

  <!-- ═══ WEAKNESS / RESISTANCE / RETREAT ═══ -->
  <!-- Weakness -->
  <text x="24" y="362" font-family="'Mona Sans', -apple-system, sans-serif" font-size="7" font-weight="600" fill="#9ca3af" letter-spacing="0.8">WEAKNESS</text>
  <rect x="24" y="367" width="40" height="16" rx="4" fill="${weakTheme.borderColor}15"/>
  <text x="44" y="378" text-anchor="middle" font-family="'Mona Sans', sans-serif" font-size="9" font-weight="700" fill="${weakTheme.borderColor}">${weakTheme.emoji} ×2</text>

  <!-- Resistance -->
  <text x="138" y="362" font-family="'Mona Sans', -apple-system, sans-serif" font-size="7" font-weight="600" fill="#9ca3af" letter-spacing="0.8">RESISTANCE</text>
  <rect x="138" y="367" width="40" height="16" rx="4" fill="${theme.borderColor}15"/>
  <text x="158" y="378" text-anchor="middle" font-family="'Mona Sans', sans-serif" font-size="9" font-weight="700" fill="${theme.borderColor}">${theme.emoji} -30</text>

  <!-- Retreat -->
  <text x="260" y="362" font-family="'Mona Sans', -apple-system, sans-serif" font-size="7" font-weight="600" fill="#9ca3af" letter-spacing="0.8">RETREAT</text>
  <text x="260" y="380" font-family="'Mona Sans', sans-serif" font-size="11">${"🐛".repeat(Math.min(data.zeroStarRepoCount, 4)) || "—"}</text>

  <!-- ═══ POKÉDEX FLAVOR TEXT ═══ -->
  <rect x="16" y="395" width="318" height="40" rx="6" fill="${theme.borderColor}" fill-opacity="0.04" stroke="${theme.borderColor}" stroke-opacity="0.08" stroke-width="0.5"/>
  <text x="175" y="413" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="8" fill="#6b7280" font-style="italic">Pokédex: ${escapeXml(bio.slice(0, 55))}</text>
  ${bio.length > 55 ? `<text x="175" y="425" text-anchor="middle" font-family="'Mona Sans', -apple-system, sans-serif" font-size="8" fill="#6b7280" font-style="italic">${escapeXml(bio.slice(55))}</text>` : ""}

  <!-- ═══ FOOTER ═══ -->
  <text x="175" y="458" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" fill="#d1d5db" letter-spacing="0.5">gitwrapped · ${data.programmingLanguageCount} languages · ${data.topLanguage}</text>

  <!-- Corner accents -->
  <circle cx="18" cy="472" r="4" fill="${theme.borderColor}" opacity="0.12"/>
  <circle cx="332" cy="472" r="4" fill="${theme.borderColor}" opacity="0.12"/>
  <circle cx="18" cy="18" r="4" fill="${theme.borderColor}" opacity="0.12"/>
  <circle cx="332" cy="18" r="4" fill="${theme.borderColor}" opacity="0.12"/>
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
