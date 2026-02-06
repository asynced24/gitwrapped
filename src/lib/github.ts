import {
    GitHubUser,
    Repository,
    LanguageStats,
    UserStats,
    DeveloperDNA,
    DevOpsMaturity,
    DevOpsSignal,
    DeveloperSuperpowers,
    Superpower,
    LanguageEra,
    CodeHealth,
    DocumentationScore,
    BranchingScore,
    DeploymentScore,
    OrganizationScore,
    TestingScore,
    DeploymentPlatform,
    ExperienceProfile,
    ExperienceTier,
    getLanguageColor,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

// Languages that are markup, not actual programming languages
const MARKUP_LANGUAGES = ["HTML", "CSS", "Markdown", "SCSS", "Less"];

// Era names for the Archaeology feature
const ERA_NAMES: Record<string, string> = {
    JavaScript: "The JavaScript Journey",
    TypeScript: "The TypeScript Empire",
    Python: "The Python Expedition",
    Java: "The Java Age",
    "C++": "The C++ Era",
    C: "The C Foundation",
    Rust: "The Rust Frontier",
    Go: "The Go Movement",
    Ruby: "The Ruby Rails",
    Swift: "The Swift Era",
    Kotlin: "The Kotlin Rise",
    PHP: "The PHP Chapter",
    default: "The Exploration",
};

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
 * Fetch repository contents to detect DevOps signals
 */
async function fetchRepoContents(owner: string, repo: string, path: string = ""): Promise<string[]> {
    try {
        const contents = await fetchGitHub<Array<{ name: string; type: string; path: string }>>(
            `/repos/${owner}/${repo}/contents/${path}`
        );
        return contents.map(c => c.name.toLowerCase());
    } catch {
        return [];
    }
}

/**
 * Process language data, tracking notebooks separately for Developer DNA
 */
export function calculateLanguageStats(
    languageData: Record<string, number>[]
): { stats: LanguageStats[]; notebookBytes: number; totalCodeBytes: number } {
    const aggregated: Record<string, number> = {};
    let notebookBytes = 0;
    let totalCodeBytes = 0;

    for (const repoLangs of languageData) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
            // Track Jupyter Notebooks separately (Lab Strand)
            if (lang === "Jupyter Notebook") {
                notebookBytes += bytes;
                continue;
            }

            aggregated[lang] = (aggregated[lang] || 0) + bytes;
            totalCodeBytes += bytes;
        }
    }

    const total = Object.values(aggregated).reduce((a, b) => a + b, 0);
    if (total === 0) return { stats: [], notebookBytes, totalCodeBytes };

    const stats = Object.entries(aggregated)
        .map(([language, bytes]) => ({
            language,
            bytes,
            percentage: Math.round((bytes / total) * 1000) / 10,
            color: getLanguageColor(language),
            isMarkup: MARKUP_LANGUAGES.includes(language),
        }))
        .sort((a, b) => b.bytes - a.bytes);

    return {
        stats: stats.filter(s => s.percentage >= 0.5),
        notebookBytes,
        totalCodeBytes,
    };
}

/**
 * Calculate Developer DNA - the Lab vs Code balance
 */
function calculateDeveloperDNA(
    notebookBytes: number,
    totalCodeBytes: number,
    repos: Repository[]
): DeveloperDNA {
    const totalBytes = notebookBytes + totalCodeBytes;
    const labRatio = totalBytes > 0 ? Math.round((notebookBytes / totalBytes) * 100) : 0;

    // Count repos with Jupyter as primary language
    const notebookRepoCount = repos.filter(r => r.language === "Jupyter Notebook").length;

    let labArchetype: DeveloperDNA['labArchetype'];
    if (labRatio >= 50) labArchetype = 'lab-scientist';
    else if (labRatio >= 30) labArchetype = 'research-oriented';
    else if (labRatio >= 10) labArchetype = 'hybrid';
    else labArchetype = 'production-focused';

    return {
        notebookBytes,
        notebookRepoCount,
        labRatio,
        labArchetype,
        totalCodeBytes,
    };
}

/**
 * Analyze DevOps maturity by checking for CI/CD and infrastructure files
 */
