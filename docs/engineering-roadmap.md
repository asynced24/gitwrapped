# GitWrapped engineering audit and roadmap (2026-10-10)

Baseline before any change: lint 0 errors (2 `<img>` warnings), typecheck clean, 117/117 tests, production build green.
After the fixes on `fix/data-correctness`: 124/124 tests, build green.

## 1. How it works today

```
/dashboard/[u]  /api/card/[u]  /api/badge/[u]  /generate
        \             |              |            /
         getProfile(u)  — React cache(), one lookup per request      src/lib/profile.ts
              |
         unstable_cache(raw snapshot, 1h, successes only)            src/lib/profile.ts
              |
         collectSnapshot(u)                                          src/lib/github/collect.ts
           User ─┬─ (repos > 100) ReposByStars pages, serial, ≤ 5
           Recent┴─ RepoTrees batches of 20, parallel, allSettled
              |
         analyzeSnapshot(snapshot) — pure, "now" = fetchedAt         src/lib/analysis/index.ts
              |
         dashboard / WrappedStory / buildCardData → renderCardSVG
```

## 2. What is already well engineered (keep it)

- **The raw snapshot is cached, not the analysis.** Formula changes ship without waiting for cache expiry (`profile.ts`).
- **Only successes are cached.** A rate limit or outage is never stored (`client.ts` throws a typed `GitHubError`).
- **Typed failure kinds** (`not-found | rate-limited | upstream | config`) drive different pages, cards and cache lifetimes.
- **Pure, deterministic analysis.** Time-relative values use `snapshot.fetchedAt`, and real-account fixtures replay offline.
- **"Unknown" is separate from "empty".** `rootEntries: null` keeps repos with failed lookups out of practice denominators.
- **The GraphQL rewrite cut request counts by an order of magnitude.** It went from 67/78/91 REST calls to 3/3/6 GraphQL requests, measured with `scripts/count-calls.ts`.
- **The methodology page imports the same constants** as the code, so the docs can't drift from it.

## 3. Findings

### Confirmed and fixed on `fix/data-correctness` (uncommitted, not pushed)

| # | Finding | Evidence | Fix | Test |
|---|---|---|---|---|
| 1 | **Fork totals were reported as exact when they were not.** Star paging stops at the first zero-star repo. That is exact for stars but skips zero-star repos that still have forks. `starTotalsComplete` was also used to describe forks. | `collect.ts` `fetchReposByStars`, `types/github.ts` comment | New `forkTotalsComplete` = every owned repo listed. The card shows `N+`, and methodology explains why. | `analysis/index.test.ts` |
| 2 | **A tree field error counted as an empty repo.** GitHub returns `root: null` plus an error at `["nodes", i, "root"]`. The code read that as "no files", which dragged every practice share down. | `collect.ts` `toDetailedRepo`, `client.ts` dropped partial errors silently | `githubGraphQL` gets an opt-in `onPartialErrors`. The tree batch drops the errored nodes as unknown. | `collect.test.ts`, `client.test.ts` |
| 3 | **A NOT_FOUND on one node discarded its whole batch of 20.** One deleted repo threw `not-found` for the entire tree batch. | `client.ts` NOT_FOUND branch runs before the partial-data branch | Opted-in callers get partial data, and only that node is lost. A rate limit is still fatal. | `client.test.ts` |
| 4 | **The badge said "User not found" for every failure,** including rate limits and outages. | `badge/route.ts` bare `catch` | Error-kind text and cache lifetimes match the card route: 3600s for not-found, 60–120s for transient errors. | `badge/route.test.ts` |

### Confirmed, not fixed (each needs a design decision)

5. **A public page can exhaust the whole app's GitHub quota.** `/dashboard/[username]` has no rate limit. Each *uncached* username costs at least 3 GraphQL requests against one token's 5,000 points/hour, so a script enumerating usernames can drain it. Once it is drained, every new visitor sees the rate-limited page for up to an hour. The card and badge routes limit per IP, but the scarce resource is the **global token budget**, not one IP's request rate.
6. **The rate limiter does not match the deployment model.** Without Upstash it is an in-memory `Map` per serverless instance, which the file itself says. I couldn't check from here whether Upstash env vars are set on Vercel. On Vercel, `x-forwarded-for` is set by the platform, so the IP key itself is fine.
7. **"Language eras" (shown as "How your stack evolved") is not historical.** It groups repos by *creation year* and weights them by *today's* language bytes. It also only covers the 100 most recently pushed repos, so older eras are under-sampled for big accounts. `busiestYear` means "most repos created", and it is computed but not shown.
8. **`unstable_cache` is legacy in Next 16.** The replacement is `"use cache"` + `cacheLife`. It still works, and migrating it alone has no user value. Do it only as part of initiative 1 if it simplifies stale fallback.

### Hypotheses that still need reproduction

- **Duplicate fetches under concurrency.** I don't believe `unstable_cache` coalesces concurrent misses for the same key, which would mean N simultaneous first visits cause N full collections. This needs measuring with `next start` and a mock GitHub, not assuming.
- **Real-world frequency of tree field errors.** The code path is now correct either way. Whether it happens in production is unknown, because partial errors were never logged.

