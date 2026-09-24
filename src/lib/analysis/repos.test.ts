import { describe, expect, it } from "vitest";
import { accountAge, busiestYear, isMaintained, rankByStars } from "./repos";
import { analyzeSnapshot } from ".";
import { FIXTURE_USERS, loadFixture, repo } from "./test-helpers";

describe("accountAge", () => {
    it("does not count a year until the anniversary day", () => {
        expect(accountAge("2020-09-25T00:00:00Z", new Date("2026-09-24T00:00:00Z"))).toEqual({ years: 5, months: 11 });
        expect(accountAge("2020-09-24T00:00:00Z", new Date("2026-09-24T00:00:00Z"))).toEqual({ years: 6, months: 0 });
    });
});

describe("rankByStars", () => {
    it("does not reorder the caller's array", () => {
        const repos = [repo({ stars: 1 }), repo({ stars: 9 })];
        const before = repos.map(r => r.id);
        rankByStars(repos);
        expect(repos.map(r => r.id)).toEqual(before);
    });
});

describe("isMaintained", () => {
    const now = new Date("2026-09-24T00:00:00Z");
    it("requires a push in the last 180 days and not archived", () => {
        expect(isMaintained(repo({ pushedAt: "2026-06-01T00:00:00Z" }), now)).toBe(true);
        expect(isMaintained(repo({ pushedAt: "2026-01-01T00:00:00Z" }), now)).toBe(false);
        expect(isMaintained(repo({ pushedAt: "2026-09-01T00:00:00Z", archived: true }), now)).toBe(false);
    });
});

describe("busiestYear", () => {
    it("prefers the later year on a tie", () => {
        expect(busiestYear({ 2019: 3, 2023: 3, 2021: 1 })).toBe(2023);
        expect(busiestYear({})).toBeNull();
    });
});

describe("analyzeSnapshot on real fixtures", () => {
    it.each(FIXTURE_USERS)("%s: totals come from own non-fork repos and stay internally consistent", username => {
        const snapshot = loadFixture(username);
        const stats = analyzeSnapshot(snapshot);

        expect(stats.totalStars).toBe(snapshot.repos.reduce((s, r) => s + r.stars, 0));
        expect(stats.analyzedRepoCount).toBeLessThanOrEqual(stats.ownRepoCount);
        expect(stats.maintainedRepoCount).toBeLessThanOrEqual(stats.repositories.length);
        expect(stats.activity.activeWeeks).toBeLessThanOrEqual(stats.activity.totalWeeks);
        expect(stats.activity.monthly.reduce((s, m) => s + m.count, 0)).toBeLessThanOrEqual(stats.activity.total);
        expect(stats.languageCount).toBe(stats.programmingLanguages.length);
        expect(stats.topRepositories.map(r => r.stargazers_count)).toEqual(
            [...stats.topRepositories.map(r => r.stargazers_count)].sort((a, b) => b - a)
        );
    });

    it("is deterministic for a given snapshot", () => {
        const snapshot = loadFixture("gaearon");
        expect(analyzeSnapshot(snapshot)).toEqual(analyzeSnapshot(snapshot));
    });
});
