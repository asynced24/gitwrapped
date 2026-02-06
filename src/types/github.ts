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
 * Developer DNA - Tracks the "Lab Strand" (notebooks/experiments)
 * separate from the "Code Strand" (traditional programming)
 */
export interface DeveloperDNA {
    // Lab Strand (Jupyter Notebooks)
    notebookBytes: number;
    notebookRepoCount: number;
    labRatio: number; // 0-100, percentage of work in notebooks
    labArchetype: 'production-focused' | 'hybrid' | 'research-oriented' | 'lab-scientist';

    // Code Strand (covered by languageStats)
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
 * Developer Superpowers - Pattern-based abilities detected from activity
 */
export interface Superpower {
    id: string;
    name: string;
    icon: string;
    description: string;
    strength: number; // 0-100
}

export interface DeveloperSuperpowers {
    primary: Superpower | null;
    secondary: Superpower[];
    archetype: string; // Final summary like "Nocturnal Polyglot Scientist"
}

/**
 * Language Era - For the Archaeology feature
 * Enhanced to track all languages used each year, not just dominant
 */
export interface LanguageEra {
    year: number;
    dominantLanguage: string;
    languageColor: string;
    repoCount: number;
    eraName: string;
    // NEW: Secondary languages used that year (>10% of year's bytes)
    secondaryLanguages: { language: string; percentage: number }[];
    // NEW: All languages used that year with percentages
    allLanguages: { language: string; bytes: number; percentage: number }[];
}

/**
 * Experience Tier - For real, context-aware motivational messaging
 */
export type ExperienceTier = 'pioneer' | 'veteran' | 'established' | 'rising' | 'newcomer';

export interface ExperienceProfile {
    tier: ExperienceTier;
    closingMessage: string;
    contextualMessage: string | null; // Additional context-based message
}

/**
 * Code Health - Comprehensive code quality assessment
 */
export interface CodeHealth {
    overallScore: number; // 0-100
    tier: 'needs-work' | 'getting-there' | 'solid' | 'excellent';

    // Individual category scores
    documentation: DocumentationScore;
    branching: BranchingScore;
    deployment: DeploymentScore;
    organization: OrganizationScore;
    testing: TestingScore;
    devOps: DevOpsMaturity; // Reuse existing
}

export interface DocumentationScore {
    score: number; // 0-100
    hasReadme: boolean;
    readmeQuality: 'none' | 'minimal' | 'good' | 'excellent';
    hasLicense: boolean;
    hasContributing: boolean;
    hasCodeOfConduct: boolean;
    reposWithReadme: number;
    totalReposChecked: number;
}

export interface BranchingScore {
    score: number; // 0-100
    strategy: 'single-branch' | 'basic-branching' | 'feature-branches' | 'gitflow';
    avgBranchesPerRepo: number;
    reposWithMultipleBranches: number;
    totalBranches: number;
}

export interface DeploymentScore {
    score: number; // 0-100
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
    score: number; // 0-100
    hasGitignore: boolean;
    hasSrcFolder: boolean;
    hasTestsFolder: boolean;
    hasPackageManager: boolean; // package.json, Cargo.toml, setup.py, etc.
    reposWellOrganized: number;
}

export interface TestingScore {
    score: number; // 0-100
    hasTestFiles: boolean;
    hasTestConfig: boolean; // jest.config, pytest.ini, etc.
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

    // Developer DNA (Lab vs Code)
    developerDNA: DeveloperDNA;

    // DevOps Maturity
    devOpsMaturity: DevOpsMaturity;

    // Superpowers
    superpowers: DeveloperSuperpowers;

    // Language Eras (for Archaeology)
    languageEras: LanguageEra[];

    // Code Health (dashboard feature)
    codeHealth: CodeHealth;

    // Experience Profile (motivational messaging)
    experienceProfile: ExperienceProfile;
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

