import { UserStats } from "@/types/github";
import { fetchUserStats } from "./github";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface Attack {
    name: string;
    description: string;
    damage: number;
    energyCost: number;
}

export interface Ability {
    name: string;
    description: string;
}

export interface TypeMatchup {
    type: string;
    modifier: string; // "×2" or "-30"
}

export type EvolutionStage = "BASIC" | "STAGE 1" | "STAGE 2";

export interface PokemonCardData {
    username: string;
    name: string;
    avatarUrl: string;
    bio: string;
    location: string;
    hp: number;
    topLanguage: string;
    accountAgeYears: number;
    evolutionStage: EvolutionStage;
    programmingLanguageCount: number;
    ability: Ability;
    attack1: Attack;
    attack2: Attack;
    weakness: TypeMatchup;
    resistance: TypeMatchup;
    retreatCost: number;
    xp: number;
    codeVelocity: number;
}

/* ─────────────────────────────────────────────
   Language → Pokémon Type mapping
   ───────────────────────────────────────────── */

export interface LanguageCardTheme {
    type: string;
    borderColor: string;
    accentColor: string;
    emoji: string;
    attacks: {
        light: { name: string; description: string };
        heavy: { name: string; description: string };
    };
}

export const LANGUAGE_CARD_THEMES: Record<string, LanguageCardTheme> = {
    Python: {
        type: "Fire",
        borderColor: "#E25822",
        accentColor: "#FF6B35",
        emoji: "🔥",
        attacks: {
            light: { name: "Flame Script", description: "Executes a blazing runtime sequence" },
            heavy: { name: "Inferno Deploy", description: "Deploys a firestorm of production builds" },
        },
    },
    TypeScript: {
        type: "Electric",
        borderColor: "#3178C6",
        accentColor: "#58A6FF",
        emoji: "⚡",
        attacks: {
            light: { name: "Type Strike", description: "Compiles with strict type checking" },
            heavy: { name: "Thunder Compile", description: "Unleashes a storm of type definitions" },
        },
    },
    JavaScript: {
        type: "Electric",
        borderColor: "#F0DB4F",
        accentColor: "#F7E05A",
        emoji: "⚡",
        attacks: {
            light: { name: "Callback Surge", description: "Chains async operations rapidly" },
            heavy: { name: "Runtime Storm", description: "Floods the event loop with promises" },
        },
    },
    Go: {
        type: "Water",
        borderColor: "#00ADD8",
        accentColor: "#29BEB0",
        emoji: "💧",
        attacks: {
            light: { name: "Goroutine Flow", description: "Spawns concurrent execution streams" },
            heavy: { name: "Channel Torrent", description: "Cascades data through pipelines" },
        },
    },
    Rust: {
        type: "Steel",
        borderColor: "#DEA584",
        accentColor: "#E8A87C",
        emoji: "⚙️",
        attacks: {
            light: { name: "Borrow Check", description: "Validates memory safety at compile time" },
            heavy: { name: "Unsafe Smelt", description: "Forges raw pointer operations" },
        },
    },
    Java: {
        type: "Ground",
        borderColor: "#B07219",
        accentColor: "#C98B2E",
        emoji: "🪨",
        attacks: {
            light: { name: "Garbage Collect", description: "Reclaims unused memory automatically" },
            heavy: { name: "Seismic Build", description: "Quakes with enterprise-scale deployments" },
        },
    },
    "C++": {
        type: "Dragon",
        borderColor: "#F34B7D",
        accentColor: "#FF6B9D",
        emoji: "🐉",
        attacks: {
            light: { name: "Pointer Strike", description: "Manipulates memory addresses directly" },
            heavy: { name: "Template Fury", description: "Generates compile-time metaprograms" },
        },
    },
    C: {
        type: "Normal",
        borderColor: "#555555",
        accentColor: "#777777",
        emoji: "⚪",
        attacks: {
            light: { name: "Memory Alloc", description: "Reserves raw memory blocks" },
            heavy: { name: "System Call", description: "Invokes kernel-level operations" },
        },
    },
    "C#": {
        type: "Psychic",
        borderColor: "#178600",
        accentColor: "#68A357",
        emoji: "🔮",
        attacks: {
            light: { name: "LINQ Pulse", description: "Queries data with mental clarity" },
            heavy: { name: "Abstract Crush", description: "Manifests complex inheritance hierarchies" },
        },
    },
    Ruby: {
        type: "Fairy",
        borderColor: "#CC342D",
        accentColor: "#E05A4F",
        emoji: "✨",
        attacks: {
            light: { name: "Gem Sparkle", description: "Conjures elegant metaprogramming" },
            heavy: { name: "Magic Method", description: "Enchants objects with dynamic behavior" },
        },
    },
    Swift: {
        type: "Flying",
        borderColor: "#F05138",
        accentColor: "#FF6B52",
        emoji: "🕊️",
        attacks: {
            light: { name: "Protocol Wing", description: "Soars with interface conformance" },
            heavy: { name: "Unwrap Dive", description: "Strikes through optional bindings" },
        },
    },
    Kotlin: {
        type: "Ghost",
        borderColor: "#A97BFF",
        accentColor: "#B98EFF",
        emoji: "👻",
        attacks: {
            light: { name: "Null Safety", description: "Phases through nullable references" },
            heavy: { name: "Coroutine Haunt", description: "Suspends execution in the shadows" },
        },
    },
    PHP: {
        type: "Poison",
        borderColor: "#777BB4",
        accentColor: "#9B9ECE",
        emoji: "☠️",
        attacks: {
            light: { name: "Injection Sting", description: "Embeds dynamic server-side logic" },
            heavy: { name: "Toxic Query", description: "Contaminates databases with SQL" },
        },
    },
    Shell: {
        type: "Dark",
        borderColor: "#89E051",
        accentColor: "#A4EC7B",
        emoji: "🌑",
        attacks: {
            light: { name: "Shadow Pipe", description: "Chains commands in darkness" },
            heavy: { name: "Root Escalate", description: "Gains superuser privileges" },
        },
    },
    Dart: {
        type: "Ice",
        borderColor: "#00B4AB",
        accentColor: "#2DD4BF",
        emoji: "❄️",
        attacks: {
            light: { name: "Freeze Frame", description: "Renders a frozen UI snapshot" },
            heavy: { name: "Widget Blizzard", description: "Builds a storm of reactive components" },
        },
    },
    R: {
        type: "Water",
        borderColor: "#198CE7",
        accentColor: "#4DA6FF",
        emoji: "💧",
        attacks: {
            light: { name: "Data Stream", description: "Flows statistical analysis pipelines" },
            heavy: { name: "Regression Wave", description: "Drowns problems in predictive models" },
        },
    },
    Scala: {
        type: "Fire",
        borderColor: "#C22D40",
        accentColor: "#E04958",
        emoji: "🔥",
        attacks: {
            light: { name: "Pattern Burn", description: "Ignites case class matching" },
            heavy: { name: "Functional Inferno", description: "Immolates imperative code" },
        },
    },
    Haskell: {
        type: "Psychic",
        borderColor: "#5E5086",
        accentColor: "#7B6BA6",
        emoji: "🔮",
        attacks: {
            light: { name: "Monad Mind", description: "Abstracts computation through pure thought" },
            heavy: { name: "Lazy Psybeam", description: "Evaluates only when truly necessary" },
        },
    },
    Elixir: {
        type: "Fairy",
        borderColor: "#6E4A7E",
        accentColor: "#8B6A9E",
        emoji: "✨",
        attacks: {
            light: { name: "Phoenix Charm", description: "Spawns resilient web frameworks" },
            heavy: { name: "Actor Enchant", description: "Distributes magic across nodes" },
        },
    },
    Lua: {
        type: "Dark",
        borderColor: "#000080",
        accentColor: "#2020B0",
        emoji: "🌑",
        attacks: {
            light: { name: "Script Shadow", description: "Embeds into host applications" },
            heavy: { name: "Metatable Void", description: "Warps object behavior with metatables" },
        },
    },
    Vue: {
        type: "Grass",
        borderColor: "#42B883",
        accentColor: "#5CD09C",
        emoji: "🌿",
        attacks: {
            light: { name: "Reactive Vine", description: "Binds data to the view layer" },
            heavy: { name: "Component Bloom", description: "Grows a garden of reusable components" },
        },
    },
    HTML: {
        type: "Normal",
        borderColor: "#E34C26",
        accentColor: "#F06529",
        emoji: "⚪",
        attacks: {
            light: { name: "Tag Strike", description: "Structures semantic markup" },
            heavy: { name: "DOM Tree", description: "Constructs hierarchical document models" },
        },
    },
    CSS: {
        type: "Water",
        borderColor: "#563D7C",
        accentColor: "#6B4F91",
        emoji: "💧",
        attacks: {
            light: { name: "Style Flow", description: "Cascades design rules" },
            heavy: { name: "Flexbox Flood", description: "Drowns layouts in responsive design" },
        },
    },
};

