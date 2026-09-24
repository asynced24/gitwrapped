import { FAMILIES, RARITIES, type ArtFamily, type Rarity } from "./families";
import { ARTWORKS, type Artwork } from "./manifest";
import type { PassionKey } from "@/lib/passions";

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
    /** Set when the painting comes from a passion edition pool. */
    passion: PassionKey | null;
    /** True for a one-of-one painting made for this user. */
    custom: boolean;
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
    artworks: readonly Artwork[] = ARTWORKS,
    passion: PassionKey | null = null
): CardArt {
    const info = FAMILIES[family];
    const user = login.toLowerCase();

    // A one-of-one made for this user beats everything else.
    const own = artworks.find(a => a.owner === user);
    if (own) {
        return {
            id: own.id,
            file: own.file,
            family: own.family,
            rarity,
            species: FAMILIES[own.family].species[rarity],
            variant: own.variant,
            poolSize: 1,
            passion: own.passion ?? null,
            custom: true,
        };
    }
    const shared = artworks.filter(a => !a.owner);

    // A passion edition painting beats the regular pools when one exists.
    if (passion) {
        const pool = shared.filter(a => a.family === family && a.passion === passion);
        const chosen = pickFromPool(login, pool);
        if (chosen) {
            return {
                id: chosen.id,
                file: chosen.file,
                family,
                rarity,
                species: info.species[rarity],
                variant: chosen.variant,
                poolSize: pool.length,
                passion,
                custom: false,
            };
        }
    }

    // Earned tier first, then each lower tier of the same family, so a
    // legendary card shows the best painting that exists for its creature
    // line. Never another family: that would show the wrong creature.
    for (let tier = RARITIES.indexOf(rarity); tier >= 0; tier--) {
        const poolRarity = RARITIES[tier];
        const pool = shared.filter(a => a.family === family && a.rarity === poolRarity && !a.passion);
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
                passion: null,
                custom: false,
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
        passion: null,
        custom: false,
    };
}