async function analyzeDevOpsMaturity(
    username: string,
    repos: Repository[]
): Promise<DevOpsMaturity> {
    const signals: DevOpsSignal[] = [
        { type: 'github-actions', label: 'GitHub Actions', icon: '🔄', found: false, repoCount: 0 },
        { type: 'docker', label: 'Docker', icon: '🐳', found: false, repoCount: 0 },
        { type: 'kubernetes', label: 'Kubernetes', icon: '☸️', found: false, repoCount: 0 },
        { type: 'terraform', label: 'Terraform/IaC', icon: '🏗️', found: false, repoCount: 0 },
        { type: 'ci-cd', label: 'CI/CD Config', icon: '📦', found: false, repoCount: 0 },
        { type: 'makefile', label: 'Makefile', icon: '📋', found: false, repoCount: 0 },
    ];

    // Check top 10 most active repos for DevOps signals
    const reposToCheck = repos
        .filter(r => !r.fork)
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 10);

    for (const repo of reposToCheck) {
        try {
            const rootContents = await fetchRepoContents(username, repo.name);

            // Check for various DevOps signals
            if (rootContents.includes('.github')) {
                const githubContents = await fetchRepoContents(username, repo.name, '.github');
                if (githubContents.includes('workflows')) {
                    signals[0].found = true;
                    signals[0].repoCount++;
                }
            }

            if (rootContents.includes('dockerfile') || rootContents.includes('docker-compose.yml') || rootContents.includes('docker-compose.yaml')) {
                signals[1].found = true;
                signals[1].repoCount++;
            }

            if (rootContents.some(f => f.includes('k8s') || f.includes('kubernetes') || f.includes('helm'))) {
                signals[2].found = true;
                signals[2].repoCount++;
            }

            if (rootContents.some(f => f.endsWith('.tf')) || rootContents.includes('terraform')) {
                signals[3].found = true;
                signals[3].repoCount++;
            }

            if (rootContents.some(f => ['.travis.yml', 'jenkinsfile', '.gitlab-ci.yml', '.circleci'].includes(f))) {
                signals[4].found = true;
                signals[4].repoCount++;
            }

            if (rootContents.includes('makefile')) {
                signals[5].found = true;
                signals[5].repoCount++;
            }
        } catch {
            // Skip repos we can't access
            continue;
        }
    }

    // Calculate score
    let score = 0;
    if (signals[0].found) score += 25; // GitHub Actions
    if (signals[1].found) score += 20; // Docker
    if (signals[2].found) score += 20; // Kubernetes
    if (signals[3].found) score += 15; // Terraform
    if (signals[4].found) score += 10; // Other CI/CD
    if (signals[5].found) score += 10; // Makefile

    let tier: DevOpsMaturity['tier'];
    if (score >= 70) tier = 'infrastructure-architect';
    else if (score >= 45) tier = 'pipeline-builder';
    else if (score >= 20) tier = 'devops-curious';
    else tier = 'code-shipper';

    return {
        score,
        tier,
        signals,
        hasGitHubActions: signals[0].found,
        hasDocker: signals[1].found,
        hasKubernetes: signals[2].found,
        hasTerraform: signals[3].found,
    };
}

/**
 * Detect developer superpowers based on patterns
 */
