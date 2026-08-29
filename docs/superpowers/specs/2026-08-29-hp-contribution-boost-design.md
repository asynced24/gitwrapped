# HP Contribution Boost — Design

## Problem

The Pokemon card's HP stat (`computeHP` in `src/lib/card.ts`) never reflects a
user's actual GitHub contribution activity — public or private. It's computed
from:

```
raw = 100 + contributionConsistency * 80 + totalStars * 2 + ageYears * 10
```

`contributionConsistency` is not a commit/contribution count. It's the ratio
of distinct calendar months in which *any* of the user's **public, owned**
repos received a push (`repos[].pushed_at`), derived entirely from REST API
calls (`/users/{username}/repos`). This means:

- A repo with 500 commits in a month counts identically to one with 1 commit.
- Contributions to repos the user doesn't own (other people's/orgs' repos)
  are invisible — REST `/users/{username}/repos` only returns repos owned by
  that user.
- Private repo activity is invisible — REST `/users/{username}/repos` only
  returns public repos when called for an arbitrary username without that
  user's own authenticated token.

The user has 600+ contributions on their GitHub profile (with "Include
private contributions on my profile" enabled) and expects that to move HP.
Today it has zero influence.

## Root cause

GitHub only exposes real contribution counts (commits + PRs + issues +
reviews, and private contributions when the profile owner has opted in via
the "Include private contributions" setting) through the **GraphQL API's**
`contributionsCollection` field. This codebase makes no GraphQL calls
anywhere — it's REST-only. Because GitWrapped is a public, no-login tool
(anyone can look up anyone's card), and because GitHub publicly exposes the
opted-in private contribution *total* (not per-repo detail) to any caller,
no additional auth/token scope is needed — just a GraphQL call GitWrapped
doesn't currently make.

## Decisions from brainstorming

- HP change is additive: a new contribution-based term alongside the
  existing consistency/stars/age terms (not a replacement).
- Scope is HP only — no new dashboard UI, no Wrapped-story changes.
- Use **last 12 months** of contributions (matches the default GitHub
  profile view, one GraphQL call) rather than lifetime total (would need one
  GraphQL call per active year).

## Design

### 1. New shared fetcher: `src/lib/contributions.ts`

```ts
export async function fetchContributionsLastYear(username: string): Promise<number>
```

- POSTs a GraphQL query to `https://api.github.com/graphql`:
  ```graphql
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { totalContributions }
      }
    }
  }
  ```
  with `from` = now minus 1 year, `to` = now.
- Uses the existing `GITHUB_TOKEN` env var (same token already used for
  REST calls elsewhere in this codebase). GraphQL requires *some* valid
  token even for public data (unlike REST, which allows fully anonymous
  access at a lower rate limit) — but no additional scope/permission beyond
  what's already recommended (a no-permissions fine-grained PAT) is needed,
  since contribution totals are public profile data.
- Pure `fetch`, no Node-only APIs — usable from both the Node runtime
  (`github.ts`) and the Edge runtime (`card.ts`'s edge-compatible path)
  without a separate edge-only copy.
- **Never throws.** Missing token, network failure, non-OK response, or
  malformed JSON all resolve to `0`. This matches the graceful-degradation
  pattern already used throughout `github.ts` (e.g. `fetchRepoContents`'s
  catch blocks) and specifically avoids breaking card generation for
  self-hosted instances that haven't set `GITHUB_TOKEN`.
- Uses an `AbortController` timeout (~5s), consistent with the existing
  edge-compatible fetch helpers in `card.ts`.

### 2. Wiring

- `UserStats` (`src/types/github.ts`) gains `recentContributions: number`.
- `fetchUserStats` (`src/lib/github.ts`) calls `fetchContributionsLastYear`
  in parallel with the existing `fetchUser`/`fetchRepositories` calls and
  includes the result in the returned `UserStats`.
- `fetchCardStatsEdge` (`src/lib/card.ts`) — which intentionally does *not*
  call `fetchUserStats`, to stay lightweight for the edge card route — calls
  `fetchContributionsLastYear` directly, in parallel with its own
  `fetchUserEdge`/`fetchRepositoriesEdge` calls.
- `buildCardData` reads `stats.recentContributions` and passes it into
  `computeHP`.

### 3. HP formula change (`src/lib/card.ts`)

`computeHP` gains a 4th parameter, added as its own additive term:

```ts
function computeHP(
    contributionConsistency: number,
    totalStars: number,
    ageYears: number,
    recentContributions: number
): number {
    const contributionBoost = Math.min(recentContributions * 0.15, 130);
    const raw = 100
        + contributionConsistency * 80
        + totalStars * 2
        + ageYears * 10
        + contributionBoost;
    return Math.min(Math.max(Math.round(raw), 100), 340); // ceiling unchanged
}
```

600 contributions/year → `+90` HP. The `0.15` multiplier and `130` cap are
starting points, treated as tunable — this is a game-balance judgment call,
not a technical one. All call sites of `computeHP` (in `buildCardData` and
`fetchCardStatsEdge`) are updated to pass the new argument.

## Out of scope

- No new dashboard stat/component displaying raw contribution count.
- No lifetime-total aggregation (would require one GraphQL call per active
  year).
- No changes to the existing consistency/stars/age terms or their weights.
- No changes to the Wrapped story narrative or experience-tier messaging.

## Risks / things to verify during implementation

- Confirm a no-permissions fine-grained PAT can actually read another
  user's `contributionsCollection` via GraphQL (expected to work, since
  it's public profile data, but should be verified against the real GitHub
  API once implemented).
- Confirm `process.env.GITHUB_TOKEN` is reliably available in the Edge
  runtime at request time (the existing `fetchGitHubEdge` in `card.ts`
  already relies on this today, so this is a known-working pattern, not new
  risk).
