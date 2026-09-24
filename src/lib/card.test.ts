import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { FIXTURE_USERS, loadFixture } from "@/lib/analysis/test-helpers";
import {
    HP_RANGE,
    buildCardData,
    computeHeavyDamage,
    computeHP,
    computeLightDamage,
    computeRarity,
    computeRetreatCost,
    logScale,
    pickAbility,
} from "./card";

describe("logScale", () => {
    it("is 0 at 0, 1 at full, capped, and monotonic", () => {
        expect(logScale(0, 1000)).toBe(0);
        expect(logScale(1000, 1000)).toBeCloseTo(1);
        expect(logScale(1_000_000, 1000)).toBe(1);
        expect(logScale(10, 1000)).toBeLessThan(logScale(11, 1000));
    });
});

describe("stat formulas", () => {
    it("keeps HP inside the card range and in multiples of 10", () => {
        const low = computeHP({ activeWeeks: 0, totalWeeks: 52, ageYears: 0 });
        const high = computeHP({ activeWeeks: 52, totalWeeks: 52, ageYears: 30 });
        expect(low).toBe(HP_RANGE.min);
        expect(high).toBe(HP_RANGE.max);
        expect(computeHP({ activeWeeks: 26, totalWeeks: 52, ageYears: 5 }) % 10).toBe(0);
    });

    it("gives more HP for showing up more often, all else equal", () => {
        const sporadic = computeHP({ activeWeeks: 10, totalWeeks: 52, ageYears: 4 });
        const steady = computeHP({ activeWeeks: 45, totalWeeks: 52, ageYears: 4 });
        expect(steady).toBeGreaterThan(sporadic);
    });

    it("still separates large accounts instead of saturating (old cap bug)", () => {
        // On main, 12k and 250k stars both hit the 200 cap.
        expect(computeHeavyDamage(12_000)).toBeLessThan(computeHeavyDamage(250_000));
        expect(computeLightDamage(1000)).toBeLessThan(computeLightDamage(3000));
    });

    it("maps maintained repos to retreat cost 0-4", () => {
        expect([0, 1, 2, 3, 5, 8, 40].map(computeRetreatCost)).toEqual([0, 1, 1, 2, 3, 4, 4]);
    });
});

describe("buildCardData on real accounts", () => {
    const cards = Object.fromEntries(
        FIXTURE_USERS.map(u => [u, buildCardData(analyzeSnapshot(loadFixture(u)))])
    );

    it("no longer gives every user the same ability, attack or retreat (old bug)", () => {
        const values = Object.values(cards);
        expect(new Set(values.map(c => c.ability.name)).size).toBeGreaterThan(1);
        expect(new Set(values.map(c => c.attack1.damage)).size).toBeGreaterThan(1);
        expect(new Set(values.map(c => c.hp)).size).toBeGreaterThan(1);
    });

    it("ranks the Linux maintainer above a student account on every stat", () => {
        const t = cards.torvalds;
        const s = cards.asynced24;
        expect(t.hp).toBeGreaterThan(s.hp);
        expect(t.attack1.damage).toBeGreaterThan(s.attack1.damage);
        expect(t.attack2.damage).toBeGreaterThan(s.attack2.damage);
    });

    it("explains every number with the metric it came from", () => {
        for (const card of Object.values(cards)) {
            expect(card.explanations.map(e => e.stat)).toEqual(
                expect.arrayContaining(["HP", "Ability", "Retreat", "Stage", "Type"])
            );
            expect(card.explanations.find(e => e.stat === "HP")!.because).toMatch(/Active \d+ of the last \d+ weeks/);
        }
    });

    it("matches the recorded cards", () => {
        const summary = Object.fromEntries(
            Object.entries(cards).map(([u, c]) => [
                u,
                {
                    hp: c.hp,
                    light: `${c.attack1.name} ${c.attack1.damage}`,
                    heavy: `${c.attack2.name} ${c.attack2.damage}`,
                    ability: c.ability.name,
                    retreat: c.retreatCost,
                    stage: c.evolutionStage,
                    rarity: c.rarity,
                    art: c.art.id,
                    type: c.topLanguage,
                },
            ])
        );
        expect(summary).toMatchSnapshot();
    });
});

describe("computeRarity", () => {
    it("follows the stage unless the account is legendary", () => {
        expect(computeRarity("BASIC", 0, 0)).toBe("common");
        expect(computeRarity("STAGE 1", 500, 40)).toBe("uncommon");
        expect(computeRarity("STAGE 2", 9_999, 364)).toBe("rare");
        expect(computeRarity("STAGE 1", 10_000, 0)).toBe("legendary");
        expect(computeRarity("BASIC", 0, 365)).toBe("legendary");
    });
});

describe("pickAbility", () => {
    it("falls back to a tenure ability when nothing stands out", () => {
        const stats = analyzeSnapshot(loadFixture("asynced24"));
        const plain = {
            ...stats,
            totalStars: 0,
            languageCount: 1,
            accountAgeYears: 1,
            activity: { ...stats.activity, longestStreak: 1, activeWeeks: 2, reviews: 0, pullRequests: 0 },
            practices: { analyzedRepos: 0, signals: [] },
        };
        expect(pickAbility(plain).name).toBe("Rising Coder");
    });
});
