/**
 * Fetch real snapshots and report GitHub API cost + the resulting card.
 *
 *   npx tsx --env-file=.env.local scripts/count-calls.ts torvalds gaearon
 *   SAVE_FIXTURES=1 ...   also writes src/lib/analysis/__fixtures__/<user>.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { collectSnapshot } from "../src/lib/github/collect";
import { analyzeSnapshot } from "../src/lib/analysis";
import { buildCardData } from "../src/lib/card";

const realFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("api.github.com")) calls++;
    return realFetch(input, init);
}) as typeof fetch;

async function main() {
    const users = process.argv.slice(2);
    for (const username of users.length ? users : ["asynced24"]) {
        calls = 0;
        const t0 = Date.now();
        const snapshot = await collectSnapshot(username);
        const ms = Date.now() - t0;
        const stats = analyzeSnapshot(snapshot);
        const card = buildCardData(stats);

        if (process.env.SAVE_FIXTURES) {
            mkdirSync("src/lib/analysis/__fixtures__", { recursive: true });
            writeFileSync(`src/lib/analysis/__fixtures__/${username.toLowerCase()}.json`, JSON.stringify(snapshot));
        }

        console.log(JSON.stringify({
            username,
            calls,
            ms,
            repos: `${stats.analyzedRepoCount} analysed / ${stats.ownRepoCount} own`,
            activity: {
                total: stats.activity.total, commits: stats.activity.commits, prs: stats.activity.pullRequests,
                reviews: stats.activity.reviews, weeks: `${stats.activity.activeWeeks}/${stats.activity.totalWeeks}`,
                longest: stats.activity.longestStreak, current: stats.activity.currentStreak, pattern: stats.activity.pattern,
            },
            langs: stats.programmingLanguages.map(l => `${l.language} ${l.percentage}%`).join(", "),
            practices: stats.practices.signals.map(s => `${s.key}:${s.repoCount}`).join(" "),
            card: {
                hp: card.hp, a1: card.attack1.damage, a2: card.attack2.damage, retreat: card.retreatCost,
                stage: card.evolutionStage, ability: card.ability.name, type: card.topLanguage,
                a2desc: card.attack2.description,
            },
        }, null, 1));
    }
}
main().catch(e => { console.error(e); process.exit(1); });
