import type { RawCalendarDay } from "@/lib/github/types";

interface ContributionHeatmapProps {
    weeks: RawCalendarDay[][];
}

/**
 * Quartile buckets over the user's own non-zero days, so a light contributor's
 * best day is as dark as a heavy contributor's — the same idea GitHub uses.
 */
function thresholds(weeks: RawCalendarDay[][]): number[] {
    const counts = weeks.flat().map(d => d.count).filter(c => c > 0).sort((a, b) => a - b);
    if (counts.length === 0) return [1, 1, 1];
    const q = (p: number) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))];
    return [q(0.25), q(0.5), q(0.75)];
}

function level(count: number, [q1, q2, q3]: number[]): number {
    if (count === 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
}

export function ContributionHeatmap({ weeks }: ContributionHeatmapProps) {
    const t = thresholds(weeks);
    // The first calendar week may start mid-week; pad so rows line up by weekday.
    const firstDay = weeks[0]?.[0] ? new Date(`${weeks[0][0].date}T00:00:00Z`).getUTCDay() : 0;

    return (
        <div className="heatmap" role="img" aria-label="Contribution calendar for the last 12 months">
            <div className="heatmap__grid">
                {weeks.map((week, wi) => (
                    <div key={week[0]?.date ?? wi} className="heatmap__week">
                        {wi === 0 && Array.from({ length: firstDay }).map((_, i) => (
                            <span key={`pad-${i}`} className="heatmap__cell heatmap__cell--pad" />
                        ))}
                        {week.map(day => (
                            <span
                                key={day.date}
                                className="heatmap__cell"
                                data-level={level(day.count, t)}
                                title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="heatmap__legend">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(l => (
                    <span key={l} className="heatmap__cell" data-level={l} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