### Test gaps

- No test hits a route through `next start`.
- No concurrency or cache-expiry tests.
- No browser journey (enter username → dashboard → story → card download).
- CI has no `permissions:` block, and its actions are pinned by tag, not SHA.

## 4. Recommended first milestone: three initiatives

### I-1 (P0) Make the GitHub budget a first-class, measured constraint: **done**

Shipped as in-flight dedup plus a budget gate. Stale fallback was dropped because the benchmark showed it already works. Results: [case-studies/github-budget.md](case-studies/github-budget.md).

| | |
|---|---|
| Problem | One token's quota is shared by every visitor. Uncached lookups are unbounded (finding 5), and concurrent duplicates are suspected. |
| Evidence | Findings 5 and 6. The duplicate-fetch hypothesis gets measured first. |
| User impact | When the budget is gone, *every* visitor gets an error page, including people whose README cards are cached. |
| Engineering depth | Global coordination with no shared store. **GitHub's own `rateLimit { remaining resetAt cost }` already holds the shared state for the whole fleet,** so every instance can read it for free. On top of that: per-instance in-flight dedup, a reserve threshold that refuses *new* usernames while still serving cached ones, and a last-known-good snapshot served with a "stale" label when GitHub fails. |
| Approach | 1) Build a benchmark harness: a mock GraphQL server from the existing fixtures with injectable latency and errors, plus `next start` and a load script that reports p50/p95, upstream request count and duplicates. 2) Record the baseline. 3) Add `rateLimit` to the queries and a budget gate in `profile.ts`. 4) Add in-flight dedup. 5) Add a long-TTL last-good key for stale fallback. 6) Re-measure on the same workload. |
| Alternatives | Upstash/Redis has a free tier, but it brings billing risk and an extra dependency to solve a problem GitHub's own counter already solves. Per-IP limits alone don't protect a global budget. |
| Validation | Before/after numbers from the harness, plus deterministic tests for the gate, dedup and stale paths. |
| Risk | The gate wrongly refusing users. Mitigations: a conservative threshold, and cached users are never gated. |
| Cost | $0 |

### I-2 (P0) Metric provenance: every number says what it is

| | |
|---|---|
| Problem | Completeness lives in scattered booleans (`starTotalsComplete`, `forkTotalsComplete`, `practices.analyzedRepos`), and some labels overclaim (finding 7). |
| User impact | Users can trust the numbers, and a "How is this calculated?" link sits on each stat without cluttering the page. |
| Engineering depth | Analysis returns `Metric<T> = { value, basis: observed\|derived\|heuristic, completeness: complete\|lowerBound\|partial\|unavailable, source, window, sample: {included, total}, limitations[] }`. The UI and `/methodology` render from those same definitions. |
| Approach | Wrap the roughly 12 headline metrics first, without re-plumbing every field. Relabel language eras as "Languages of repos you started each year (as they look today)", or hide it below a sample threshold. |
| Alternatives | More footnotes on the methodology page don't scale and drift from the code. |
| Validation | Table-driven tests on fixtures: a big account gives `lowerBound`, a failed tree gives `partial` with the right denominator, an empty account gives `unavailable`. |
| Risk | UI noise. Keep it to one subtle affordance per stat. |
| Cost | $0 |

### I-3 (P1) Annual GitWrapped (`/wrapped/[username]/[year]`): recommended, with a hard data rule

- **Feasible and honest if built *only* on `contributionsCollection(from, to)`.** GitHub reconstructs that data historically: the calendar, commit/PR/review/issue totals, `commitContributionsByRepository` and `contributionYears`. It costs about 1 request per year.
- **Past years are immutable,** so they can be cached for days instead of 1 hour, which also helps I-1.
- **Present-day repo metadata stays out of the year story:** no stars, no languages-by-bytes and no practices.
- **It reuses the existing WrappedStory slides and card rendering.**
- **Sequencing:** it goes after I-1 and I-2, because it multiplies lookups per user and its insights should carry provenance from day one.

### Deferred or small

- **CI hardening (quick, P1):** a `permissions: contents: read` block, SHA-pinned actions, an `npm audit --omit=dev` step, and one Playwright smoke journey against the mock GitHub.
- **`/engineering` page and Lab (P2):** worth doing after I-1, because its scenarios (cold vs warm, concurrent, timeout, rate limit, partial tree) are exactly the harness's fixtures. Built earlier it would be a toy simulation.

### Explicitly not building

- Redis/Kafka/K8s/Terraform/Prometheus.
- A database for snapshots.
- AI-written skill judgements.
- Cross-user rankings.
- A `"use cache"` migration for its own sake.

## 5. Interview-defensible claim available today

"Rewrote the GitHub data layer from REST to batched GraphQL: 67/78/91 → 3/3/6 upstream requests per profile on three real accounts, measured with a reproducible script; distinguished unknown from empty data so partial upstream failures no longer skew engineering-practice percentages."
