/**
 * GitHub API Types
 * 
 * These types map directly to the GitHub REST API v3 responses.
 * Only fields that are actually available from the API are included.
 */

export interface GitHubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
}

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    topics: string[];
    fork: boolean;
}

export interface LanguageStats {
    language: string;
    bytes: number;
    percentage: number;
    color: string;
    isMarkup?: boolean;
}

/**
 * UserStats contains only data that can be verified from GitHub's public API.
 * 
 * Note: We intentionally do NOT include:
 * - Commit counts (requires authentication + pagination of all commits)
 * - Contribution calendar (requires GraphQL API or scraping)
 * - Coding schedule/hours (not available from public API)
 * - Streak data (would require commit history analysis)
 * 
 * These fields are either derived from real data or clearly marked as estimates.
 */
export interface UserStats {
    user: GitHubUser;
    repositories: Repository[];
    languageStats: LanguageStats[];

    // Direct from API - verifiable
    totalStars: number;
    totalForks: number;
    publicRepoCount: number;
    ownRepoCount: number;
    forkedRepoCount: number;

    // Derived from repository data
    topRepositories: Repository[];
    accountAgeYears: number;
    accountAgeMonths: number;

    // Activity insights based on repo dates
    recentlyActive: boolean;
    mostActiveYear: number | null;
    reposByYear: Record<number, number>;

    // Language insights
    topLanguage: string | null;
    topLanguagePercentage: number;
    languageDiversity: string;

    // Repository profile
    hasPopularRepo: boolean;
    mostStarredRepo: Repository | null;
}

// GitHub's linguist language colors
export const LANGUAGE_COLORS: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Ruby: "#701516",
    Swift: "#ffac45",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SCSS: "#c6538c",
    Vue: "#42b883",
    PHP: "#4F5D95",
    Shell: "#89e051",
    Dart: "#00B4AB",
    Lua: "#000080",
    Dockerfile: "#384d54",
    Makefile: "#427819",
    R: "#198CE7",
    Scala: "#c22d40",
    Haskell: "#5e5086",
    Elixir: "#6e4a7e",
    Clojure: "#db5855",
    Objective: "#438eff",
    Perl: "#0298c3",
};

export function getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || "#6b7280";
}
