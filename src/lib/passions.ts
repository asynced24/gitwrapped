import type { RawRepo } from "@/lib/github/types";

/**
 * Passion editions: a card earns one when the user has built a repo about
 * something they love outside code. Detection only reads what's public on
 * their own repos (topics, name, description), and the card names the repo
 * that earned it, so the claim is always checkable.
 */

export type PassionKey = "fitness" | "combat" | "soccer" | "american-football" | "racing" | "gaming" | "rap";

export interface PassionInfo {
    key: PassionKey;
    edition: string;
    emoji: string;
    color: string;
    /**
     * Whole words or phrases, lower case. Deliberately specific: "race" alone
     * would match every race-condition repo, "ball" every ballot.
     */
    keywords: string[];
}

export const PASSIONS: Record<PassionKey, PassionInfo> = {
    fitness: {
        key: "fitness", edition: "Iron Stage Edition", emoji: "🏋️", color: "#FF6B4A",
        keywords: ["fitness", "gym", "workout", "workouts", "lifting", "lifter", "lifters", "powerlifting", "weightlifting",
            "bodybuilding", "bodybuilder", "calisthenics", "strength training", "hypertrophy", "crossfit", "progressive overload", "one rep max", "1rm"],
    },
    combat: {
        key: "combat", edition: "Fight Night Edition", emoji: "🥊", color: "#FF3D5A",
        keywords: ["boxing", "boxer", "mma", "ufc", "muay thai", "muaythai", "kickboxing", "jiu jitsu", "jiujitsu", "bjj",
            "wrestling", "karate", "judo", "taekwondo", "sparring", "martial arts"],
    },
    soccer: {
        key: "soccer", edition: "Pitch Edition", emoji: "⚽", color: "#3DDC84",
        // Plain "football" is soccer to most of the world; NFL words go to American football.
        keywords: ["soccer", "football", "futbol", "premier league", "la liga", "laliga", "champions league", "epl", "mls", "fifa", "bundesliga", "serie a"],
    },
    "american-football": {
        key: "american-football", edition: "Gridiron Edition", emoji: "🏈", color: "#C8733A",
        keywords: ["nfl", "gridiron", "american football", "fantasy football", "touchdown", "quarterback", "super bowl", "ncaa football"],
    },
    racing: {
        key: "racing", edition: "Pole Position Edition", emoji: "🏎️", color: "#FF2D2D",
        keywords: ["f1", "formula 1", "formula1", "formula one", "motorsport", "motorsports", "racing", "nascar", "karting", "grand prix", "indycar", "sim racing"],
    },
    gaming: {
        key: "gaming", edition: "Arcade Edition", emoji: "🎮", color: "#8B5CFF",
        keywords: ["game", "games", "gaming", "gamedev", "godot", "unity3d", "minecraft", "esports", "speedrun", "roguelike", "pygame", "phaser", "video game",
            // Titles people build stats tools for (detection only; never shown on a card).
            "valorant", "fortnite", "league of legends", "dota", "dota2", "counter strike", "csgo", "cs2", "overwatch", "apex legends", "pokemon", "chess"],
    },
    rap: {
        key: "rap", edition: "Cypher Edition", emoji: "🎤", color: "#FFC400",
        keywords: ["rap", "hiphop", "hip hop", "rapper", "lyrics", "freestyle", "beats", "beatmaker", "cypher", "mixtape"],
    },
};

export const PASSION_KEYS = Object.keys(PASSIONS) as PassionKey[];

/** A topic match is deliberate tagging; a name match is strong; a description mention is weak. */
export const PASSION_WEIGHTS = { topic: 3, name: 2, description: 1 } as const;
/** Score needed to earn an edition: one topic or name hit, or two description hits. */
export const PASSION_THRESHOLD = 2;

export interface Passion extends PassionInfo {
    /** The repo that contributed most to the match, shown on the card (null for a custom edition). */
    repo: string | null;
    score: number;
}

/** "your-prime_fitnessTracker" → "your prime fitness tracker" */
export function normalize(text: string): string {
    return ` ${text
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()} `;
}

/** 1 if any keyword appears as a whole word or phrase, else 0. */
function mentions(text: string, keywords: string[]): number {
    const haystack = normalize(text);
    return keywords.some(k => haystack.includes(` ${k} `)) ? 1 : 0;
}

export function detectPassion(repos: RawRepo[]): Passion | null {
    let best: Passion | null = null;

    for (const key of PASSION_KEYS) {
        const info = PASSIONS[key];
        let score = 0;
        let topRepo: { name: string; score: number } | null = null;

        for (const repo of repos) {
            const repoScore =
                PASSION_WEIGHTS.topic * mentions(repo.topics.join(" "), info.keywords) +
                PASSION_WEIGHTS.name * mentions(repo.name, info.keywords) +
                PASSION_WEIGHTS.description * mentions(repo.description ?? "", info.keywords);
            if (repoScore === 0) continue;
            score += repoScore;
            if (!topRepo || repoScore > topRepo.score) topRepo = { name: repo.name, score: repoScore };
        }

        if (topRepo && score >= PASSION_THRESHOLD && (!best || score > best.score)) {
            best = { ...info, repo: topRepo.name, score };
        }
    }

    return best;
}
