import { UserStats, Repository } from "@/types/github";
import { fetchUser, fetchRepositories } from "./github";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface CardRepo {
    name: string;
    stars: number;
    description: string;
    language: string;
}

export type EvolutionStage = "BASIC" | "STAGE 1" | "STAGE 2";

export interface PokemonCardData {
    username: string;
    name: string;
    avatarUrl: string;
    bio: string;
    location: string;
    totalStars: number;
    topLanguage: string;
    leastUsedLanguage: string;
    accountAgeYears: number;
    evolutionStage: EvolutionStage;
    topRepos: CardRepo[];
    zeroStarRepoCount: number;
    programmingLanguageCount: number;
}

/* ─────────────────────────────────────────────
   Language → Pokémon Type mapping
   ───────────────────────────────────────────── */

export interface LanguageCardTheme {
    type: string;
    borderColor: string;
    accentColor: string;
    emoji: string;
}

export const LANGUAGE_CARD_THEMES: Record<string, LanguageCardTheme> = {
    Python:     { type: "Fire",     borderColor: "#E25822", accentColor: "#FF6B35", emoji: "🔥" },
    TypeScript: { type: "Electric", borderColor: "#3178C6", accentColor: "#58A6FF", emoji: "⚡" },
    JavaScript: { type: "Electric", borderColor: "#F0DB4F", accentColor: "#F7E05A", emoji: "⚡" },
    Go:         { type: "Water",    borderColor: "#00ADD8", accentColor: "#29BEB0", emoji: "💧" },
    Rust:       { type: "Steel",    borderColor: "#DEA584", accentColor: "#E8A87C", emoji: "⚙️" },
    Java:       { type: "Ground",   borderColor: "#B07219", accentColor: "#C98B2E", emoji: "🪨" },
    "C++":      { type: "Dragon",   borderColor: "#F34B7D", accentColor: "#FF6B9D", emoji: "🐉" },
    C:          { type: "Normal",   borderColor: "#555555", accentColor: "#777777", emoji: "⚪" },
    "C#":       { type: "Psychic",  borderColor: "#178600", accentColor: "#68A357", emoji: "🔮" },
    Ruby:       { type: "Fairy",    borderColor: "#CC342D", accentColor: "#E05A4F", emoji: "✨" },
    Swift:      { type: "Flying",   borderColor: "#F05138", accentColor: "#FF6B52", emoji: "🕊️" },
    Kotlin:     { type: "Ghost",    borderColor: "#A97BFF", accentColor: "#B98EFF", emoji: "👻" },
    PHP:        { type: "Poison",   borderColor: "#777BB4", accentColor: "#9B9ECE", emoji: "☠️" },
    Shell:      { type: "Dark",     borderColor: "#89E051", accentColor: "#A4EC7B", emoji: "🌑" },
    Dart:       { type: "Ice",      borderColor: "#00B4AB", accentColor: "#2DD4BF", emoji: "❄️" },
    R:          { type: "Water",    borderColor: "#198CE7", accentColor: "#4DA6FF", emoji: "💧" },
    Scala:      { type: "Fire",     borderColor: "#C22D40", accentColor: "#E04958", emoji: "🔥" },
    Haskell:    { type: "Psychic",  borderColor: "#5E5086", accentColor: "#7B6BA6", emoji: "🔮" },
    Elixir:     { type: "Fairy",    borderColor: "#6E4A7E", accentColor: "#8B6A9E", emoji: "✨" },
    Lua:        { type: "Dark",     borderColor: "#000080", accentColor: "#2020B0", emoji: "🌑" },
    Vue:        { type: "Grass",    borderColor: "#42B883", accentColor: "#5CD09C", emoji: "🌿" },
    HTML:       { type: "Normal",   borderColor: "#E34C26", accentColor: "#F06529", emoji: "⚪" },
    CSS:        { type: "Water",    borderColor: "#563D7C", accentColor: "#6B4F91", emoji: "💧" },
};

const DEFAULT_THEME: LanguageCardTheme = {
    type: "Normal",
    borderColor: "#6B7280",
    accentColor: "#9CA3AF",
    emoji: "⚪",
};

export function getLanguageTheme(language: string): LanguageCardTheme {
    return LANGUAGE_CARD_THEMES[language] ?? DEFAULT_THEME;
}

/* ─────────────────────────────────────────────
   Build card data from full UserStats
   ───────────────────────────────────────────── */

const MARKUP_LANGUAGES = new Set(["HTML", "CSS", "Markdown", "SCSS", "Less", "Jupyter Notebook"]);

