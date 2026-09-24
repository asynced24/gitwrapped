import { FAMILIES, RARITIES, type ArtFamily, type Rarity } from "./families";
import { ARTWORKS, type Artwork } from "./manifest";

export interface CardArt {
    /** Artwork id, or `<family>:fallback` when the pool is still empty. */
    id: string;
    file: string;
    family: ArtFamily;
    /** Rarity of the pool the painting came from (can be below the card's). */
    rarity: Rarity;
    species: string;
    variant: string | null;
    /** How many artworks share this card's pool (0 while on the fallback). */
    poolSize: number;
}

/**
 * 32-bit FNV-1a with a murmur3 finaliser, so similar inputs ("art-1",
 * "art-2") still produce well-spread scores.
 */
export function hash32(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
}

/**
 * Rendezvous (highest-random-weight) hashing: each user takes the artwork
 * with the highest hash(user, artwork). Unlike `hash % poolSize`, adding an
 * artwork to a pool of N only moves the ~1/(N+1) of users who now score it
 * highest; everyone else keeps their art, so embedded README cards stay put.
 */
export function pickFromPool(login: string, pool: readonly Artwork[]): Artwork | null {
    const user = login.toLowerCase();
    let best: Artwork | null = null;
    let bestScore = -1;
    for (const art of pool) {
        const score = hash32(`${user}\u0000${art.id}`);
        if (score > bestScore || (score === bestScore && best !== null && art.id < best.id)) {
            best = art;
            bestScore = score;
        }
    }
    return best;
}

export function pickArtwork(
    login: string,
    family: ArtFamily,
    rarity: Rarity,
    artworks: readonly Artwork[] = ARTWORKS
): CardArt {
    const info = FAMILIES[family];

    // Earned tier first, then each lower tier of the same family, so a
    // legendary card shows the best painting that exists for its creature
    // line. Never another family: that would show the wrong creature.
    for (let tier = RARITIES.indexOf(rarity); tier >= 0; tier--) {
        const poolRarity = RARITIES[tier];
        const pool = artworks.filter(a => a.family === family && a.rarity === poolRarity);
        const chosen = pickFromPool(login, pool);
        if (chosen) {
            return {
                id: chosen.id,
                file: chosen.file,
                family,
                rarity: poolRarity,
                species: info.species[poolRarity],
                variant: chosen.variant,
                poolSize: pool.length,
            };
        }
    }

    // Nothing painted for this family yet: its original painting.
    return {
        id: `${family}:fallback`,
        file: info.fallbackArt,
        family,
        rarity,
        species: info.species[rarity],
        variant: null,
        poolSize: 0,
    };
}
