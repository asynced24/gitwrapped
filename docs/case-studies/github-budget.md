# Case study: one GitHub token, many visitors

## Problem

Every GitWrapped page is computed from GitHub's GraphQL API using **one token**, which has a budget of 5,000 points per hour.

- **A cached profile costs nothing.** An uncached one costs 3 to 6 requests.
- **The budget is shared by all visitors.** When it runs out, nobody can load a new profile until the window resets.

The audit ([engineering-roadmap.md](../engineering-roadmap.md)) raised three suspicions:

1. Simultaneous first visits to one profile each run a full collection.
2. Once the budget is gone, the app keeps sending requests that GitHub refuses.
3. Nothing stops new usernames from draining the last of the budget.

## Constraints

- **$0.** No Redis, no database, no new services.
- **Serverless.** Process memory is per instance. A process-local counter is not a global one.
- **Cached profiles must keep working** no matter what happens to the budget.

## Measure first

`npm run bench -- <label>` builds the app and runs `next start` against a mock GitHub ([mock-github.ts](../../scripts/bench/mock-github.ts)).

- **The mock replays the recorded real-account fixtures.** It charges one point per request and sends GitHub's `x-ratelimit-*` headers.
- **Latency is synthetic and local.** The mock sleeps a fixed time per query, so the latency numbers compare runs with each other and say nothing about production.

The four scenarios are in [run.ts](../../scripts/bench/run.ts):

| Scenario | Baseline | After | |
|---|---|---|---|
| **1. 20 simultaneous first visits, one profile** | 20 collections, 60 GitHub requests | **1 collection, 3 requests** | p50 1568 → 1274 ms |
| **2. 200 cached requests, 10 at a time** | 0 GitHub requests, p95 100 ms | 0 GitHub requests, p95 58 ms | unchanged path |
| **3. GitHub down after the cache expired** | 3/3 served (200) | 3/3 served (200) | already handled, see below |
| **4. 80 new usernames, 120 points left:** GitHub requests | 216 | **126** | |
| **4.** requests GitHub refused | 108 | **4** | |
| **4.** profiles served | 32 | 31 | the 2% reserve, see limitations |
| **4.** GitHub requests for 11 new users after exhaustion | 22 | **0** | |
| **4.** cached profile after exhaustion | 200 | 200 | |

- **Raw results:** `bench/results/baseline.json` and `bench/results/after.json`.
- **Run order:** the after run executes scenario 3 before scenario 4, because scenario 4 leaves the gate believing the budget is spent. The baseline has no gate state, so its scenarios don't depend on order.

## Decisions

### 1. In-flight deduplication ([profile.ts](../../src/lib/profile.ts))

**What we measured:** `unstable_cache` does not coalesce concurrent misses. Twenty simultaneous first visits ran twenty collections.

**The fix:** a `Map<login, Promise>` shares the pending collection, and the entry is deleted when the promise settles. A failure is shared too, so twenty requests don't retry a dead upstream twenty times, and the next request after it retries cleanly.

**Scope:** this works per instance. On Vercel's fluid compute, concurrent requests share instances, which is where this matters. Two instances can still each collect once. That is bounded, and it doesn't justify a distributed lock.

### 2. A budget gate that uses GitHub as the shared state ([budget.ts](../../src/lib/github/budget.ts))

**The insight:** the fleet-wide counter already exists. GitHub reports `x-ratelimit-remaining` and `-reset` for the token on every response, so every instance learns what *all* instances have spent on its next response. Nothing else needs to be stored.

There are two gates:

- **`assertCanRequest`** runs before every request. After GitHub has refused one, it sends nothing more until the window resets. Before this, every new username after exhaustion still cost 2 requests that GitHub refused. On real GitHub, repeated requests after exhaustion are what trigger secondary limits.
- **`assertCanStartCollection`** runs before a cache miss starts collecting. Below a 2% reserve (100 of 5,000) it refuses to *start* new profiles, so collections already under way can finish and their spent points aren't wasted.

**What visitors see:** a refusal is an ordinary `rate-limited` `GitHubError` with GitHub's reset time. The dashboard says when to come back, and the card and badge fall back to a short-cache "busy" image.

**Cached profiles are never gated,** because the gate only runs inside the cache-miss path.

### 3. Stale fallback: not built

The plan proposed serving a last-known-good snapshot when GitHub fails. Scenario 3 showed it already happens: `unstable_cache` serves an expired entry and revalidates in the background, and a failed revalidation leaves the old entry in place. Building it again would have been dead code.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Upstash/Redis counter** | It has a free tier, but it adds billing risk, a network hop on every request, and a second source of truth for a number GitHub already reports. |
| **Per-IP limit on the dashboard** | It doesn't protect a *global* budget from many IPs. It is also per instance without a store. |
| **A bigger cache TTL** | It helps repeat visitors, but does nothing for new usernames, which is where the budget goes. |

## Limitations (what a reviewer should push on)

- **An instance's view of the budget can be stale.** It is one response old at most, and another instance may have spent points since. GitHub's own refusal stays the hard backstop, and the first refusal stops that instance immediately.
- **The reserve costs a little throughput.** In scenario 4 it served 31 profiles instead of 32, because the last 3 points are kept for in-flight work.
- **A cold instance knows nothing** until its first response. It can start one collection it would otherwise have refused.
- **Fairness is not addressed.** One client can still spend the budget down to the reserve, and the gate only keeps that from hurting cached profiles and in-flight work. Per-client fairness would need shared state across instances. That is the point where a store would earn its place.

## Verification

- **Unit tests:**
  - [budget.test.ts](../../src/lib/github/budget.test.ts) covers the reserve boundary, the reset, a secondary limit with no reset time, and responses without headers.
  - [client.test.ts](../../src/lib/github/client.test.ts) checks that no request is sent after a refusal.
  - [collect.test.ts](../../src/lib/github/collect.test.ts) checks that a gated profile sends zero requests.
  - [profile.test.ts](../../src/lib/profile.test.ts) checks that 20 concurrent calls make 1 collection, that failures are shared and then retried, and that different logins are kept separate.
- **End-to-end:** `npm run bench` (needs no token or network).
