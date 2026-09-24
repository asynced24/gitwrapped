/**
 * App-level types. Everything here is derived from a RawSnapshot
 * (src/lib/github/types.ts) by the pure functions in src/lib/analysis.
 */

import type { RawCalendarDay } from "@/lib/github/types";
import type { Passion } from "@/lib/passions";

export interface GitHubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    followers: number;
    following: number;
    created_at: string;
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
    created_at: string;
    pushed_at: string;
    size: number;
    topics: string[];
    archived: boolean;
}

export interface LanguageStats {
    language: string;
    bytes: number;
    percentage: number;
    color: string;
    isMarkup?: boolean;
}

/** Languages by number of repos where it is the primary language. */
export interface LanguageStatsByRepo {
    language: string;
    repoCount: number;
    percentage: number;
    color: string;
}

/** Notebook ("lab") work versus regular source code. */
export interface DeveloperDNA {
    notebookBytes: number;
    notebookRepoCount: number;
    labRatio: number; // 0-100, share of own repos whose primary language is Jupyter Notebook
    totalCodeBytes: number;
}

export interface LanguageEra {
    year: number;
    dominantLanguage: string;
    languageColor: string;
    repoCount: number;
    eraName: string;
    secondaryLanguages: { language: string; percentage: number }[];
    allLanguages: { language: string; bytes: number; percentage: number }[];
}

export type ExperienceTier = 'pioneer' | 'veteran' | 'established' | 'rising' | 'newcomer';

export interface ExperienceProfile {
    tier: ExperienceTier;
    closingMessage: string;
    contextualMessage: string | null;
}

/* ── Activity (from the GitHub contribution calendar, last 12 months) ── */

export type ActivityPattern = 'steady' | 'regular' | 'bursty' | 'quiet';

export interface MonthlyContributions {
    month: string; // "2026-01"
    count: number;
}

export interface ActivitySummary {
    total: number;
    commits: number;
    pullRequests: number;
    reviews: number;
    issues: number;
    /** Opted-in private contributions (count only). */
    restricted: number;
    activeDays: number;
    totalDays: number;
    activeWeeks: number;
    totalWeeks: number;
    currentStreak: number;
    longestStreak: number;
    bestDay: { date: string; count: number } | null;
    busiestWeekday: string | null;
    monthly: MonthlyContributions[];
    /** Calendar weeks (Sunday first), for the heatmap. */
    weeks: RawCalendarDay[][];
    pattern: ActivityPattern;
}

/* ── Engineering practices (share of analysed repos) ── */

export type PracticeKey = 'ci' | 'tests' | 'containers' | 'iac' | 'deploy' | 'license' | 'readme';

export interface PracticeSignal {
    key: PracticeKey;
    label: string;
    icon: string;
    repoCount: number;
    share: number; // 0-100
}

export interface PracticesSummary {
    analyzedRepos: number;
    signals: PracticeSignal[];
}

/**
 * Everything the dashboard, story, card and badge show about one user.
 * Produced only by analyzeSnapshot().
 */
export interface UserStats {
    fetchedAt: string;
    user: GitHubUser;
    /** Owned, public, non-fork repos, most recently pushed first. */
    repositories: Repository[];

    ownRepoCount: number;
    forkedRepoCount: number;
    /** Repos with language/tree detail (the most recently pushed ones). */
    analyzedRepoCount: number;
    maintainedRepoCount: number;

    /** Stars and forks on own non-fork repos only. */
    totalStars: number;
    /** False when star/fork totals are a lower bound (very large accounts). */
    starTotalsComplete: boolean;
    totalForks: number;
    topRepositories: Repository[];
    mostStarredRepo: Repository | null;
    hasPopularRepo: boolean;

    accountAgeYears: number;
    accountAgeMonths: number;
    recentlyActive: boolean;
    reposByYear: Record<number, number>;
    /** Year the user created the most repos. */
    mostActiveYear: number | null;

    languageStats: LanguageStats[];
    programmingLanguages: LanguageStats[];
    languageCount: number;
    languageStatsByRepoCount: LanguageStatsByRepo[];
    topLanguage: string | null;
    topLanguagePercentage: number;
    languageDiversity: string;
    languageEras: LanguageEra[];

    developerDNA: DeveloperDNA;
    practices: PracticesSummary;
    activity: ActivitySummary;
    experienceProfile: ExperienceProfile;
    developmentProfile: string;
    /** Passion edition earned from a repo about sport, music, games…, or null. */
    passion: Passion | null;
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
    "Jupyter Notebook": "#DA5B0B",
    "Objective-C": "#438eff",
    Zig: "#ec915c",
    Svelte: "#ff3e00",
    Astro: "#ff5a03",
    Lean: "#5a8ee6",
    HCL: "#844fba",
    Nix: "#7e7eff",
    Julia: "#a270ba",
    OCaml: "#ef7a08",
    Solidity: "#AA6746",
    Assembly: "#6E4C13",
    PowerShell: "#012456",
    Apex: "#1797c0",
};

export function getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || "#6b7280";
}
