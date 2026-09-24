import { describe, expect, it } from "vitest";
import { FAMILIES, familyForLanguage, totalPoolTarget } from "./families";
import type { Artwork } from "./manifest";
import { pickArtwork, pickFromPool } from "./pick";

function pool(size: number, prefix = "art"): Artwork[] {
    return Array.from({ length: size }, (_, i) => ({
        id: `${prefix}-${i}`,
        family: "ts-js",
        rarity: "common",
        variant: `Scene ${i}`,
        file: `/art/ts-js/common/scene-${i}.webp`,
    }));
}

const USERS = Array.from({ length: 10_000 }, (_, i) => `user${i}`);

describe("pickFromPool", () => {
    it("always gives the same user the same art, whatever the letter case", () => {
        const arts = pool(20);
        expect(pickFromPool("Asynced24", arts)?.id).toBe(pickFromPool("asynced24", arts)?.id);
        expect(pickFromPool("asynced24", [...arts].reverse())?.id).toBe(pickFromPool("asynced24", arts)?.id);
    });

    it("spreads users evenly across a pool", () => {
        const arts = pool(20);
        const counts = new Map<string, number>();
        for (const u of USERS) {
            const id = pickFromPool(u, arts)!.id;
            counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        const mean = USERS.length / arts.length;
        expect(counts.size).toBe(arts.length);
        for (const n of counts.values()) {
            expect(n).toBeGreaterThan(mean * 0.8);
            expect(n).toBeLessThan(mean * 1.2);
        }
    });

    it("moves only about 1/(N+1) of users when an artwork is added", () => {
        const before = pool(10);
        const after = [...before, ...pool(1, "new")];
        let moved = 0;
        for (const u of USERS) {
            const a = pickFromPool(u, before)!.id;
            const b = pickFromPool(u, after)!.id;
            if (a !== b) {
                moved++;
                // Anyone who moves, moves to the new piece — never between old ones.
                expect(b).toBe("new-0");
            }
        }
        expect(moved / USERS.length).toBeGreaterThan(0.06);
        expect(moved / USERS.length).toBeLessThan(0.12);
    });

    it("returns null for an empty pool", () => {
        expect(pickFromPool("anyone", [])).toBeNull();
    });
});

describe("pickArtwork", () => {
    it("uses the family's original painting while a pool is empty", () => {
        const art = pickArtwork("asynced24", "python", "rare", []);
        expect(art).toMatchObject({ file: "/cards/python.jpg", poolSize: 0, variant: null, species: "Cable Basilisk" });
    });

    it("borrows the nearest lower tier of the same family, never another family", () => {
        const commons = pool(5);
        const rareOne: Artwork = { ...commons[0], id: "rare-0", rarity: "rare" };
        const legendary = pickArtwork("asynced24", "ts-js", "legendary", [...commons, rareOne]);
        expect(legendary).toMatchObject({ id: "rare-0", rarity: "rare", species: "Thundermane", poolSize: 1 });
        expect(pickArtwork("asynced24", "ts-js", "uncommon", commons)).toMatchObject({ rarity: "common", poolSize: 5 });
        expect(pickArtwork("asynced24", "python", "legendary", commons).file).toBe(FAMILIES.python.fallbackArt);
    });

    it("never gives a lower card a higher tier's art", () => {
        const rare: Artwork[] = pool(3).map(a => ({ ...a, rarity: "rare" }));
        expect(pickArtwork("asynced24", "ts-js", "common", rare).file).toBe(FAMILIES["ts-js"].fallbackArt);
    });

    it("reports the pool size and variant when the pool has art", () => {
        const art = pickArtwork("asynced24", "ts-js", "common", pool(6));
        expect(art.poolSize).toBe(6);
        expect(art.variant).toMatch(/^Scene \d$/);
        expect(art.species).toBe("Sparkit");
    });
});

describe("families", () => {
    it.each([
        ["TypeScript", "ts-js"],
        ["C", "systems"],
        ["Scala", "jvm"],
        ["Jupyter Notebook", "data"],
        ["HCL", "devops"],
        ["Lean", "polyglot"],
        [null, "polyglot"],
    ] as const)("%s → %s", (language, family) => {
        expect(familyForLanguage(language)).toBe(family);
    });

    it("plans about 190 artworks", () => {
        expect(totalPoolTarget()).toBe(191);
    });
});
