import { describe, expect, it } from "vitest";
import type { RawSnapshot } from "@/lib/github/types";
import { analyzeSnapshot } from ".";
import { loadFixture, repo } from "./test-helpers";

function snapshotWith(repos: RawSnapshot["repos"], repoTotal: number, starTotalsComplete = true): RawSnapshot {
    return { ...loadFixture("asynced24"), repos, repoTotal, starTotalsComplete };
}

describe("analyzeSnapshot totals", () => {
    it("reports complete fork totals when every owned repo was listed", () => {
        const stats = analyzeSnapshot(snapshotWith([repo({ forks: 2 }), repo({ forks: 1 })], 2));
        expect(stats.totalForks).toBe(3);
        expect(stats.forkTotalsComplete).toBe(true);
    });

    it("marks fork totals a lower bound when star paging stopped early, even if stars are complete", () => {
        // 250 owned repos, only 3 listed: star paging stopped at the first zero-star
        // repo, which is exact for stars but skips zero-star repos that have forks.
        const listed = [repo({ stars: 10, forks: 4 }), repo({ stars: 1 }), repo({ stars: 0 })];
        const stats = analyzeSnapshot(snapshotWith(listed, 250, true));
        expect(stats.starTotalsComplete).toBe(true);
        expect(stats.totalForks).toBe(4);
        expect(stats.forkTotalsComplete).toBe(false);
    });
});