const DEFAULT_THEME: LanguageCardTheme = {
    type: "Normal",
    borderColor: "#6B7280",
    accentColor: "#9CA3AF",
    emoji: "⚪",
    attacks: {
        light: { name: "Code Strike", description: "Executes basic programming logic" },
        heavy: { name: "Stack Overflow", description: "Unleashes maximum recursion depth" },
    },
};

export function getLanguageTheme(language: string): LanguageCardTheme {
    return LANGUAGE_CARD_THEMES[language] ?? DEFAULT_THEME;
}

export function getCardArtPath(language: string): string {
    if (language === "Python" || language === "Scala") {
        return "/cards/python.jpg";
    }
    if (language === "TypeScript" || language === "JavaScript") {
        return "/cards/typescript.jpg";
    }
    if (language === "Java" || language === "Kotlin" || language === "C#") {
        return "/cards/java.jpg";
    }
    if (language === "Rust" || language === "Go" || language === "C" || language === "C++") {
        return "/cards/rust+go+c.jpg";
    }
    if (language === "R" || language === "Haskell") {
        return "/cards/aimljupyer.jpg";
    }
    if (language === "Shell" || language === "PHP" || language === "Lua") {
        return "/cards/devops.jpg";
    }
    return "/cards/multicoder.jpg";
}

