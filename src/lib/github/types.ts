/**
 * Raw snapshot of a GitHub profile: exactly what the API returned, normalised
 * but not interpreted. Everything the app shows is derived from this by the
 * pure functions in src/lib/analysis, so a snapshot saved to JSON fully
 * reproduces a dashboard or card.
 */

export interface RawUser {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    twitterUsername: string | null;
    createdAt: string;
    followers: number;
    following: number;
}

export interface RawRepo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    stars: number;
    forks: number;
    createdAt: string;
    pushedAt: string;
    sizeKb: number;
    archived: boolean;
    primaryLanguage: string | null;
    topics: string[];
    /**
     * Detail fields — only fetched for the most recently pushed repos
     * (see DETAILED_REPO_LIMIT). `null` means "not fetched", which is
     * different from "fetched and empty".
     */
    languages: Record<string, number> | null;
    /** Lower-cased names of entries at the repo root. */
    rootEntries: string[] | null;
    /** Lower-cased file names under .github/workflows. */
    workflowFiles: string[] | null;
}

export interface RawCalendarDay {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface RawContributions {
    total: number;
    commits: number;
    pullRequests: number;
    reviews: number;
    issues: number;
    /** Private contributions the user opted to count (no details exposed). */
    restricted: number;
    /** GitHub's calendar: weeks start on Sunday, oldest first. */
    weeks: RawCalendarDay[][];
}

export interface RawSnapshot {
    schemaVersion: 1;
    fetchedAt: string;
    user: RawUser;
    /**
     * Owned, public, non-fork repos. The first ones (up to 100, most recently
     * pushed) carry detail; any after that are the account's most starred
     * repos, fetched only for star/fork totals.
     */
    repos: RawRepo[];
    /** Total owned non-fork public repos on GitHub (may exceed repos.length). */
    repoTotal: number;
    forkTotal: number;
    /**
     * False when an account has so many starred repos that paging stopped
     * before reaching zero-star ones: star/fork totals are then a lower bound.
     */
    starTotalsComplete: boolean;
    contributions: RawContributions;
}
