import type { UserStats } from "@/types/github";

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

/** One line of "why this number": shown under the card on the dashboard. */
export interface CardStatExplanation {
    stat: string;
    value: string;
    because: string;
}

export interface PokemonCardData {
    username: string;
    name: string;
    avatarUrl: string;
    bio: string;
    location: string;
    hp: number;
    topLanguage: string;
    accountAgeYears: number;
    /** Year the GitHub account was created. */
    memberSince: number;
    evolutionStage: EvolutionStage;
    programmingLanguageCount: number;
    ability: Ability;
    attack1: Attack;
    attack2: Attack;
    weakness: TypeMatchup;
    resistance: TypeMatchup;
    retreatCost: number;
    /** Contributions in the last 12 months (footer). */
    contributions: number;
    activeWeeks: number;
    totalWeeks: number;
    cardNumber: string;
    rarity: "common" | "uncommon" | "rare";
    explanations: CardStatExplanation[];
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
   Scoring
   Every number on the card is one real metric on a log scale, so a
   10k-star account and a 250k-star account still look different. HP and
   damage are rounded to 10 like a printed card.
   ───────────────────────────────────────────── */

const round10 = (n: number) => Math.round(n / 10) * 10;
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const formatCount = (n: number) =>
    n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

/** 0 at 0, 1 at `full`, logarithmic in between, capped at 1. */
export function logScale(value: number, full: number): number {
    if (value <= 0) return 0;
    return Math.min(1, Math.log10(1 + value) / Math.log10(1 + full));
}

export const HP_RANGE = { min: 40, max: 340 } as const;

/**
 * HP = staying power: how steadily you show up, and for how long.
 * 40 base, +200 × share of the last year's weeks with any contribution,
 * +100 × account age (linear, full at 10 years).
 */
export function computeHP(input: { activeWeeks: number; totalWeeks: number; ageYears: number }): number {
    const weekShare = input.totalWeeks > 0 ? input.activeWeeks / input.totalWeeks : 0;
    const raw = HP_RANGE.min + 200 * weekShare + 100 * Math.min(1, input.ageYears / 10);
    return clamp(round10(raw), HP_RANGE.min, HP_RANGE.max);
}

/**
 * Light attack = output: every contribution in the last 12 months, private
 * ones included. 10–120, log scale, full at 3,000.
 */
export function computeLightDamage(contributions: number): number {
    return round10(10 + 110 * logScale(contributions, 3000));
}

/** Heavy attack = stars on the best repo. 20–200, full at 20,000 stars. */
export function computeHeavyDamage(topRepoStars: number): number {
    return round10(20 + 180 * logScale(topRepoStars, 20_000));
}

/** Retreat cost = live projects you'd be walking away from: 1 per 2, max 4. */
export function computeRetreatCost(maintainedRepos: number): number {
    return Math.min(4, Math.ceil(maintainedRepos / 2));
}

export function computeStage(input: { ageYears: number; weekShare: number; stars: number; contributions: number }): EvolutionStage {
    if (input.ageYears < 2 || (input.contributions < 50 && input.stars < 10)) return "BASIC";
    if (input.ageYears >= 5 && (input.weekShare >= 0.5 || input.stars >= 100)) return "STAGE 2";
    return "STAGE 1";
}

interface AbilityCandidate {
    name: string;
    description: string;
    /** 1.0 = at the "notable" bar; the highest wins. */
    strength: number;
}

/**
 * The ability is the user's most exceptional trait. Each candidate is
 * scored against its own "notable" bar (e.g. a 30-day streak, 200 stars),
 * so the winner is whatever stands out most for this person — not whatever
 * happened to be checked first.
 */
export function pickAbility(stats: UserStats): Ability {
    const a = stats.activity;
    const weekShare = a.totalWeeks > 0 ? a.activeWeeks / a.totalWeeks : 0;
    const practiceShare = (key: string) => stats.practices.signals.find(s => s.key === key)?.share ?? 0;
    const enoughRepos = stats.practices.analyzedRepos >= 5;

    const candidates: AbilityCandidate[] = [
        {
            name: "Streak Runner",
            description: `${a.longestStreak}-day contribution streak — can't be put to sleep`,
            strength: a.longestStreak / 30,
        },
        {
            name: "Iron Routine",
            description: `Active ${a.activeWeeks} of the last ${a.totalWeeks} weeks — immune to status effects`,
            strength: weekShare / 0.9,
        },
        {
            name: "Star Collector",
            description: `${formatCount(stats.totalStars)} star${stats.totalStars === 1 ? "" : "s"} across own repos — immune to weakness`,
            strength: stats.totalStars / 200,
        },
        {
            name: "Polyglot",
            description: `Writes ${stats.languageCount} languages — attacks deal 10 extra damage`,
            strength: stats.languageCount / 6,
        },
        {
            name: "Code Reviewer",
            description: `${plural(a.reviews, "review")} this year — sees through opponent's hand`,
            strength: a.reviews / 100,
        },
        {
            name: "Pull Request Machine",
            description: `${plural(a.pullRequests, "pull request")} this year — attach an extra energy`,
            strength: a.pullRequests / 100,
        },
        {
            name: "Ancient Protocol",
            description: `${stats.accountAgeYears} years on GitHub — attacks bypass resistance`,
            strength: stats.accountAgeYears / 12,
        },
        {
            name: "Pipeline Builder",
            description: `CI in ${practiceShare("ci")}% of repos — heals 20 HP each turn`,
            strength: enoughRepos ? practiceShare("ci") / 60 : 0,
        },
        {
            name: "Test Guardian",
            description: `Tests in ${practiceShare("tests")}% of repos — prevents all damage from bugs`,
            strength: enoughRepos ? practiceShare("tests") / 50 : 0,
        },
    ];

    const best = candidates.reduce((top, c) => (c.strength > top.strength ? c : top));
    if (best.strength >= 0.5) return { name: best.name, description: best.description };

    return stats.accountAgeYears >= 1
        ? { name: "Rising Coder", description: `${stats.accountAgeYears} years in and still leveling up — draws an extra card` }
        : { name: "Fresh Spawn", description: "New to the ecosystem — draws an extra card each turn" };
}

/** Deterministic 4-digit card number from username, always the same for the same user. */
function computeCardNumber(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = ((hash << 5) - hash + username.charCodeAt(i)) | 0;
    }
    return String((Math.abs(hash) % 9999) + 1).padStart(4, "0");
}