/* ─────────────────────────────────────────────
   Type Matchup System
   ───────────────────────────────────────────── */

const TYPE_WEAKNESSES: Record<string, string> = {
    Fire: "Water",
    Water: "Electric",
    Electric: "Ground",
    Grass: "Fire",
    Ground: "Water",
    Steel: "Fire",
    Dragon: "Ice",
    Ice: "Fire",
    Flying: "Electric",
    Ghost: "Dark",
    Dark: "Fairy",
    Fairy: "Steel",
    Poison: "Psychic",
    Psychic: "Dark",
    Normal: "Ground",
};

const TYPE_RESISTANCES: Record<string, string> = {
    Fire: "Grass",
    Water: "Fire",
    Electric: "Flying",
    Grass: "Water",
    Ground: "Electric",
    Steel: "Ice",
    Dragon: "Grass",
    Ice: "Ground",
    Flying: "Grass",
    Ghost: "Poison",
    Dark: "Psychic",
    Fairy: "Dark",
    Poison: "Grass",
    Psychic: "Ghost",
    Normal: "Ghost",
};

export function getWeakness(type: string): TypeMatchup {
    const weakType = TYPE_WEAKNESSES[type] ?? "Water";
    return { type: weakType, modifier: "×2" };
}

export function getResistance(type: string): TypeMatchup {
    const resistType = TYPE_RESISTANCES[type] ?? "Normal";
    return { type: resistType, modifier: "-30" };
}

/* ─────────────────────────────────────────────
   HP & Stats Calculation
   ───────────────────────────────────────────── */

function computeHP(
    contributionConsistency: number,
    totalStars: number,
    ageYears: number
): number {
    // Base HP + consistency + stars + age
    const raw = 100 + contributionConsistency * 80 + totalStars * 2 + ageYears * 10;
    // Clamp between 100 and 340 for realistic Pokemon V HP
    return Math.min(Math.max(Math.round(raw), 100), 340);
}

function calculateRetreatCost(languageCount: number, avgRepoSize: number): number {
    // Large codebases or many languages = harder to retreat
    if (avgRepoSize > 0) {
        return Math.min(Math.ceil(avgRepoSize / 500), 4);
    }
    return Math.min(Math.ceil(languageCount / 3), 4);
}

/* ─────────────────────────────────────────────
   Ability Generator
   ───────────────────────────────────────────── */

