import {
    GitHubUser,
    Repository,
    LanguageStats,
    UserStats,
    getLanguageColor,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

// Languages that are containers or markup, not actual programming languages
const CONTAINER_LANGUAGES = ["Jupyter Notebook"];
const MARKUP_LANGUAGES = ["HTML", "CSS", "Markdown", "SCSS", "Less"];

async function fetchGitHub<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`${GITHUB_API}${endpoint}`, {
        headers,
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }

    return res.json();
}

export async function fetchUser(username: string): Promise<GitHubUser> {
    return fetchGitHub<GitHubUser>(`/users/${username}`);
}

export async function fetchRepositories(username: string): Promise<Repository[]> {
    const repos: Repository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const pageRepos = await fetchGitHub<Repository[]>(
            `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`
        );

        repos.push(...pageRepos);

        if (pageRepos.length < perPage) break;
        page++;
        if (page > 10) break;
    }

    return repos;
}

export async function fetchRepoLanguages(
    owner: string,
    repo: string
): Promise<Record<string, number>> {
    try {
        return await fetchGitHub<Record<string, number>>(
            `/repos/${owner}/${repo}/languages`
        );
    } catch {
        return {};
    }
}

/**
 * Process language data from GitHub API.
 * 
 * Important: GitHub reports language data in bytes, which can be misleading.
 * Jupyter Notebooks inflate Python usage since they contain JSON + markdown.
 * We handle this by reassigning Jupyter bytes to Python.
 */
export function calculateLanguageStats(
    languageData: Record<string, number>[]
): LanguageStats[] {
    const aggregated: Record<string, number> = {};

    for (const repoLangs of languageData) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
            // Reassign Jupyter Notebook bytes to Python
            const normalizedLang = lang === "Jupyter Notebook" ? "Python" : lang;
            aggregated[normalizedLang] = (aggregated[normalizedLang] || 0) + bytes;
        }
    }

    const total = Object.values(aggregated).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const stats = Object.entries(aggregated)
        .map(([language, bytes]) => ({
            language,
            bytes,
            percentage: Math.round((bytes / total) * 1000) / 10,
            color: getLanguageColor(language),
            isMarkup: MARKUP_LANGUAGES.includes(language),
        }))
        .sort((a, b) => b.bytes - a.bytes);

    // Filter out languages with less than 0.5% for cleaner display
    return stats.filter(s => s.percentage >= 0.5);
}

/**
 * Get semantically meaningful "top language" for Wrapped mode.
 * Excludes markup languages to show actual programming languages.
 */
function getTopProgrammingLanguage(stats: LanguageStats[]): LanguageStats | null {
    return stats.find(s => !s.isMarkup) || stats[0] || null;
}

/**
 * Calculate account age in a human-readable format.
 */
function getAccountAge(createdAt: string): { years: number; months: number } {
    const created = new Date(createdAt);
    const now = new Date();

    const years = now.getFullYear() - created.getFullYear();
    const months = now.getMonth() - created.getMonth();

    const totalMonths = years * 12 + months;

    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
    };
}

/**
 * Get relative time description for when user was most active.
 * Based on repository push dates since that's what GitHub provides.
 */
function getActivityInsights(repositories: Repository[]): {
    recentlyActive: boolean;
    mostActiveYear: number | null;
    reposByYear: Record<number, number>;
} {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentlyActive = repositories.some(
        r => new Date(r.pushed_at) > thirtyDaysAgo
    );

    // Count repos created per year
    const reposByYear: Record<number, number> = {};
    for (const repo of repositories) {
        const year = new Date(repo.created_at).getFullYear();
        reposByYear[year] = (reposByYear[year] || 0) + 1;
    }

    // Find year with most repo creation
    let mostActiveYear: number | null = null;
    let maxRepos = 0;
    for (const [year, count] of Object.entries(reposByYear)) {
        if (count > maxRepos) {
            maxRepos = count;
            mostActiveYear = parseInt(year);
        }
    }

    return { recentlyActive, mostActiveYear, reposByYear };
}

/**
 * Get language diversity insight.
 */
function getLanguageDiversity(stats: LanguageStats[]): string {
    const programmingLangs = stats.filter(s => !s.isMarkup);
    const count = programmingLangs.length;

    if (count >= 8) return "polyglot";
    if (count >= 5) return "versatile";
    if (count >= 3) return "multi-language";
    if (count === 2) return "bilingual";
    return "focused";
}

/**
 * Determine repository focus based on stars and fork ratio.
 */
function getRepositoryProfile(repos: Repository[]): {
    totalStars: number;
    totalForks: number;
    ownRepos: Repository[];
    forkedRepos: Repository[];
    starredByOthers: number;
    hasPopularRepo: boolean;
    mostStarredRepo: Repository | null;
} {
    const ownRepos = repos.filter(r => !r.fork);
    const forkedRepos = repos.filter(r => r.fork);

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

    // Only count stars on own repos (not forks)
    const starredByOthers = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

    const sortedByStars = [...ownRepos].sort(
        (a, b) => b.stargazers_count - a.stargazers_count
    );

    const mostStarredRepo = sortedByStars[0] || null;
    const hasPopularRepo = mostStarredRepo && mostStarredRepo.stargazers_count >= 50;

    return {
        totalStars,
        totalForks,
        ownRepos,
        forkedRepos,
        starredByOthers,
        hasPopularRepo,
        mostStarredRepo,
    };
}

export async function fetchUserStats(username: string): Promise<UserStats> {
    const [user, repositories] = await Promise.all([
        fetchUser(username),
        fetchRepositories(username),
    ]);

    const repoProfile = getRepositoryProfile(repositories);

    // Fetch language data from top 20 own repos (by recent activity)
    const reposToAnalyze = repoProfile.ownRepos
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 20);

    const languagePromises = reposToAnalyze.map(
        repo => fetchRepoLanguages(username, repo.name)
    );

    const languageData = await Promise.all(languagePromises);
    const languageStats = calculateLanguageStats(languageData);

    const accountAge = getAccountAge(user.created_at);
    const activityInsights = getActivityInsights(repositories);
    const languageDiversity = getLanguageDiversity(languageStats);
    const topLanguage = getTopProgrammingLanguage(languageStats);

    return {
        user,
        repositories,
        languageStats,

        // Real, verifiable metrics from GitHub API
        totalStars: repoProfile.totalStars,
        totalForks: repoProfile.totalForks,
        publicRepoCount: user.public_repos,
        ownRepoCount: repoProfile.ownRepos.length,
        forkedRepoCount: repoProfile.forkedRepos.length,

        // Derived insights (clearly labeled as such)
        topRepositories: repoProfile.ownRepos
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6),

        accountAgeYears: accountAge.years,
        accountAgeMonths: accountAge.months,

        // Activity insights based on repo dates
        recentlyActive: activityInsights.recentlyActive,
        mostActiveYear: activityInsights.mostActiveYear,
        reposByYear: activityInsights.reposByYear,

        // Language insights
        topLanguage: topLanguage?.language || null,
        topLanguagePercentage: topLanguage?.percentage || 0,
        languageDiversity,

        // For the wrapped card
        hasPopularRepo: repoProfile.hasPopularRepo,
        mostStarredRepo: repoProfile.mostStarredRepo,
    };
}