function detectSuperpowers(
    stats: LanguageStats[],
    repos: Repository[],
    dna: DeveloperDNA,
    devOps: DevOpsMaturity
): DeveloperSuperpowers {
    const superpowers: Superpower[] = [];

    // Polyglot: Uses 5+ programming languages
    const programmingLangs = stats.filter(s => !s.isMarkup);
    if (programmingLangs.length >= 5) {
        superpowers.push({
            id: 'polyglot',
            name: 'Polyglot',
            icon: '🧬',
            description: `Fluent in ${programmingLangs.length} languages`,
            strength: Math.min(100, programmingLangs.length * 12),
        });
    }

    // Lab Scientist: High notebook ratio
    if (dna.labRatio >= 20) {
        superpowers.push({
            id: 'lab-scientist',
            name: 'Research & Experimentation',
            icon: '🔬',
            description: `${dna.notebookRepoCount} notebooks — experiments before shipping`,
            strength: Math.min(100, dna.labRatio * 2),
        });
    }

    // DevOps Hero: High DevOps score
    if (devOps.score >= 40) {
        superpowers.push({
            id: 'devops-hero',
            name: 'Infrastructure Architect',
            icon: '🔧',
            description: 'Automates infrastructure & shipping',
            strength: devOps.score,
        });
    }

    // Star Magnet: Has repos with many stars
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    if (totalStars >= 100) {
        superpowers.push({
            id: 'star-magnet',
            name: 'Star Magnet',
            icon: '⭐',
            description: `${totalStars.toLocaleString()} stars earned`,
            strength: Math.min(100, Math.log10(totalStars) * 25),
        });
    }

    // Open Source Champion: Many non-fork repos
    const ownRepos = repos.filter(r => !r.fork);
    if (ownRepos.length >= 20) {
        superpowers.push({
            id: 'open-source-champion',
            name: 'Open Source Champion',
            icon: '🌍',
            description: `${ownRepos.length} original projects created`,
            strength: Math.min(100, ownRepos.length * 4),
        });
    }

    // Tool Builder: Has CLI, library, or framework repos
    const toolPatterns = ['cli', 'lib', 'sdk', 'api', 'framework', 'plugin', 'extension'];
    const toolRepos = repos.filter(r =>
        toolPatterns.some(p => r.name.toLowerCase().includes(p) || (r.description?.toLowerCase() || '').includes(p))
    );
    if (toolRepos.length >= 2) {
        superpowers.push({
            id: 'tool-builder',
            name: 'Tool Builder',
            icon: '🔧',
            description: `Creates tools others depend on`,
            strength: Math.min(100, toolRepos.length * 20),
        });
    }

    // Sort by strength
    superpowers.sort((a, b) => b.strength - a.strength);

    // Generate archetype
    const archetypeParts: string[] = [];
    if (superpowers.find(s => s.id === 'polyglot')) archetypeParts.push('Polyglot');
    if (superpowers.find(s => s.id === 'lab-scientist')) archetypeParts.push('Researcher');
    if (superpowers.find(s => s.id === 'devops-hero')) archetypeParts.push('Infrastructure & Ops');
    if (superpowers.find(s => s.id === 'star-magnet')) archetypeParts.push('Star Collector');
    if (superpowers.find(s => s.id === 'open-source-champion')) archetypeParts.push('Open Source Builder');
    if (superpowers.find(s => s.id === 'tool-builder')) archetypeParts.push('Tool Maker');

    const archetype = archetypeParts.length > 0
        ? archetypeParts.slice(0, 2).join(' ')
        : 'Code Explorer';

    return {
        primary: superpowers[0] || null,
        secondary: superpowers.slice(1),
        archetype,
    };
}

/**
 * Analyze language eras for the Archaeology feature
 * Enhanced to track ALL languages used each year, not just dominant
 */
function analyzeLanguageEras(
    repos: Repository[],
    languageData: Record<string, number>[]
): LanguageEra[] {
    // Group repos by year and track ALL languages with bytes
    const yearData: Record<number, { repos: Repository[]; languages: Record<string, number> }> = {};

    repos.forEach((repo, index) => {
        const year = new Date(repo.created_at).getFullYear();
        if (!yearData[year]) {
            yearData[year] = { repos: [], languages: {} };
        }
        yearData[year].repos.push(repo);

        // Add ALL language data from the corresponding repo
        if (languageData[index]) {
            for (const [lang, bytes] of Object.entries(languageData[index])) {
                // Skip Jupyter Notebook for era naming but we could track it separately
                if (lang !== "Jupyter Notebook") {
                    yearData[year].languages[lang] = (yearData[year].languages[lang] || 0) + bytes;
                }
            }
        }
    });

    const eras: LanguageEra[] = [];

    for (const [year, data] of Object.entries(yearData).sort((a, b) => Number(a[0]) - Number(b[0]))) {
        const entries = Object.entries(data.languages);
        if (entries.length === 0) continue;

        // Calculate total bytes for this year
        const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

        // Sort by bytes descending
        const sortedLangs = entries.sort((a, b) => b[1] - a[1]);
        const [dominantLanguage] = sortedLangs[0];

        // Calculate all languages with percentages
        const allLanguages = sortedLangs.map(([language, bytes]) => ({
            language,
            bytes,
            percentage: Math.round((bytes / totalBytes) * 100),
        }));

        // Secondary languages are those with >10% share (excluding dominant)
        const secondaryLanguages = allLanguages
            .filter((l, i) => i > 0 && l.percentage >= 10)
            .map(({ language, percentage }) => ({ language, percentage }));

        eras.push({
            year: Number(year),
            dominantLanguage,
            languageColor: getLanguageColor(dominantLanguage),
            repoCount: data.repos.length,
            eraName: ERA_NAMES[dominantLanguage] || ERA_NAMES.default,
            secondaryLanguages,
            allLanguages,
        });
    }

    return eras;
}

