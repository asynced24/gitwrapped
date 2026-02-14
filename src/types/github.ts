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
 * Language stats calculated by repo count instead of bytes
 */
export interface LanguageStatsByRepo {
    language: string;
    repoCount: number;
    percentage: number;
    color: string;
}

/**
 * Developer DNA - Tracks the "Lab Strand" (notebooks/experiments)
 * separate from the "Code Strand" (traditional programming).
 * Purely ratio-based, no archetype labels.
 */
export interface DeveloperDNA {
    notebookBytes: number;
    notebookRepoCount: number;
    labRatio: number; // 0-100, percentage of work in notebooks
    totalCodeBytes: number;
}

/**
 * DevOps Maturity - Analyzes CI/CD and infrastructure practices
 */
export interface DevOpsMaturity {
    score: number; // 0-100
    tier: 'code-shipper' | 'devops-curious' | 'pipeline-builder' | 'infrastructure-architect';
    signals: DevOpsSignal[];
    hasGitHubActions: boolean;
    hasDocker: boolean;
    hasKubernetes: boolean;
    hasTerraform: boolean;
}

export interface DevOpsSignal {
    type: string;
    label: string;
    icon: string;
    found: boolean;
    repoCount: number;
}

/**
 * Language Era - For the Archaeology feature
 * Tracks all languages used each year, not just dominant
 */
export interface LanguageEra {
    year: number;
    dominantLanguage: string;
    languageColor: string;
    repoCount: number;
    eraName: string;
    secondaryLanguages: { language: string; percentage: number }[];
    allLanguages: { language: string; bytes: number; percentage: number }[];
}

/**
 * Experience Tier - For real, context-aware motivational messaging
 */
export type ExperienceTier = 'pioneer' | 'veteran' | 'established' | 'rising' | 'newcomer';

export interface ExperienceProfile {
    tier: ExperienceTier;
    closingMessage: string;
    contextualMessage: string | null;
}

/**
 * Monthly Activity - tracks repo creation/update activity per month
 */
export interface MonthlyActivity {
    month: string;        // "2025-01" format
    reposCreated: number;
    reposPushed: number;
}

/**
 * Contribution Consistency - pattern of activity
 */
export interface ContributionConsistency {
    pattern: 'consistent' | 'burst' | 'sporadic' | 'inactive';
    activeMonths: number;
    totalMonths: number;
    longestGapDays: number;
}

/**
 * Code Health - Comprehensive code quality assessment
 */
export interface CodeHealth {
    overallScore: number; // 0-100
    tier: 'needs-work' | 'getting-there' | 'solid' | 'excellent';

    documentation: DocumentationScore;
    branching: BranchingScore;
    deployment: DeploymentScore;
    organization: OrganizationScore;
    testing: TestingScore;
    devOps: DevOpsMaturity;
}

export interface DocumentationScore {
    score: number;
    hasReadme: boolean;
    readmeQuality: 'none' | 'minimal' | 'good' | 'excellent';
    hasLicense: boolean;
    hasContributing: boolean;
    hasCodeOfConduct: boolean;
    reposWithReadme: number;
    totalReposChecked: number;
}

export interface BranchingScore {
    score: number;
    strategy: 'single-branch' | 'basic-branching' | 'feature-branches' | 'gitflow';
    avgBranchesPerRepo: number;
    reposWithMultipleBranches: number;
    totalBranches: number;
}

export interface DeploymentScore {
    score: number;
    platforms: DeploymentPlatform[];
    hasAnyDeployment: boolean;
    reposWithDeployment: number;
}

export interface DeploymentPlatform {
    name: string;
    icon: string;
    repoCount: number;
}

export interface OrganizationScore {
    score: number;
    hasGitignore: boolean;
    hasSrcFolder: boolean;
    hasTestsFolder: boolean;
    hasPackageManager: boolean;
    reposWellOrganized: number;
}

export interface TestingScore {
    score: number;
    hasTestFiles: boolean;
    hasTestConfig: boolean;
    reposWithTests: number;
}

/**
 * UserStats contains only data that can be verified from GitHub's public API.
 * 
 * Note: We intentionally do NOT include:
 * - Commit counts (requires authentication + pagination of all commits)
 * - Contribution calendar (requires GraphQL API or scraping)
 * - Coding schedule/hours (not available from public API)
 * - Streak data (would require commit history analysis)
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
    languageStatsByRepoCount: LanguageStatsByRepo[];

    // Repository profile
    hasPopularRepo: boolean;
    mostStarredRepo: Repository | null;

    // Developer DNA (Lab vs Code)
    developerDNA: DeveloperDNA;

    // DevOps Maturity
    devOpsMaturity: DevOpsMaturity;

    // Language Eras (for Archaeology)
    languageEras: LanguageEra[];

    // Code Health (dashboard feature)
    codeHealth: CodeHealth;

    // Experience Profile (motivational messaging)
    experienceProfile: ExperienceProfile;

    // Activity & Growth
    monthlyActivity: MonthlyActivity[];
    contributionConsistency: ContributionConsistency;

    // Development Profile
    developmentProfile: string;
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
};

export function getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || "#6b7280";
}
