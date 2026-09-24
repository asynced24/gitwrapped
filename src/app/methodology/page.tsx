import type { Metadata } from "next";
import Link from "next/link";
import { PATTERN_THRESHOLDS } from "@/lib/analysis/activity";
import { POPULAR_REPO_STARS, RECENT_DAYS } from "@/lib/analysis";
import { MEANINGFUL_BYTE_SHARE, MEANINGFUL_PRIMARY_REPOS } from "@/lib/analysis/languages";
import { MAINTAINED_WITHIN_DAYS } from "@/lib/analysis/repos";
import { HP_RANGE } from "@/lib/card";
import { SNAPSHOT_TTL_SECONDS } from "@/lib/profile";

export const metadata: Metadata = {
    title: "Methodology | GitWrapped",
    description: "Where every GitWrapped number comes from: data sources, formulas and known limits.",
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

/*
 * Thresholds below are imported from the code that computes them, so this
 * page cannot drift from the real formulas.
 */
export default function MethodologyPage() {
    return (
        <main className="methodology">
            <nav className="methodology__nav">
                <Link href="/">← GitWrapped</Link>
            </nav>

            <h1>How every number is calculated</h1>
            <p className="methodology__lede">
                GitWrapped only shows what GitHub&apos;s public API can back up. Each figure below lists its source
                and formula. If a number can&apos;t be measured, it isn&apos;t shown.
            </p>

            <section>
                <h2>Data source</h2>
                <ul>
                    <li>
                        <strong>GitHub GraphQL API</strong>, read with a token that has no scopes (public data only).
                        A profile costs 2 requests plus one per 20 repos for file listings, and one more per extra
                        100 repos for accounts with more than 100.
                    </li>
                    <li>
                        <strong>Repos analysed:</strong> your 100 most recently pushed <em>public, non-fork</em> repos you
                        own. Forks are excluded everywhere, including star counts.
                    </li>
                    <li>
                        <strong>Freshness:</strong> results are cached for {SNAPSHOT_TTL_SECONDS / 60} minutes. Every
                        &ldquo;last 30 days&rdquo; style figure is measured from the moment the data was fetched.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Activity</h2>
                <p>
                    From GitHub&apos;s contribution calendar for the last 12 months, the same data as the green grid on
                    your profile. It counts commits, pull requests, reviews and issues. Private contributions appear
                    as a count only, and only if you enabled &ldquo;Include private contributions&rdquo; on GitHub.
                </p>
                <table>
                    <tbody>
                        <tr><td>Active weeks</td><td>Calendar weeks with at least one contribution.</td></tr>
                        <tr><td>Longest streak</td><td>Most consecutive days with a contribution.</td></tr>
                        <tr><td>Current streak</td><td>Consecutive active days ending today; an empty today doesn&apos;t break it.</td></tr>
                        <tr>
                            <td>Pattern</td>
                            <td>
                                Steady ≥ {pct(PATTERN_THRESHOLDS.steady)} of weeks active, regular ≥ {pct(PATTERN_THRESHOLDS.regular)},
                                bursty &gt; {pct(PATTERN_THRESHOLDS.bursty)}, otherwise quiet.
                            </td>
                        </tr>
                        <tr><td>Recently active</td><td>A contribution or push in the last {RECENT_DAYS} days.</td></tr>
                    </tbody>
                </table>
            </section>

            <section>
                <h2>Languages</h2>
                <p>
                    Byte counts from GitHub Linguist across analysed repos. Markup, styles, build files and notebooks
                    show in the breakdown but don&apos;t count as programming languages. A language counts toward
                    &ldquo;languages used&rdquo; only if it is at least {MEANINGFUL_BYTE_SHARE}% of your code, or the
                    main language of {MEANINGFUL_PRIMARY_REPOS}+ repos, so a stray script doesn&apos;t make you a polyglot.
                </p>
            </section>

            <section>
                <h2>Engineering practices</h2>
                <p>
                    For each analysed, non-archived repo we read the file names at the repo root and in
                    <code>.github/workflows</code>, then report the share of repos where each practice appears.
                    Only exact names count (e.g. <code>tests/</code>, <code>vitest.config.ts</code>,
                    <code>conftest.py</code>, <code>*_test.go</code>), so a folder called <code>latest/</code> is not a
                    test suite. This checks whether a practice is set up, not how good it is.
                </p>
            </section>

            <section>
                <h2>The dev card</h2>
                <p>
                    Each stat is one real metric. Volume-type stats use a log scale, so a 10k-star account and a 250k-star
                    account still get different numbers. HP and damage round to 10, like a printed card.
                </p>
                <table>
                    <tbody>
                        <tr>
                            <td>HP ({HP_RANGE.min}–{HP_RANGE.max})</td>
                            <td>{HP_RANGE.min} + 200 × share of weeks active + 100 × min(1, years on GitHub ÷ 10). Rewards showing up steadily over a long time.</td>
                        </tr>
                        <tr>
                            <td>Light attack (10–120)</td>
                            <td>10 + 110 × log-scale(contributions in 12 months, full at 3,000).</td>
                        </tr>
                        <tr>
                            <td>Heavy attack (20–200)</td>
                            <td>20 + 180 × log-scale(stars on your most starred repo, full at 20,000).</td>
                        </tr>
                        <tr>
                            <td>Ability</td>
                            <td>
                                Your most exceptional trait. Each candidate is scored against its own bar: a 30-day streak,
                                90% of weeks active, 200 stars, 6 languages, 100 reviews, 100 PRs, 12 years, CI in 60% of
                                repos, tests in 50%. The highest ratio wins. If nothing reaches half its bar, you get a
                                tenure ability.
                            </td>
                        </tr>
                        <tr>
                            <td>Retreat (0–4)</td>
                            <td>1 per 2 repos pushed in the last {MAINTAINED_WITHIN_DAYS} days (the live projects you&apos;d walk away from).</td>
                        </tr>
                        <tr>
                            <td>Stage</td>
                            <td>Basic under 2 years or very little activity; Stage 2 at 5+ years with 50%+ active weeks or 100+ stars; otherwise Stage 1.</td>
                        </tr>
                        <tr>
                            <td>Type</td>
                            <td>Your top programming language by bytes.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section>
                <h2>Known limits</h2>
                <ul>
                    <li>Contributions to other people&apos;s and organisation repos count toward activity, but only repos you own are analysed for languages and practices.</li>
                    <li>For accounts with hundreds of starred repos, star totals stop after the 500 most starred and are marked as a lower bound.</li>
                    <li>&ldquo;Popular repo&rdquo; means {POPULAR_REPO_STARS}+ stars. It&apos;s an arbitrary line, and it&apos;s stated here so you can judge it.</li>
                    <li>Nothing here measures code quality. It measures what is visible on GitHub.</li>
                </ul>
            </section>
        </main>
    );
}