/**
 * Get semantically meaningful "top language" for Wrapped mode.
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
 * Get activity insights based on repository dates.
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

    const reposByYear: Record<number, number> = {};
    for (const repo of repositories) {
        const year = new Date(repo.created_at).getFullYear();
        reposByYear[year] = (reposByYear[year] || 0) + 1;
    }

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

/**
 * Calculate experience profile for motivational messaging
 * Based on real, defensible metrics
 */
function calculateExperienceProfile(
    accountAgeYears: number,
    repoCount: number,
    totalStars: number,
    languageDiversity: string,
    recentlyActive: boolean,
    hasPopularRepo: boolean
): ExperienceProfile {
    // Determine experience tier
    let tier: ExperienceTier;

    if (accountAgeYears >= 7 && repoCount >= 50) {
        tier = 'pioneer';
    } else if (accountAgeYears >= 5 && repoCount >= 30) {
        tier = 'veteran';
    } else if (accountAgeYears >= 3 && repoCount >= 15) {
        tier = 'established';
    } else if (accountAgeYears >= 1 && repoCount >= 5) {
        tier = 'rising';
    } else {
        tier = 'newcomer';
    }

    // Closing messages by tier
    const CLOSING_MESSAGES: Record<ExperienceTier, string> = {
        'pioneer': "You walked so others could run.",
        'veteran': "Your journey is a roadmap for others.",
        'established': "You've built a foundation worth building on.",
        'rising': "Every repository is a step forward.",
        'newcomer': "The first commit is always the hardest. You did it.",
    };

    // Contextual messages based on additional signals
    let contextualMessage: string | null = null;

    if (totalStars >= 1000) {
        contextualMessage = "Your work resonates with developers worldwide.";
    } else if (totalStars >= 100) {
        contextualMessage = "Your code has found its audience.";
    } else if (languageDiversity === 'polyglot') {
        contextualMessage = "Languages change. Your curiosity doesn't.";
    } else if (hasPopularRepo) {
        contextualMessage = "You've built something people want.";
    } else if (!recentlyActive && accountAgeYears >= 2) {
        contextualMessage = "Welcome back. The code missed you.";
    } else if (recentlyActive) {
        contextualMessage = "Still shipping. Still growing.";
    }

    return {
        tier,
        closingMessage: CLOSING_MESSAGES[tier],
        contextualMessage,
    };
}

// =============================================================================
// CODE HEALTH ANALYSIS
// =============================================================================

/**
 * Analyze documentation quality across repositories
 */
async function analyzeDocumentation(
    username: string,
    repos: Repository[]
): Promise<DocumentationScore> {
    let reposWithReadme = 0;
    let hasLicense = false;
    let hasContributing = false;
    let hasCodeOfConduct = false;
    let totalReadmeLength = 0;

    // Check a sample of repos (limit API calls)
    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
        const files = await fetchRepoContents(username, repo.name);

        if (files.some(f => f === 'readme.md' || f === 'readme.txt' || f === 'readme')) {
            reposWithReadme++;
        }
        if (files.some(f => f.startsWith('license'))) {
            hasLicense = true;
        }
        if (files.some(f => f === 'contributing.md')) {
            hasContributing = true;
        }
        if (files.some(f => f === 'code_of_conduct.md')) {
            hasCodeOfConduct = true;
        }
    }

    // Calculate documentation score
    const readmeRatio = reposToCheck.length > 0 ? reposWithReadme / reposToCheck.length : 0;
    let score = readmeRatio * 50; // 50 points for README coverage
    if (hasLicense) score += 20;
    if (hasContributing) score += 15;
    if (hasCodeOfConduct) score += 15;

    // Determine README quality
    let readmeQuality: 'none' | 'minimal' | 'good' | 'excellent' = 'none';
    if (readmeRatio >= 0.9) readmeQuality = 'excellent';
    else if (readmeRatio >= 0.7) readmeQuality = 'good';
    else if (readmeRatio >= 0.3) readmeQuality = 'minimal';

    return {
        score: Math.round(score),
        hasReadme: reposWithReadme > 0,
        readmeQuality,
        hasLicense,
        hasContributing,
        hasCodeOfConduct,
        reposWithReadme,
        totalReposChecked: reposToCheck.length,
    };
}

