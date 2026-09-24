/**
 * Art families: every programming language belongs to one, and each family
 * has one creature line that evolves with the card's rarity.
 */

export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "legendary"];

export type ArtFamily = "ts-js" | "python" | "jvm" | "systems" | "data" | "devops" | "polyglot";

interface FamilyInfo {
    label: string;
    /** Creature name per rarity: Basic → Stage 1 → Stage 2 → mythic form. */
    species: Record<Rarity, string>;
    /** Painting used while this family's pool for a rarity is still empty. */
    fallbackArt: string;
    /**
     * How many artworks each pool is planned to hold. Busy pools (commons,
     * the most common languages) get more variants so people rarely share.
     */
    poolTargets: Record<Rarity, number>;
}

export const FAMILIES: Record<ArtFamily, FamilyInfo> = {
    "ts-js": {
        label: "TypeScript / JavaScript",
        species: { common: "Sparkit", uncommon: "Voltlynx", rare: "Thundermane", legendary: "Stormcrown" },
        fallbackArt: "/cards/typescript.jpg",
        poolTargets: { common: 20, uncommon: 10, rare: 6, legendary: 3 },
    },
    python: {
        label: "Python",
        species: { common: "Wirelet", uncommon: "Coilisk", rare: "Cable Basilisk", legendary: "Ouroboros Prime" },
        fallbackArt: "/cards/python.jpg",
        poolTargets: { common: 20, uncommon: 10, rare: 6, legendary: 3 },
    },
    jvm: {
        label: "Java / Kotlin / C#",
        species: { common: "Beanling", uncommon: "Brewstone", rare: "Brew Golem", legendary: "Monolith Titan" },
        fallbackArt: "/cards/java.jpg",
        poolTargets: { common: 12, uncommon: 7, rare: 4, legendary: 3 },
    },
    systems: {
        label: "C / C++ / Rust / Go",
        species: { common: "Bitshell", uncommon: "Kerneltoise", rare: "Bedrock Tortoise", legendary: "Bedrock Leviathan" },
        fallbackArt: "/cards/rust+go+c.jpg",
        poolTargets: { common: 12, uncommon: 7, rare: 4, legendary: 3 },
    },
    data: {
        label: "ML / data",
        species: { common: "Neurolet", uncommon: "Synapsea", rare: "Neural Nexus", legendary: "Singularity Bloom" },
        fallbackArt: "/cards/aimljupyer.jpg",
        poolTargets: { common: 8, uncommon: 5, rare: 3, legendary: 3 },
    },
    devops: {
        label: "Shell / DevOps",
        species: { common: "Podling", uncommon: "Pipewyrm", rare: "Container Dragon", legendary: "Cluster Hydra" },
        fallbackArt: "/cards/devops.jpg",
        poolTargets: { common: 8, uncommon: 5, rare: 3, legendary: 3 },
    },
    polyglot: {
        label: "Polyglot / other",
        species: { common: "Glyphling", uncommon: "Theorowl", rare: "Axiom Owl", legendary: "Babel Seraph" },
        fallbackArt: "/cards/multicoder.jpg",
        poolTargets: { common: 10, uncommon: 6, rare: 4, legendary: 3 },
    },
};

export const ART_FAMILIES = Object.keys(FAMILIES) as ArtFamily[];

const LANGUAGE_FAMILY: Record<string, ArtFamily> = {
    TypeScript: "ts-js", JavaScript: "ts-js", Vue: "ts-js", Svelte: "ts-js", Astro: "ts-js",
    Python: "python",
    Java: "jvm", Kotlin: "jvm", "C#": "jvm", Scala: "jvm", Groovy: "jvm", Clojure: "jvm",
    C: "systems", "C++": "systems", Rust: "systems", Go: "systems", Zig: "systems", Assembly: "systems",
    R: "data", Julia: "data", Haskell: "data", "Jupyter Notebook": "data",
    Shell: "devops", PowerShell: "devops", HCL: "devops", Nix: "devops", PHP: "devops", Lua: "devops", Dockerfile: "devops",
};

export function familyForLanguage(language: string | null): ArtFamily {
    return (language && LANGUAGE_FAMILY[language]) || "polyglot";
}

/** Planned size of the full art set, across every family and rarity. */
export function totalPoolTarget(): number {
    return ART_FAMILIES.reduce(
        (sum, f) => sum + RARITIES.reduce((s, r) => s + FAMILIES[f].poolTargets[r], 0),
        0
    );
}
