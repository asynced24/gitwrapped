/**
 * Reproducible load test: a production build of GitWrapped (`next start`)
 * against the fixture-backed mock GitHub in ./mock-github.ts. No token, no
 * network, no production traffic.
 *
 *   npm run bench -- <label>             builds, runs, writes bench/results/<label>.json
 *   npm run bench -- <label> --no-build  reuses the existing .next build
 *
 * Every request goes to /api/card/<login>?format=json, which runs the same
 * getProfile() path as the dashboard, with a random X-Forwarded-For so the
 * per-IP limiter doesn't interfere. Latencies are local and synthetic
 * (the mock sleeps a fixed time per query): compare runs with each other,
 * never with production.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { configure, startMockGitHub, state } from "./mock-github";

const MOCK_PORT = 4010;
const APP_PORT = 3100;
const BASE = `http://localhost:${APP_PORT}`;
const TTL_SECONDS = 8;
const ROOT = path.join(__dirname, "../..");
const NEXT_BIN = path.join(ROOT, "node_modules/next/dist/bin/next");

const label = process.argv[2] ?? "run";
const skipBuild = process.argv.includes("--no-build");
/** Digits only, so `<fixture>-<run><n>` stays a valid, never-before-cached login. */
const runId = String(Date.now()).slice(-6);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const randomIp = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`;

interface Sample {
    ms: number;
    status: number;
}

async function hit(login: string): Promise<Sample> {
    const t0 = performance.now();
    const res = await fetch(`${BASE}/api/card/${login}?format=json`, { headers: { "x-forwarded-for": randomIp() } });
    await res.arrayBuffer();
    return { ms: performance.now() - t0, status: res.status };
}

/** Run `tasks` with at most `concurrency` in flight. */
async function pool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: concurrency }, async () => {
            while (next < tasks.length) {
                const i = next++;
                results[i] = await tasks[i]();
            }
        })
    );
    return results;
}

function percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    return Math.round(sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]);
}

function summarize(samples: Sample[]) {
    const ms = samples.map(s => s.ms);
    const statuses: Record<number, number> = {};
    for (const s of samples) statuses[s.status] = (statuses[s.status] ?? 0) + 1;
    return {
        n: samples.length,
        p50: percentile(ms, 50),
        p95: percentile(ms, 95),
        ...(samples.length >= 100 ? { p99: percentile(ms, 99) } : {}),
        max: Math.round(Math.max(...ms)),
        statuses,
    };
}

const upstream = () => state.requests;
const collections = (login: string) => state.collections[login.toLowerCase()] ?? 0;

async function waitForApp() {
    for (let i = 0; i < 120; i++) {
        try {
            if ((await fetch(`${BASE}/methodology`)).ok) return;
        } catch {
            /* not up yet */
        }
        await sleep(500);
    }
    throw new Error("next start did not come up");
}

async function main() {
    if (!skipBuild) {
        console.log("building…");
        const build = spawnSync(process.execPath, [NEXT_BIN, "build"], { cwd: ROOT, stdio: "inherit" });
        if (build.status !== 0) process.exit(build.status ?? 1);
    }

    const mock = await startMockGitHub(MOCK_PORT);
    const app: ChildProcess = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(APP_PORT)], {
        cwd: ROOT,
        env: {
            ...process.env,
            GITHUB_TOKEN: "bench-token",
            GITHUB_GRAPHQL_URL: `http://localhost:${MOCK_PORT}/graphql`,
            GITWRAPPED_SNAPSHOT_TTL: String(TTL_SECONDS),
            UPSTASH_REDIS_REST_URL: "",
            SENTRY_DSN: "",
        },
        stdio: ["ignore", "ignore", "inherit"],
    });

    const results: Record<string, unknown> = { label, runId, date: new Date().toISOString(), ttlSeconds: TTL_SECONDS };
    try {
        await waitForApp();

        // 1. Twenty people open the same never-seen profile at the same moment.
        configure({});
        const coldLogin = `asynced24-${runId}1`;
        const cold = await Promise.all(Array.from({ length: 20 }, () => hit(coldLogin)));
        results.coldConcurrent = {
            ...summarize(cold),
            upstreamRequests: upstream(),
            collections: collections(coldLogin),
            note: "one collection = 3 upstream requests for this fixture; ideal is 1 collection",
        };

        // 2. The same profile again, now cached: 200 requests, 10 at a time.
        const before = upstream();
        const warm = await pool(Array.from({ length: 200 }, () => () => hit(coldLogin)), 10);
        results.warm = { ...summarize(warm), upstreamRequests: upstream() - before };
        const warmedAt = Date.now();

        // 3. GitHub goes down after the cached snapshot has expired.
        configure({ fail: true });
        await sleep(Math.max(0, warmedAt + (TTL_SECONDS + 2) * 1000 - Date.now()));
        const outage = [await hit(coldLogin), await hit(coldLogin)];
        await sleep(1500);
        outage.push(await hit(coldLogin));
        results.outageAfterExpiry = {
            statuses: outage.map(s => s.status),
            note: "200 = served the expired snapshot; 502 = error page",
            upstreamRequests: upstream(),
        };
        configure({});

        // 4. Someone enumerates usernames while the token has 120 points left.
        //    Runs last: afterwards the app (correctly) believes the budget is spent.
        //    Afterwards: does a cached profile still load, and does a new one?
        configure({ budget: 120 });
        const fixtures = ["asynced24", "torvalds", "gaearon", "shrikanthv15"];
        const flood = await pool(
            Array.from({ length: 80 }, (_, i) => () => hit(`${fixtures[i % 4]}-${runId}${100 + i}`)),
            8
        );
        const floodUpstream = upstream();
        const afterCached = await hit(coldLogin);
        const afterNew = await hit(`torvalds-${runId}999`);
        const afterTenNew = await pool(Array.from({ length: 10 }, (_, i) => () => hit(`gaearon-${runId}9${i}`)), 5);
        results.enumeration = {
            budget: 120,
            requests: summarize(flood),
            upstreamRequestsDuringFlood: floodUpstream,
            refusedByGitHub: state.refused,
            cachedProfileAfter: afterCached.status,
            newProfileAfter: afterNew.status,
            upstreamRequestsFor11NewProfilesAfterExhaustion: upstream() - floodUpstream,
        };

    } finally {
        app.kill();
        mock.close();
    }

    const dir = path.join(ROOT, "bench/results");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${label}.json`), JSON.stringify(results, null, 2) + "\n");
    console.log(JSON.stringify(results, null, 2));
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