export function generateAbility(
    languageCount: number,
    repoCount: number,
    totalStars: number,
    consistency: number
): Ability {
    // Priority-based ability selection
    if (languageCount >= 6) {
        return {
            name: "Polyglot",
            description: `Fluent in ${languageCount} languages — attacks deal 10 extra damage`,
        };
    }
    if (repoCount >= 30) {
        return {
            name: "Open Source Advocate",
            description: `Maintains ${repoCount} public repos — heals 20 HP each turn`,
        };
    }
    if (totalStars >= 50) {
        return {
            name: "Star Collector",
            description: `${totalStars} stars across repos — immune to weakness`,
        };
    }
    if (consistency >= 0.7) {
        return {
            name: "Streak Runner",
            description: `High coding consistency — can't be put to sleep`,
        };
    }
    if (repoCount >= 10 && totalStars < 20) {
        return {
            name: "Lone Wolf",
            description: `Prefers solo projects — retreat cost reduced by 1`,
        };
    }
    return {
        name: "Fresh Spawn",
        description: `New to the ecosystem — draws an extra card each turn`,
    };
}

/* ─────────────────────────────────────────────
   Evolution Stage
   ───────────────────────────────────────────── */

function getEvolutionStage(ageYears: number, repoCount: number, totalStars: number): EvolutionStage {
    // STAGE 2 requires age AND activity
    if (ageYears >= 5 && (repoCount >= 20 || totalStars >= 50)) {
        return "STAGE 2";
    }
    if (ageYears >= 2) {
        return "STAGE 1";
    }
    return "BASIC";
}

/* ─────────────────────────────────────────────
   Attack Damage Calculation
   ───────────────────────────────────────────── */

function computeXP(ageYears: number, repoCount: number, totalStars: number, languageCount: number): number {
    // Composite experience score: age + repos + stars + language diversity
    const raw = ageYears * 15 + repoCount * 5 + totalStars * 2 + languageCount * 10;
    return Math.min(Math.max(Math.round(raw), 10), 9999);
}

function computeCodeVelocity(totalRepos: number, recentActiveRepos: number): number {
    // % of codebase actively maintained (pushed in last 6 months)
    if (totalRepos === 0) return 0;
    return Math.min(Math.round((recentActiveRepos / totalRepos) * 100), 100);
}

function calculateAttack1Damage(avgMonthlyActivity: number): number {
    // Light attack based on consistency
    return Math.min(Math.max(Math.round(avgMonthlyActivity * 3), 10), 60);
}

function calculateAttack2Damage(topRepoStars: number, totalStars: number): number {
    // Heavy attack based on impact
    return Math.min(Math.max(Math.round(topRepoStars * 10 + totalStars), 40), 200);
}

/* ─────────────────────────────────────────────
   Build card data from full UserStats
   ───────────────────────────────────────────── */

const MARKUP_LANGUAGES = new Set(["HTML", "CSS", "Markdown", "SCSS", "Less", "Jupyter Notebook"]);

