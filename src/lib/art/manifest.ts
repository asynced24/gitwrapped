import type { ArtFamily, Rarity } from "./families";
import manifest from "./manifest.json";

export interface Artwork {
    /** Stable id. Never rename or reuse one: it decides who holds the art. */
    id: string;
    family: ArtFamily;
    rarity: Rarity;
    /** Scene / pose name shown on the card, e.g. "Storm Ridge". */
    variant: string;
    /** Path under /public. Portrait 5:7, full-bleed, no text, WebP ≤ 150 KB. */
    file: string;
}

/**
 * Every artwork in circulation, from manifest.json. Add paintings with
 * `npm run art:add` rather than by hand. Each addition moves only the few
 * people who now prefer the new piece (see pickArtwork), and empty pools
 * fall back to the family's original painting.
 */
export const ARTWORKS = manifest as Artwork[];