/**
 * Fetch README content for a repository
 */
async function fetchReadmeContent(username: string, repo: string): Promise<string> {
    try {
        const data = await fetchGitHub<{ content: string; encoding: string }>(
            `/repos/${username}/${repo}/readme`
        );
        if (data.encoding === 'base64') {
            return atob(data.content);
        }
        return '';
    } catch {
        return '';
    }
}

/**
 * Analyze README quality and give it a score
 */
export async function analyzeReadme(
    username: string,
    repo: string
): Promise<{ score: number; strengths: string[]; improvementAreas: string[] }> {
    const readme = await fetchReadmeContent(username, repo);

    if (!readme) {
        return {
            score: 0,
            strengths: [],
            improvementAreas: ['Create a README.md file to document your project']
        };
    }

    let score = 0;
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    // Length check (is it substantial?)
    if (readme.length > 2000) {
        score += 20;
        strengths.push('Comprehensive documentation length');
    } else if (readme.length > 500) {
        score += 10;
    } else {
        improvementAreas.push('Expand documentation length');
    }

    // Key Sections Check
    const lowerReadme = readme.toLowerCase();

    // Installation / Usage
    if (lowerReadme.includes('install') || lowerReadme.includes('setup') || lowerReadme.includes('usage') || lowerReadme.includes('getting started')) {
        score += 20;
        strengths.push('Clear installation/usage instructions');
    } else {
        improvementAreas.push('Add Installation or Usage sections');
    }

    // Code blocks
    if (readme.includes('```')) {
        score += 15;
        strengths.push('Includes code examples');
    }

    // Headers hierarchy
    if (readme.includes('# ') && readme.includes('## ')) {
        score += 15;
        strengths.push('Good document structure');
    }

    // Images/Badges
    if (readme.includes('![') || lowerReadme.includes('<img')) {
        score += 15;
        strengths.push('Visuals/badges included');
    } else {
        improvementAreas.push('Add screenshots or badges');
    }

    // Contributing/License mentions
    if (lowerReadme.includes('contributing') || lowerReadme.includes('license')) {
        score += 15;
        strengths.push('Community/License info present');
    }

    return {
        score: Math.min(100, score),
        strengths,
        improvementAreas
    };
}

/**
 * Analyze branching strategy
 */
async function analyzeBranching(
    username: string,
    repos: Repository[]
): Promise<BranchingScore> {
    let totalBranches = 0;
    let reposWithMultipleBranches = 0;

    // Check a sample of repos
    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
        try {
            const branches = await fetchGitHub<Array<{ name: string }>>(
                `/repos/${username}/${repo.name}/branches`
            );
            const branchCount = branches.length;
            totalBranches += branchCount;
            if (branchCount > 1) {
                reposWithMultipleBranches++;
            }
        } catch {
            // Skip if can't fetch branches
        }
    }

    const avgBranches = reposToCheck.length > 0 ? totalBranches / reposToCheck.length : 0;

    // Determine strategy
    let strategy: 'single-branch' | 'basic-branching' | 'feature-branches' | 'gitflow' = 'single-branch';
    if (avgBranches >= 4) strategy = 'gitflow';
    else if (avgBranches >= 2.5) strategy = 'feature-branches';
    else if (avgBranches > 1) strategy = 'basic-branching';

    // Calculate score
    const branchRatio = reposToCheck.length > 0 ? reposWithMultipleBranches / reposToCheck.length : 0;
    const score = Math.min(100, Math.round(branchRatio * 60 + Math.min(avgBranches * 10, 40)));

    return {
        score,
        strategy,
        avgBranchesPerRepo: Math.round(avgBranches * 10) / 10,
        reposWithMultipleBranches,
        totalBranches,
    };
}

/**
 * Detect deployment platforms
 */