export function buildCardData(stats: UserStats): PokemonCardData {
    const ageYears = stats.accountAgeYears;
    const programmingLangs = stats.languageStats.filter(
        (l) => !l.isMarkup && !MARKUP_LANGUAGES.has(l.language)
    );
    const topLanguage =
        stats.topLanguage ??
        (programmingLangs.length > 0 ? programmingLangs[0].language : "Polyglot");
    const theme = getLanguageTheme(topLanguage);

    // Filter programming languages
    const languageCount = programmingLangs.length;

    // Calculate evolution stage
    const evolutionStage = getEvolutionStage(ageYears, stats.ownRepoCount, stats.totalStars);

    // Calculate HP
    const consistency = stats.contributionConsistency
        ? stats.contributionConsistency.activeMonths / Math.max(stats.contributionConsistency.totalMonths, 1)
        : 0;
    const hp = computeHP(consistency, stats.totalStars, ageYears);

    // Generate ability
    const ability = generateAbility(
        languageCount,
        stats.ownRepoCount,
        stats.totalStars,
        consistency
    );

    // Calculate average monthly activity
    const avgMonthlyActivity = stats.monthlyActivity
        ? stats.monthlyActivity.reduce((sum, m) => sum + m.reposPushed, 0) / Math.max(stats.monthlyActivity.length, 1)
        : 0;

    // Calculate top repo stars
    const topRepoStars =
        stats.topRepositories.length > 0
            ? Math.max(...stats.topRepositories.map((r) => r.stargazers_count))
            : 0;

    // Generate attacks
    const attack1Damage = calculateAttack1Damage(avgMonthlyActivity);
    const attack2Damage = calculateAttack2Damage(topRepoStars, stats.totalStars);

    const attack1: Attack = {
        name: theme.attacks.light.name,
        description: theme.attacks.light.description,
        damage: attack1Damage,
        energyCost: attack1Damage < 30 ? 1 : 2,
    };

    const attack2: Attack = {
        name: theme.attacks.heavy.name,
        description: theme.attacks.heavy.description,
        damage: attack2Damage,
        energyCost: attack2Damage < 80 ? 2 : 3,
    };

    // Type matchups
    const weakness = getWeakness(theme.type);
    const resistance = getResistance(theme.type);

    // Calculate retreat cost
    const avgRepoSize =
        stats.repositories.length > 0
            ? stats.repositories.reduce((sum, r) => sum + (r.size ?? 0), 0) / stats.repositories.length
            : 0;
    const retreatCost = calculateRetreatCost(languageCount, avgRepoSize);

    return {
        username: stats.user.login,
        name: stats.user.name ?? stats.user.login,
        avatarUrl: stats.user.avatar_url,
        bio:
            stats.user.bio
                ? stats.user.bio.length > 100
                    ? stats.user.bio.slice(0, 97) + "..."
                    : stats.user.bio
                : "A developer on GitHub.",
        location: stats.user.location ?? "",
        hp,
        topLanguage,
        accountAgeYears: ageYears,
        evolutionStage,
        programmingLanguageCount: languageCount,
        ability,
        attack1,
        attack2,
        weakness,
        resistance,
        retreatCost,
        xp: computeXP(ageYears, stats.ownRepoCount, stats.totalStars, languageCount),
        codeVelocity: computeCodeVelocity(stats.topRepositories.length, stats.topRepositories.length > 0 ? stats.topRepositories.filter(r => {
            const pushed = new Date(r.pushed_at ?? r.created_at);
            const monthsAgo = (Date.now() - pushed.getTime()) / (30 * 24 * 60 * 60 * 1000);
            return monthsAgo <= 6;
        }).length : 0),
    };
}

/* ─────────────────────────────────────────────
   Edge-compatible GitHub API layer for card route
   ───────────────────────────────────────────── */

const GITHUB_API = "https://api.github.com";

interface GitHubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    location: string | null;
    created_at: string;
    public_repos: number;
}

interface Repository {
    name: string;
    fork: boolean;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    pushed_at: string;
    created_at: string;
    size: number;
}

