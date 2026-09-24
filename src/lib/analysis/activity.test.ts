import { describe, expect, it } from "vitest";
import { analyzeActivity, classifyPattern, currentStreak, longestStreak, monthlyTotals } from "./activity";
import type { RawCalendarDay, RawContributions } from "@/lib/github/types";

/** Build consecutive calendar days starting at `start` from a list of counts. */
function days(start: string, counts: number[]): RawCalendarDay[] {
    const t0 = Date.parse(`${start}T00:00:00Z`);
    return counts.map((count, i) => ({ date: new Date(t0 + i * 864e5).toISOString().slice(0, 10), count }));
}

function weeksOf(list: RawCalendarDay[]): RawCalendarDay[][] {
    const weeks: RawCalendarDay[][] = [];
    for (let i = 0; i < list.length; i += 7) weeks.push(list.slice(i, i + 7));
    return weeks;
}

function contributions(list: RawCalendarDay[]): RawContributions {
    const total = list.reduce((s, d) => s + d.count, 0);
    return { total, commits: total, pullRequests: 0, reviews: 0, issues: 0, restricted: 0, weeks: weeksOf(list) };
}

describe("streaks", () => {
    it("counts the longest run of active days", () => {
        expect(longestStreak(days("2026-01-01", [1, 1, 0, 1, 1, 1, 0, 2]))).toBe(3);
        expect(longestStreak(days("2026-01-01", [0, 0, 0]))).toBe(0);
    });

    it("does not break the current streak on an unfinished, empty today", () => {
        const list = days("2026-01-01", [0, 1, 1, 1, 0]); // today = Jan 5, empty
        expect(currentStreak(list, "2026-01-05")).toBe(3);
    });

    it("is zero when yesterday was empty", () => {
        const list = days("2026-01-01", [1, 1, 0, 0]);
        expect(currentStreak(list, "2026-01-04")).toBe(0);
    });

    it("includes today when today already has contributions", () => {
        const list = days("2026-01-01", [0, 1, 1]);
        expect(currentStreak(list, "2026-01-03")).toBe(2);
    });
});

describe("classifyPattern", () => {
    it.each([
        [52, 52, "steady"],
        [39, 52, "steady"],
        [21, 52, "regular"],
        [6, 52, "bursty"],
        [5, 52, "quiet"],
        [0, 0, "quiet"],
    ])("%i of %i weeks is %s", (active, total, pattern) => {
        expect(classifyPattern(active, total)).toBe(pattern);
    });
});

describe("monthlyTotals", () => {
    it("returns the 12 months ending in the current month, crossing a year boundary", () => {
        const months = monthlyTotals(days("2025-12-30", [2, 3, 4]), "2026-01-01");
        expect(months).toHaveLength(12);
        expect(months[0].month).toBe("2025-02");
        expect(months.at(-1)).toEqual({ month: "2026-01", count: 4 });
        expect(months.at(-2)).toEqual({ month: "2025-12", count: 5 });
    });
});

describe("analyzeActivity", () => {
    it("ignores calendar days after the snapshot date", () => {
        const list = days("2026-01-04", [1, 0, 1, 1, 5, 5, 5]); // Sun..Sat
        const summary = analyzeActivity(contributions(list), "2026-01-07");
        expect(summary.totalDays).toBe(4);
        expect(summary.activeDays).toBe(3);
        expect(summary.bestDay).toEqual({ date: "2026-01-04", count: 1 });
    });

    it("counts active weeks from the real calendar, not repo push dates", () => {
        // 10 weeks, only weeks 1, 4 and 9 have any contribution.
        const counts = new Array(70).fill(0);
        counts[3] = 4;
        counts[23] = 1;
        counts[60] = 2;
        const summary = analyzeActivity(contributions(days("2025-11-02", counts)), "2026-01-10");
        expect(summary.activeWeeks).toBe(3);
        expect(summary.totalWeeks).toBe(10);
        expect(summary.pattern).toBe("bursty");
        expect(summary.busiestWeekday).toBe("Wednesday");
    });
});
