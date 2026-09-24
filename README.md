<div align="center">
# GitWrapped

## Featured Personalized Readme Badge
<div align="center">

<a href="https://gitwrapped.aryansync.com/dashboard/asynced24">
  <img src="https://gitwrapped.aryansync.com/api/badge/asynced24?portfolio=aryansync.com&linkedin=linkedin.com%2Fin%2Faryansingh24&v=20260512" alt="GitWrapped Badge" />
</a>

<a href="https://gitwrapped.aryansync.com/dashboard/asynced24"><img src="https://img.shields.io/badge/GitWrapped-0F172A?style=for-the-badge&logo=github&logoColor=white" alt="GitWrapped" /></a> <a href="https://aryansync.com"><img src="https://img.shields.io/badge/Portfolio-111827?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio" /></a> <a href="https://linkedin.com/in/aryansingh24"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>

<a href="https://gitwrapped.aryansync.com/dashboard/asynced24"><img src="https://img.shields.io/badge/Languages-6-1F2937?style=flat-square&logo=codefactor&logoColor=white" alt="Languages" /></a> <a href="https://github.com/asynced24?tab=repositories"><img src="https://img.shields.io/badge/Repositories-13-1F2937?style=flat-square&logo=github&logoColor=white" alt="Repositories" /></a> <a href="https://github.com/asynced24?tab=repositories&language=TypeScript"><img src="https://img.shields.io/badge/Top_Language-TypeScript-1F2937?style=flat-square&logo=stackblitz&logoColor=white" alt="Top Language" /></a>

</div>

**Your coding journey, unboxed.**

Think Spotify Wrapped, but for your GitHub commits.
GitWrapped turns your raw commit history into a cinematic story and a professional developer dashboard.
No login required—just type your username.

[**Live Demo →**](https://gitwrapped.aryansync.com)
<br>

## Featured Developer Poke Cards

<div align="center">

<table>
<tr>
<td align="center">
<a href="https://gitwrapped.aryansync.com/dashboard/torvalds">
<img src="https://gitwrapped.aryansync.com/api/card/torvalds?v=20260512" width="300"/>
</a>
<br/>
<sub>torvalds</sub>
</td>

<td align="center">
<a href="https://gitwrapped.aryansync.com/dashboard/gaearon">
<img src="https://gitwrapped.aryansync.com/api/card/gaearon?v=20260512" width="300"/>
</a>
<br/>
<sub>gaearon</sub>
</td>
</tr>

<tr>
<td align="center">
<a href="https://gitwrapped.aryansync.com/dashboard/shrikanthv15">
<img src="https://gitwrapped.aryansync.com/api/card/shrikanthv15?v=20260512" width="300"/>
</a>
<br/>
<sub>mril-dsilva</sub>
</td>

<td align="center">
<a href="https://gitwrapped.aryansync.com/dashboard/asynced24">
<img src="https://gitwrapped.aryansync.com/api/card/asynced24?v=20260512" width="300"/>
</a>
<br/>
<sub>asynced24</sub>
</td>
</tr>
</table>

</div>

</div>

---

**Real activity** — A 52-week contribution heatmap, monthly totals, streaks and active weeks, straight from GitHub's contribution calendar (including private contributions you've chosen to show).

**Code Archaeology** — Which language dominated each year, from byte counts of the repos you created that year.

**Engineering practices** — What share of your repos have CI, tests, containers, infrastructure-as-code, a license and a README.

**Dev Pokémon Card** — A shareable SVG card where every number is one real metric, with a "why these numbers" breakdown under it.

**README badges** — Dynamic SVG badges for your profile README.

**No made-up stats** — Every formula is listed on the [methodology page](https://gitwrapped.aryansync.com/methodology). If something can't be measured from public data, it isn't shown.

---

#### How it works

```
username
   │
   ▼
src/lib/github/collect.ts   GitHub GraphQL → RawSnapshot        (network only)
   │   USER_QUERY ─────────┬── REPOS_BY_STARS pages (only if > 100 repos)
   │   RECENT_REPOS_QUERY ─┴── REPO_TREES batches of 20, in parallel
   ▼
src/lib/profile.ts          caches the raw snapshot for 1 hour  (successes only)
   │
   ▼
src/lib/analysis/*          RawSnapshot → UserStats              (pure, unit-tested)
   │
   ├── dashboard + Wrapped story
   ├── src/lib/card.ts → src/lib/card-svg.ts   card JSON / SVG   (pure)
   └── badge route
```

- **One data layer.** Every surface calls `getProfile()`, so the dashboard, card and badge can't disagree.
- **Raw data is cached, not results.** Formulas can change on deploy without waiting for the cache to expire. Failed fetches (rate limit, timeout) are never cached.
- **Typed failures.** `GitHubError` is `not-found`, `rate-limited` (with reset time), `upstream` or `config`. The dashboard shows a real 404 only for a missing user; a rate limit says when to retry.
- **Deterministic analysis.** Every "last 30 days" figure is measured from the snapshot's fetch time, so a saved snapshot always reproduces the same page. Real snapshots in `src/lib/analysis/__fixtures__` drive the tests.

#### What changed in the rewrite

Measured with `scripts/count-calls.ts` against live GitHub (cold cache, same token):

| | Before (REST) | After (GraphQL) |
|---|---|---|
| GitHub requests per dashboard, torvalds / asynced24 / gaearon | 67 / 78 / 91 | 3 / 3 / 6 |
| Cold load, torvalds / asynced24 / gaearon | 4.1s / 5.7s / 7.5s | 2.0–2.6s / 2.3–2.5s / 4.6s |
| Repeat load (cached) | — | ~15 ms |
| Tests | 0 | 75 |

Correctness fixes:

- "Consistency", "active months" and the activity chart used to be computed from each repo's single `pushed_at` timestamp. They now come from the daily contribution calendar.
- The card and dashboard ran separate pipelines on different data (10 vs 20 repos, 100 vs 1,000). Now there's one pipeline.
- Card stats were linear with hard caps. Every account got *Polyglot*, light attack 10 and retreat 4, and torvalds and gaearon were identical at the caps. Stats now use log scales and each maps to a single metric.
- Test detection used `name.includes("test")`, which matched `latest/` and `contest/`. It now matches exact names only.
- Stars on forks counted toward totals. Up to 60 requests per load went to a "code health" score that was never displayed.

---

#### Quick Start

```bash
git clone https://github.com/asynced24/gitwrapped.git
cd gitwrapped
npm install
cp .env.example .env.local   # add a GITHUB_TOKEN (no scopes needed)
npm run dev
```

| Script | |
|---|---|
| `npm test` | Vitest unit + snapshot tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npx tsx --env-file=.env.local scripts/count-calls.ts <user>` | Live request count, timing and resulting card |

CI runs lint, typecheck, tests and a production build on every pull request.

---

#### Built With

Next.js 16 · React 19 · TypeScript · GitHub GraphQL API · Vitest · Recharts · Framer Motion · Tailwind CSS 4