export function buildCardData(stats: UserStats): PokemonCardData {
    const ageYears = stats.accountAgeYears;
    const evolutionStage: EvolutionStage =
        ageYears >= 5 ? "STAGE 2" : ageYears >= 2 ? "STAGE 1" : "BASIC";

    const programmingLangs = stats.languageStats.filter(l => !l.isMarkup && !MARKUP_LANGUAGES.has(l.language));
    const leastUsed = programmingLangs.length > 0
        ? programmingLangs[programmingLangs.length - 1].language
        : "None";

    const topRepos = [...stats.topRepositories]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 2)
        .map(r => ({
            name: r.name,
            stars: r.stargazers_count,
            description: r.description
                ? r.description.length > 60 ? r.description.slice(0, 57) + "..." : r.description
                : "A developer project.",
            language: r.language ?? stats.topLanguage ?? "Code",
        }));

    // Ensure we always have 2 attacks
    while (topRepos.length < 2) {
        topRepos.push({
            name: "Side Project",
            stars: 0,
            description: "Work in progress.",
            language: stats.topLanguage ?? "Code",
        });
    }

    const zeroStarRepos = stats.repositories.filter(r => !r.fork && r.stargazers_count === 0).length;

    return {
        username: stats.user.login,
        name: stats.user.name ?? stats.user.login,
        avatarUrl: stats.user.avatar_url,
        bio: stats.user.bio
            ? stats.user.bio.length > 100 ? stats.user.bio.slice(0, 97) + "..." : stats.user.bio
            : "A developer on GitHub.",
        location: stats.user.location ?? "Earth",
        totalStars: stats.totalStars,
        topLanguage: stats.topLanguage ?? "Polyglot",
        leastUsedLanguage: leastUsed,
        accountAgeYears: ageYears,
        evolutionStage,
        topRepos,
        zeroStarRepoCount: Math.min(zeroStarRepos, 4),
        programmingLanguageCount: programmingLangs.length,
    };
}

/* ─────────────────────────────────────────────
   Lightweight fetch for card API route
   (skips heavy code-health / devops analysis)
   ───────────────────────────────────────────── */

export async function fetchCardData(username: string): Promise<PokemonCardData> {
    const [user, repositories] = await Promise.all([
        fetchUser(username),
        fetchRepositories(username),
    ]);

    const ownRepos = repositories.filter(r => !r.fork);
    const totalStars = ownRepos.reduce((s, r) => s + r.stargazers_count, 0);

    // Language counting by repo
    const langCount = new Map<string, number>();
    for (const repo of ownRepos) {
        if (repo.language && !MARKUP_LANGUAGES.has(repo.language)) {
            langCount.set(repo.language, (langCount.get(repo.language) ?? 0) + 1);
        }
    }
    const sortedLangs = [...langCount.entries()].sort((a, b) => b[1] - a[1]);
    const topLanguage = sortedLangs.length > 0 ? sortedLangs[0][0] : "Polyglot";
    const leastUsedLanguage = sortedLangs.length > 1
        ? sortedLangs[sortedLangs.length - 1][0]
        : sortedLangs.length === 1 ? sortedLangs[0][0] : "None";

    const accountCreated = new Date(user.created_at);
    const now = new Date();
    const ageYears = Math.floor((now.getTime() - accountCreated.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const evolutionStage: EvolutionStage =
        ageYears >= 5 ? "STAGE 2" : ageYears >= 2 ? "STAGE 1" : "BASIC";

    const topRepos: CardRepo[] = [...ownRepos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 2)
        .map(r => ({
            name: r.name,
            stars: r.stargazers_count,
            description: r.description
                ? r.description.length > 60 ? r.description.slice(0, 57) + "..." : r.description
                : "A developer project.",
            language: r.language ?? topLanguage,
        }));

    while (topRepos.length < 2) {
        topRepos.push({
            name: "Side Project",
            stars: 0,
            description: "Work in progress.",
            language: topLanguage,
        });
    }

    const zeroStarRepos = ownRepos.filter(r => r.stargazers_count === 0).length;

    return {
        username: user.login,
        name: user.name ?? user.login,
        avatarUrl: user.avatar_url,
        bio: user.bio
            ? user.bio.length > 100 ? user.bio.slice(0, 97) + "..." : user.bio
            : "A developer on GitHub.",
        location: user.location ?? "Earth",
        totalStars,
        topLanguage,
        leastUsedLanguage,
        accountAgeYears: ageYears,
        evolutionStage,
        topRepos,
        zeroStarRepoCount: Math.min(zeroStarRepos, 4),
        programmingLanguageCount: sortedLangs.length,
    };
}