/* ─────────────────────────────────────────────
   Build card data from UserStats (pure)
   ───────────────────────────────────────────── */

export function buildCardData(stats: UserStats): PokemonCardData {
    const a = stats.activity;
    const ageYears = stats.accountAgeYears;
    const weekShare = a.totalWeeks > 0 ? a.activeWeeks / a.totalWeeks : 0;
    const topLanguage = stats.topLanguage ?? "Polyglot";
    const theme = getLanguageTheme(topLanguage);
    const topRepo = stats.mostStarredRepo;
    const topStars = topRepo?.stargazers_count ?? 0;

    const hp = computeHP({ activeWeeks: a.activeWeeks, totalWeeks: a.totalWeeks, ageYears });
    const lightDamage = computeLightDamage(a.total);
    const heavyDamage = computeHeavyDamage(topStars);
    const retreatCost = computeRetreatCost(stats.maintainedRepoCount);
    const evolutionStage = computeStage({ ageYears, weekShare, stars: stats.totalStars, contributions: a.total });
    const ability = pickAbility(stats);

    const attack1: Attack = {
        name: theme.attacks.light.name,
        description: `${plural(a.total, "contribution")} in the last year`,
        damage: lightDamage,
        energyCost: lightDamage < 50 ? 1 : 2,
    };

    const attack2: Attack = {
        name: theme.attacks.heavy.name,
        description: topRepo && topStars > 0
            ? `Powered by ${topRepo.name} — ★ ${formatCount(topStars)}`
            : "No starred repos yet",
        damage: heavyDamage,
        energyCost: heavyDamage < 100 ? 2 : 3,
    };

    const explanations: CardStatExplanation[] = [
        {
            stat: "HP",
            value: String(hp),
            because: `Active ${a.activeWeeks} of the last ${a.totalWeeks} weeks, ${ageYears} years on GitHub`,
        },
        {
            stat: attack1.name,
            value: String(lightDamage),
            because: `${plural(a.total, "contribution")} in 12 months (${plural(a.commits, "commit")}, ${plural(a.pullRequests, "PR")}, ${plural(a.reviews, "review")}${a.restricted > 0 ? `, ${a.restricted.toLocaleString("en-US")} private` : ""})`,
        },
        {
            stat: attack2.name,
            value: String(heavyDamage),
            because: topRepo && topStars > 0 ? `${topRepo.name} has ${plural(topStars, "star")}` : "No repo has stars yet",
        },
        { stat: "Ability", value: ability.name, because: ability.description.split(" — ")[0] },
        {
            stat: "Retreat",
            value: String(retreatCost),
            because: `${plural(stats.maintainedRepoCount, "repo")} pushed in the last 180 days`,
        },
        {
            stat: "Stage",
            value: evolutionStage,
            because: `${ageYears} years on GitHub, active ${Math.round(weekShare * 100)}% of weeks, ${formatCount(stats.totalStars)} star${stats.totalStars === 1 ? "" : "s"}`,
        },
        { stat: "Type", value: theme.type, because: `${topLanguage} is ${stats.topLanguagePercentage}% of your code by bytes` },
    ];

    const bio = stats.user.bio
        ? stats.user.bio.length > 100 ? stats.user.bio.slice(0, 97) + "..." : stats.user.bio
        : "A developer on GitHub.";

    return {
        username: stats.user.login,
        name: stats.user.name ?? stats.user.login,
        avatarUrl: stats.user.avatar_url,
        bio,
        location: stats.user.location ?? "",
        hp,
        topLanguage,
        accountAgeYears: ageYears,
        memberSince: new Date(stats.user.created_at).getUTCFullYear(),
        evolutionStage,
        programmingLanguageCount: stats.languageCount,
        ability,
        attack1,
        attack2,
        weakness: getWeakness(theme.type),
        resistance: getResistance(theme.type),
        retreatCost,
        contributions: a.total,
        activeWeeks: a.activeWeeks,
        totalWeeks: a.totalWeeks,
        cardNumber: computeCardNumber(stats.user.login),
        rarity: evolutionStage === "STAGE 2" ? "rare" : evolutionStage === "STAGE 1" ? "uncommon" : "common",
        explanations,
    };
}
