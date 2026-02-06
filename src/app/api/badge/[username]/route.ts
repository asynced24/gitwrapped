import { NextRequest, NextResponse } from "next/server";
import { fetchUser, fetchRepositories, calculateLanguageStats, fetchRepoLanguages } from "@/lib/github";

/**
 * SVG Badge Generator for GitWrapped
 * Returns an SVG badge that can be embedded in README files
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        // Fetch minimal data needed for the badge
        const [user, repositories] = await Promise.all([
            fetchUser(username),
            fetchRepositories(username)
        ]);

        // Get top language from first 10 repos
        const reposToAnalyze = repositories
            .filter(r => !r.fork)
            .slice(0, 10);

        const languageData = await Promise.all(
            reposToAnalyze.map(repo => fetchRepoLanguages(username, repo.name))
        );

        const languageStats = calculateLanguageStats(languageData);
        const topLanguage = languageStats.find(l => !l.isMarkup)?.language || "Code";
        const langColor = languageStats.find(l => !l.isMarkup)?.color || "#10b981";

        // Calculate stats
        const totalStars = repositories.reduce((sum, r) => sum + r.stargazers_count, 0);
        const ownRepos = repositories.filter(r => !r.fork).length;

        // Generate SVG badge
        const svg = generateBadgeSVG({
            username: user.login,
            topLanguage,
            langColor,
            stars: totalStars,
            repos: ownRepos,
        });

        return new NextResponse(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch {
        // Return error badge
        const errorSvg = generateErrorBadgeSVG();
        return new NextResponse(errorSvg, {
            status: 200, // Return 200 so the image still renders
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300",
            },
        });
    }
}

interface BadgeData {
    username: string;
    topLanguage: string;
    langColor: string;
    stars: number;
    repos: number;
}

function generateBadgeSVG(data: BadgeData): string {
    const { username, topLanguage, langColor, stars, repos } = data;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <defs>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="320" height="80" rx="10" fill="#ffffff" filter="url(#shadow)"/>
  
  <!-- Accent bar -->
  <rect width="320" height="4" rx="10" ry="0" fill="url(#accent)"/>
  
  <!-- Content -->
  <g transform="translate(16, 20)">
    <!-- Username -->
    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="#111827">
      ${escapeXml(username)}
    </text>
    
    <!-- Stats row -->
    <g transform="translate(0, 32)">
      <!-- Language -->
      <circle cx="4" cy="6" r="4" fill="${escapeXml(langColor)}"/>
      <text x="12" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="#4b5563">
        ${escapeXml(topLanguage)}
      </text>
      
      <!-- Stars -->
      <text x="90" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="#4b5563">
        ★ ${stars.toLocaleString()}
      </text>
      
      <!-- Repos -->
      <text x="150" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="#4b5563">
        ${repos} repos
      </text>
    </g>
  </g>
  
  <!-- Branding -->
  <text x="304" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="10" fill="#9ca3af" text-anchor="end">
    GitWrapped
  </text>
</svg>`;
}

function generateErrorBadgeSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40">
  <rect width="200" height="40" rx="6" fill="#f3f4f6"/>
  <text x="100" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
    GitWrapped • User not found
  </text>
</svg>`;
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