async function analyzeDeployment(
    username: string,
    repos: Repository[]
): Promise<DeploymentScore> {
    const platformCounts: Record<string, number> = {};
    let reposWithDeployment = 0;

    const DEPLOY_SIGNALS: Record<string, { files: string[]; icon: string }> = {
        'Vercel': { files: ['vercel.json', '.vercel'], icon: '▲' },
        'Netlify': { files: ['netlify.toml', '_redirects'], icon: '◈' },
        'Railway': { files: ['railway.json', 'railway.toml'], icon: '🚂' },
        'Heroku': { files: ['heroku.yml', 'Procfile', 'app.json'], icon: '🟣' },
        'Fly.io': { files: ['fly.toml'], icon: '🪁' },
        'Docker': { files: ['dockerfile', 'docker-compose.yml', 'docker-compose.yaml'], icon: '🐳' },
        'AWS': { files: ['serverless.yml', 'sam.yaml', '.aws'], icon: '☁️' },
        'Firebase': { files: ['firebase.json', '.firebaserc'], icon: '🔥' },
    };

    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
        const files = await fetchRepoContents(username, repo.name);
        let hasDeployment = false;

        for (const [platform, config] of Object.entries(DEPLOY_SIGNALS)) {
            if (config.files.some(f => files.includes(f.toLowerCase()))) {
                platformCounts[platform] = (platformCounts[platform] || 0) + 1;
                hasDeployment = true;
            }
        }

        if (hasDeployment) {
            reposWithDeployment++;
        }
    }

    // Build platforms array
    const platforms: DeploymentPlatform[] = Object.entries(platformCounts)
        .map(([name, repoCount]) => ({
            name,
            icon: DEPLOY_SIGNALS[name]?.icon || '🚀',
            repoCount,
        }))
        .sort((a, b) => b.repoCount - a.repoCount);

    const hasAnyDeployment = platforms.length > 0;
    const deployRatio = reposToCheck.length > 0 ? reposWithDeployment / reposToCheck.length : 0;
    const score = Math.round(deployRatio * 70 + (platforms.length > 0 ? 30 : 0));

    return {
        score,
        platforms,
        hasAnyDeployment,
        reposWithDeployment,
    };
}

/**
 * Analyze code organization
 */
async function analyzeOrganization(
    username: string,
    repos: Repository[]
): Promise<OrganizationScore> {
    let hasGitignore = false;
    let hasSrcFolder = false;
    let hasTestsFolder = false;
    let hasPackageManager = false;
    let reposWellOrganized = 0;

    const PACKAGE_FILES = ['package.json', 'cargo.toml', 'setup.py', 'go.mod', 'pom.xml', 'build.gradle'];
    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
        const files = await fetchRepoContents(username, repo.name);
        let orgScore = 0;

        if (files.includes('.gitignore')) {
            hasGitignore = true;
            orgScore++;
        }
        if (files.includes('src') || files.includes('lib') || files.includes('app')) {
            hasSrcFolder = true;
            orgScore++;
        }
        if (files.some(f => f.includes('test') || f === 'tests' || f === '__tests__' || f === 'spec')) {
            hasTestsFolder = true;
            orgScore++;
        }
        if (PACKAGE_FILES.some(pf => files.includes(pf.toLowerCase()))) {
            hasPackageManager = true;
            orgScore++;
        }

        if (orgScore >= 2) {
            reposWellOrganized++;
        }
    }

    const orgRatio = reposToCheck.length > 0 ? reposWellOrganized / reposToCheck.length : 0;
    let score = Math.round(orgRatio * 60);
    if (hasGitignore) score += 10;
    if (hasSrcFolder) score += 10;
    if (hasTestsFolder) score += 10;
    if (hasPackageManager) score += 10;
    score = Math.min(100, score);

    return {
        score,
        hasGitignore,
        hasSrcFolder,
        hasTestsFolder,
        hasPackageManager,
        reposWellOrganized,
    };
}

/**
 * Analyze testing practices
 */
async function analyzeTesting(
    username: string,
    repos: Repository[]
): Promise<TestingScore> {
    let hasTestFiles = false;
    let hasTestConfig = false;
    let reposWithTests = 0;

    const TEST_CONFIGS = ['jest.config.js', 'jest.config.ts', 'pytest.ini', 'setup.cfg', 'vitest.config.ts', 'karma.conf.js'];
    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
        const files = await fetchRepoContents(username, repo.name);
        let foundTests = false;

        // Check for test folders or files
        if (files.some(f => f.includes('test') || f === 'tests' || f === '__tests__' || f === 'spec')) {
            hasTestFiles = true;
            foundTests = true;
        }

        // Check for test config files
        if (TEST_CONFIGS.some(tc => files.includes(tc.toLowerCase()))) {
            hasTestConfig = true;
            foundTests = true;
        }

        if (foundTests) {
            reposWithTests++;
        }
    }

    const testRatio = reposToCheck.length > 0 ? reposWithTests / reposToCheck.length : 0;
    let score = Math.round(testRatio * 70);
    if (hasTestFiles) score += 15;
    if (hasTestConfig) score += 15;
    score = Math.min(100, score);

    return {
        score,
        hasTestFiles,
        hasTestConfig,
        reposWithTests,
    };
}

