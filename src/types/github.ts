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
}

export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
    days: ContributionDay[];
}

export interface CommitActivity {
    week: number;
    total: number;
    days: number[];
}

export interface DayHourActivity {
    day: number;
    hour: number;
    count: number;
}

export interface MonthlyCommits {
    month: string;
    commits: number;
}

export interface UserStats {
    user: GitHubUser;
    repositories: Repository[];
    totalStars: number;
    totalForks: number;
    totalCommits: number;
    languageStats: LanguageStats[];
    contributionCalendar: ContributionWeek[];
    topRepositories: Repository[];
    monthlyCommits: MonthlyCommits[];
    codingSchedule: DayHourActivity[];
    longestStreak: number;
    currentStreak: number;
    mostActiveDay: string;
    mostActiveHour: number;
    accountAge: number;
    averageRepoSize: number;
}

export const LANGUAGE_COLORS: Record<string, string> = {
    JavaScript: "#f7df1e",
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
    Jupyter: "#DA5B0B",
};

export function getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || "#6b7280";
}
