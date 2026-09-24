# Honest metrics upgrade — design

Date: 2026-09-24 · Branch: `upgrade/honest-metrics`

## Problem

Measured on `main` (`1c22843`), cold cache, token set:

| User | Dashboard API calls | Dashboard time | Card API calls |
|---|---|---|---|
| asynced24 | 78 | 5.7 s | 13 |
| torvalds | 67 | 4.1 s | 12 |
| gaearon | 91 | 7.5 s | 13 |

Card output on `main` for four real users: every user gets the *Polyglot* ability,
light attack is 10 for all four, retreat cost is 4 for all four, and torvalds and
gaearon both saturate at HP 340 / XP 9999 / 200 damage.

Root causes:

1. "Consistency", "active months", the activity chart and part of HP are derived from
   each repo's single `pushed_at` timestamp — one point per repo, not activity over time.
2. Two independent pipelines (`fetchUserStats`, `fetchCardStatsEdge`) compute the same
   metrics with different inputs (20 vs 10 repos, 1000 vs 100 repos), so the card and
   the dashboard disagree.
3. `codeHealth` costs ~50 REST calls per load and is not rendered anywhere.
4. Every failure (rate limit, timeout, 404) renders "user not found".
5. Heuristic bugs: `includes('test')` matches `latest/`, in-place `.sort()` changes which
   repos later analyzers see, stars on forks count toward totals.
6. Card formulas are linear with hard caps, so they saturate and stop discriminating.
7. No tests, no CI, 8 lint errors.

## Design

### Layers

```
src/lib/github/client.ts    GraphQL transport, timeout, typed errors
src/lib/github/queries.ts   the two queries (profile, repo-page)
src/lib/github/collect.ts   username -> RawSnapshot (network only)
src/lib/analysis/*.ts       RawSnapshot -> metrics (pure, unit tested)
src/lib/profile.ts          getProfile(username) = analyze(collect(username))
src/lib/card.ts             Profile -> PokemonCardData (pure)
```

The dashboard, card route, badge route and generate page all go through `getProfile`.
Nothing outside `src/lib/github/` calls GitHub.

### Data collection

One GraphQL request returns user fields, the last-year contribution calendar with
per-type totals, and the 100 most recently pushed owned non-fork public repos with
languages (bytes), root tree entries, `.github/workflows` entries and topics. If the
user owns more than 100 repos, lightweight pages (stars/forks/dates/primary language
only) are fetched to complete totals, capped at 10 pages. Responses are cached with
`next.revalidate = 3600`.

Errors: `GitHubNotFoundError`, `GitHubRateLimitError(resetAt)`, `GitHubUpstreamError`,
`GitHubConfigError` (no token). The dashboard maps not-found to `notFound()` and the rest
to an error page naming the cause; the card route returns a distinct error SVG per cause.

### Metrics (all derived from the snapshot, each with a documented formula)

- **Activity** (from the daily calendar): total contributions, commits / PRs / reviews /
  issues split, active days, active weeks out of 52, current and longest streak,
  12 monthly totals, busiest weekday, pattern (`steady` ≥ 75% active weeks, `regular`
  ≥ 40%, `bursty` > 10%, `quiet`).
- **Languages**: bytes across analyzed repos, markup and notebooks excluded from
  programming languages; a language counts toward "languages used" only if it is ≥ 2%
  of bytes or the primary language of ≥ 2 repos.
- **Practices** (share of analyzed repos): CI, tests, containers, IaC, license, README,
  deploy config. Exact-name matching, no substring guesses.
- **Repos**: stars/forks on owned non-fork repos only; maintained = pushed in last 180 days.

### Card redesign

Every number on the card maps to one real metric, uses a log scale so large accounts
still differ, and HP/damage are rounded to 10 like a real card.

| Card element | Source |
|---|---|
| HP (40–340) | active weeks, contribution volume (log), account age |
| Light attack | commits in the last year (log) — description states the count |
| Heavy attack | stars on the top repo (log) — description names the repo |
| Ability | the user's most exceptional trait among streak, stars, languages, reviews, PRs, tenure, CI adoption, test adoption |
| Retreat cost | number of maintained repos |
| Stage | tenure + activity level |
| Footer | `N contributions · W/52 active weeks` (replaces XP / velocity) |

The dashboard card view shows a "Why these numbers" breakdown with each input value.

### Dashboard

- Contribution heatmap (52 weeks) + monthly contributions chart replace the repo-push chart.
- Stat row: contributions, active weeks, longest streak, current streak.
- "Engineering practices" section shows `x of N repos` per practice.
- New `/methodology` page documents every formula.

### Reliability

- Rate limiter: Upstash REST when `UPSTASH_REDIS_REST_URL`/`TOKEN` are set; otherwise
  the per-instance in-memory limiter, documented as best-effort.
- Card SVG snapshot tests from fixture snapshots.

### Removed

`codeHealth` and its analyzers (unrendered), `TechStackCard`, `DeveloperCard` (unused),
the edge-only duplicate pipeline.

## Testing

- Vitest unit tests for every analysis module and card mapping, from JSON fixtures.
- Card SVG snapshot test.
- CI: lint, typecheck, test, build on every PR.
- Visual check of card (SVG + React) and dashboard in the browser for 4 real users,
  compared to the `main` baseline.
- Re-run `scripts/count-calls.ts` for before/after numbers.