/**
 * Calculate overall Code Health
 */
async function analyzeCodeHealth(
    username: string,
    repos: Repository[],
    devOpsMaturity: DevOpsMaturity
): Promise<CodeHealth> {
    const ownRepos = repos.filter(r => !r.fork);

    // Run all analyses in parallel
    const [documentation, branching, deployment, organization, testing] = await Promise.all([
        analyzeDocumentation(username, ownRepos),
        analyzeBranching(username, ownRepos),
        analyzeDeployment(username, ownRepos),
        analyzeOrganization(username, ownRepos),
        analyzeTesting(username, ownRepos),
    ]);

    // Calculate weighted overall score
    const overallScore = Math.round(
        documentation.score * 0.20 +
        branching.score * 0.15 +
        deployment.score * 0.15 +
        organization.score * 0.15 +
        testing.score * 0.15 +
        devOpsMaturity.score * 0.20
    );

    // Determine tier
    let tier: 'needs-work' | 'getting-there' | 'solid' | 'excellent' = 'needs-work';
    if (overallScore >= 80) tier = 'excellent';
    else if (overallScore >= 60) tier = 'solid';
    else if (overallScore >= 40) tier = 'getting-there';

    return {
        overallScore,
        tier,
        documentation,
        branching,
        deployment,
        organization,
        testing,
        devOps: devOpsMaturity,
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
    const { stats: languageStats, notebookBytes, totalCodeBytes } = calculateLanguageStats(languageData);

    const accountAge = getAccountAge(user.created_at);
    const activityInsights = getActivityInsights(repositories);
    const languageDiversity = getLanguageDiversity(languageStats);
    const topLanguage = getTopProgrammingLanguage(languageStats);

    // NEW: Calculate Developer DNA (Lab vs Code)
    const developerDNA = calculateDeveloperDNA(notebookBytes, totalCodeBytes, repositories);

    // NEW: Analyze DevOps maturity
    const devOpsMaturity = await analyzeDevOpsMaturity(username, repoProfile.ownRepos);

    // NEW: Detect superpowers
    const superpowers = detectSuperpowers(languageStats, repositories, developerDNA, devOpsMaturity);

    // NEW: Analyze language eras
    const languageEras = analyzeLanguageEras(reposToAnalyze, languageData);

    // NEW: Analyze Code Health (comprehensive quality metrics)
    const codeHealth = await analyzeCodeHealth(username, repositories, devOpsMaturity);

    // NEW: Calculate experience profile for motivational messaging
    const experienceProfile = calculateExperienceProfile(
        accountAge.years,
        repoProfile.ownRepos.length,
        repoProfile.totalStars,
        languageDiversity,
        activityInsights.recentlyActive,
        repoProfile.hasPopularRepo
    );

    // NEW: Analyze README for the most popular repo
    let readmeAnalysis = null;
    if (repoProfile.mostStarredRepo) {
        readmeAnalysis = await analyzeReadme(username, repoProfile.mostStarredRepo.name);
    }

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

        // Derived insights
        topRepositories: repoProfile.ownRepos
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6),

        accountAgeYears: accountAge.years,
        accountAgeMonths: accountAge.months,

        // Activity insights
        recentlyActive: activityInsights.recentlyActive,
        mostActiveYear: activityInsights.mostActiveYear,
        reposByYear: activityInsights.reposByYear,

        // Language insights
        topLanguage: topLanguage?.language || null,
        topLanguagePercentage: topLanguage?.percentage || 0,
        languageDiversity,

        // Repository profile
        hasPopularRepo: repoProfile.hasPopularRepo,
        mostStarredRepo: repoProfile.mostStarredRepo,

        // Enhanced insights
        developerDNA,
        devOpsMaturity,
        superpowers,
        languageEras,

        // Code Health (dashboard feature)
        codeHealth,

        // Experience Profile (motivational messaging)
        experienceProfile,

        // README Analysis
        readmeAnalysis,
    };
}

