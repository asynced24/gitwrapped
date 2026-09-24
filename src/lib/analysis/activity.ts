import type { RawCalendarDay, RawContributions } from "@/lib/github/types";
import type { ActivityPattern, ActivitySummary, MonthlyContributions } from "@/types/github";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Share of weeks with at least one contribution needed for each pattern. */
export const PATTERN_THRESHOLDS = { steady: 0.75, regular: 0.4, bursty: 0.1 } as const;

/**
 * Summarise a year of GitHub's contribution calendar.
 *
 * `today` is the snapshot's fetch date (YYYY-MM-DD) so results are
 * reproducible from a saved snapshot. Days after `today` are ignored.
 */
export function analyzeActivity(contributions: RawContributions, today: string): ActivitySummary {
    const weeks = contributions.weeks
        .map(week => week.filter(d => d.date <= today))
        .filter(week => week.length > 0);
    const days = weeks.flat();

    const activeDays = days.filter(d => d.count > 0).length;
    const activeWeeks = weeks.filter(w => w.some(d => d.count > 0)).length;
    const totalWeeks = weeks.length;

    return {
        total: contributions.total,
        commits: contributions.commits,
        pullRequests: contributions.pullRequests,
        reviews: contributions.reviews,
        issues: contributions.issues,
        restricted: contributions.restricted,
        activeDays,
        totalDays: days.length,
        activeWeeks,
        totalWeeks,
        currentStreak: currentStreak(days, today),
        longestStreak: longestStreak(days),
        bestDay: bestDay(days),
        busiestWeekday: busiestWeekday(days),
        monthly: monthlyTotals(days, today),
        weeks,
        pattern: classifyPattern(activeWeeks, totalWeeks),
    };
}

export function classifyPattern(activeWeeks: number, totalWeeks: number): ActivityPattern {
    if (totalWeeks === 0) return "quiet";
    const ratio = activeWeeks / totalWeeks;
    if (ratio >= PATTERN_THRESHOLDS.steady) return "steady";
    if (ratio >= PATTERN_THRESHOLDS.regular) return "regular";
    if (ratio > PATTERN_THRESHOLDS.bursty) return "bursty";
    return "quiet";
}

/**
 * Consecutive active days ending today. Today not being active yet does not
 * break the streak (the day isn't over) — the same rule GitHub used.
 */
export function currentStreak(days: RawCalendarDay[], today: string): number {
    let i = days.length - 1;
    if (i >= 0 && days[i].date === today && days[i].count === 0) i--;
    let streak = 0;
    for (; i >= 0 && days[i].count > 0; i--) streak++;
    return streak;
}

export function longestStreak(days: RawCalendarDay[]): number {
    let best = 0;
    let run = 0;
    for (const day of days) {
        run = day.count > 0 ? run + 1 : 0;
        if (run > best) best = run;
    }
    return best;
}

function bestDay(days: RawCalendarDay[]): { date: string; count: number } | null {
    let best: RawCalendarDay | null = null;
    for (const day of days) {
        if (day.count > 0 && (!best || day.count > best.count)) best = day;
    }
    return best ? { date: best.date, count: best.count } : null;
}

function busiestWeekday(days: RawCalendarDay[]): string | null {
    const totals = new Array(7).fill(0);
    for (const day of days) {
        totals[new Date(`${day.date}T00:00:00Z`).getUTCDay()] += day.count;
    }
    const max = Math.max(...totals);
    return max > 0 ? WEEKDAYS[totals.indexOf(max)] : null;
}

/** The 12 calendar months ending with the month of `today`, oldest first. */
export function monthlyTotals(days: RawCalendarDay[], today: string): MonthlyContributions[] {
    const [year, month] = today.split("-").map(Number);
    const months: MonthlyContributions[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(year, month - 1 - i, 1));
        months.push({ month: d.toISOString().slice(0, 7), count: 0 });
    }
    const index = new Map(months.map((m, i) => [m.month, i]));
    for (const day of days) {
        const i = index.get(day.date.slice(0, 7));
        if (i !== undefined) months[i].count += day.count;
    }
    return months;
}