async function fetchGitHubEdge<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const res = await fetch(`${GITHUB_API}${endpoint}`, {
            headers,
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status}`);
        }

        return res.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchUserEdge(username: string): Promise<GitHubUser> {
    return fetchGitHubEdge<GitHubUser>(`/users/${username}`);
}

async function fetchRepositoriesEdge(username: string): Promise<Repository[]> {
    // Only fetch first page (100 repos) for card — enough for stats
    return fetchGitHubEdge<Repository[]>(
        `/users/${username}/repos?per_page=100&sort=updated`
    );
}

async function fetchRepoLanguagesEdge(
    owner: string,
    repo: string
): Promise<Record<string, number>> {
    try {
        return await fetchGitHubEdge<Record<string, number>>(
            `/repos/${owner}/${repo}/languages`
        );
    } catch {
        return {};
    }
}

/**
 * Lightweight card stats fetch — Edge-compatible, minimal API calls
 * ~12 total API calls vs 50+ from fetchUserStats
 */
export async function fetchCardStatsEdge(username: string): Promise<PokemonCardData> {
    const [user, repositories] = await Promise.all([
        fetchUserEdge(username),
        fetchRepositoriesEdge(username),
    ]);

    const ownRepos = repositories.filter(r => !r.fork);
    const topRepos = ownRepos
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 10);

    // Fetch language data for top 10 repos only
    const languagePromises = topRepos.map(repo =>
        fetchRepoLanguagesEdge(username, repo.name)
    );
    const languageData = await Promise.all(languagePromises);

    // Calculate language stats
    const aggregated: Record<string, number> = {};
    for (const repoLangs of languageData) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
            if (lang !== "Jupyter Notebook") {
                aggregated[lang] = (aggregated[lang] || 0) + bytes;
            }
        }
    }

    const total = Object.values(aggregated).reduce((a, b) => a + b, 0);
    const programmingLangs = Object.entries(aggregated)
        .filter(([lang]) => !MARKUP_LANGUAGES.has(lang))
        .sort((a, b) => b[1] - a[1]);

    const topLanguage = programmingLangs.length > 0 ? programmingLangs[0][0] : "Polyglot";
    const languageCount = programmingLangs.length;

    // Calculate stats
    const totalStars = repositories.reduce((sum, r) => sum + r.stargazers_count, 0);
    const createdDate = new Date(user.created_at);
    const ageYears = Math.floor((Date.now() - createdDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Calculate contribution consistency (simplified)
    const pushDates = repositories.map(r => new Date(r.pushed_at)).sort((a, b) => a.getTime() - b.getTime());
    const activeMonthSet = new Set<string>();
    for (const d of pushDates) {
        activeMonthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const firstDate = pushDates[0] || new Date();
    const lastDate = pushDates[pushDates.length - 1] || new Date();
    const totalMonths = Math.max(1,
        (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (lastDate.getMonth() - firstDate.getMonth()) + 1
    );
    const consistency = activeMonthSet.size / totalMonths;

    // Calculate evolution stage
    const evolutionStage = getEvolutionStage(ageYears, ownRepos.length, totalStars);

    // Calculate HP
    const hp = computeHP(consistency, totalStars, ageYears);

    // Generate ability
    const ability = generateAbility(languageCount, ownRepos.length, totalStars, consistency);

    // Calculate attacks
    const avgMonthlyActivity = repositories.length > 0 ? repositories.length / Math.max(totalMonths, 1) : 0;
    const topRepoStars = topRepos.length > 0 ? Math.max(...topRepos.map(r => r.stargazers_count)) : 0;
    const attack1Damage = calculateAttack1Damage(avgMonthlyActivity);
    const attack2Damage = calculateAttack2Damage(topRepoStars, totalStars);

    const theme = getLanguageTheme(topLanguage);
    const attack1: Attack = {
        name: theme.attacks.light.name,
        description: theme.attacks.light.description,
        damage: attack1Damage,
        energyCost: attack1Damage < 30 ? 1 : 2,
    };

    const attack2: Attack = {
        name: theme.attacks.heavy.name,
        description: theme.attacks.heavy.description,
        damage: attack2Damage,
        energyCost: attack2Damage < 80 ? 2 : 3,
    };

    // Type matchups
    const weakness = getWeakness(theme.type);
    const resistance = getResistance(theme.type);

    // Calculate retreat cost
    const avgRepoSize = repositories.length > 0
        ? repositories.reduce((sum, r) => sum + (r.size ?? 0), 0) / repositories.length
        : 0;
    const retreatCost = calculateRetreatCost(languageCount, avgRepoSize);

    // Code velocity
    const recentActiveRepos = topRepos.filter(r => {
        const pushed = new Date(r.pushed_at);
        const monthsAgo = (Date.now() - pushed.getTime()) / (30 * 24 * 60 * 60 * 1000);
        return monthsAgo <= 6;
    }).length;

    return {
        username: user.login,
        name: user.name ?? user.login,
        avatarUrl: user.avatar_url,
        bio: user.bio
            ? user.bio.length > 100
                ? user.bio.slice(0, 97) + "..."
                : user.bio
            : "A developer on GitHub.",
        location: user.location ?? "",
        hp,
        topLanguage,
        accountAgeYears: ageYears,
        evolutionStage,
        programmingLanguageCount: languageCount,
        ability,
        attack1,
        attack2,
        weakness,
        resistance,
        retreatCost,
        xp: computeXP(ageYears, ownRepos.length, totalStars, languageCount),
        codeVelocity: computeCodeVelocity(topRepos.length, recentActiveRepos),
    };
}

/* ─────────────────────────────────────────────
   Lightweight fetch for card API route
   (skips heavy code-health / devops analysis)
   ───────────────────────────────────────────── */

export async function fetchCardData(username: string): Promise<PokemonCardData> {
    const stats = await fetchUserStats(username);
    return buildCardData(stats);
}
