/**
 * A local stand-in for GitHub's GraphQL API, served from the recorded
 * fixtures in src/lib/analysis/__fixtures__. It answers the four queries in
 * src/lib/github/queries.ts, charges one point per request against a
 * configurable budget, and sends the same x-ratelimit-* headers GitHub does.
 *
 *   npx tsx scripts/bench/mock-github.ts            (port 4010)
 *
 * scripts/bench/run.ts starts it in-process with startMockGitHub().
 *
 * Logins: a fixture name ("torvalds"), or a fixture name plus a numeric
 * suffix ("torvalds-17") for as many distinct users as a test needs.
 * "ghost-<n>" does not exist.
 *
 * Control endpoints (not part of GitHub's API):
 *   GET  /__stats   request counts, by query and by login
 *   POST /__config  { budget?, latencyScale?, fail? } — also resets counters
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { RawRepo, RawSnapshot } from "../../src/lib/github/types";

const FIXTURES = ["asynced24", "torvalds", "gaearon", "shrikanthv15"] as const;

const snapshots = new Map<string, RawSnapshot>(
    FIXTURES.map(name => [
        name,
        JSON.parse(readFileSync(path.join(__dirname, "../../src/lib/analysis/__fixtures__", `${name}.json`), "utf8")),
    ])
);

/** Synthetic per-query latency (ms), in proportion to what GitHub took for these queries live. */
const LATENCY: Record<string, number> = { User: 300, RecentRepos: 700, RepoTrees: 400, ReposByStars: 300 };

export const state = {
    budget: 5000,
    remaining: 5000,
    resetAt: 0,
    latencyScale: 1,
    fail: false,
    requests: 0,
    byQuery: {} as Record<string, number>,
    byLogin: {} as Record<string, number>,
    /** USER queries per login: one per full profile collection. */
    collections: {} as Record<string, number>,
    /** Requests refused with RATE_LIMITED. */
    refused: 0,
};

export function configure(opts: { budget?: number; latencyScale?: number; fail?: boolean }) {
    state.budget = opts.budget ?? 5000;
    state.remaining = state.budget;
    state.resetAt = Math.floor(Date.now() / 1000) + 3600;
    state.latencyScale = opts.latencyScale ?? 1;
    state.fail = opts.fail ?? false;
    state.requests = 0;
    state.byQuery = {};
    state.byLogin = {};
    state.collections = {};
    state.refused = 0;
}
configure({});

function lookup(login: string): RawSnapshot | null {
    const match = /^([a-z\d]+?)(?:-(\d+))?$/i.exec(login);
    const base = match && snapshots.get(match[1].toLowerCase());
    if (!base) return null;
    return { ...base, user: { ...base.user, login } };
}

const core = (r: RawRepo) => ({
    id: `R_${r.id}`,
    databaseId: r.id,
    name: r.name,
    nameWithOwner: r.fullName,
    description: r.description,
    url: r.url,
    stargazerCount: r.stars,
    forkCount: r.forks,
    createdAt: r.createdAt,
    pushedAt: r.pushedAt,
    diskUsage: r.sizeKb,
    isArchived: r.archived,
    primaryLanguage: r.primaryLanguage ? { name: r.primaryLanguage } : null,
});

const allRepos = () => [...snapshots.values()].flatMap(s => s.repos);

function answer(op: string, vars: Record<string, unknown>): { data: unknown; errors?: unknown[] } {
    if (op === "RepoTrees") {
        const byId = new Map(allRepos().map(r => [`R_${r.id}`, r]));
        return {
            data: {
                nodes: (vars.ids as string[]).map(id => {
                    const r = byId.get(id);
                    if (!r) return null;
                    return {
                        id,
                        root: r.rootEntries ? { entries: r.rootEntries.map(name => ({ name })) } : null,
                        workflows: r.workflowFiles ? { entries: r.workflowFiles.map(name => ({ name })) } : null,
                    };
                }),
            },
        };
    }

    const login = String(vars.login);
    const snap = lookup(login);
    if (!snap) {
        return { data: { user: null }, errors: [{ type: "NOT_FOUND", message: `Could not resolve to a User with the login of '${login}'.` }] };
    }

    if (op === "User") {
        const { user: u, contributions: c } = snap;
        return {
            data: {
                user: {
                    login: u.login, name: u.name, avatarUrl: u.avatarUrl, bio: u.bio, company: u.company,
                    location: u.location, websiteUrl: u.websiteUrl, twitterUsername: u.twitterUsername,
                    createdAt: u.createdAt,
                    followers: { totalCount: u.followers },
                    following: { totalCount: u.following },
                    forks: { totalCount: snap.forkTotal },
                    repositories: { totalCount: snap.repoTotal },
                    contributionsCollection: {
                        totalCommitContributions: c.commits,
                        totalPullRequestContributions: c.pullRequests,
                        totalPullRequestReviewContributions: c.reviews,
                        totalIssueContributions: c.issues,
                        restrictedContributionsCount: c.restricted,
                        contributionCalendar: {
                            totalContributions: c.total,
                            weeks: c.weeks.map(w => ({ contributionDays: w.map(d => ({ date: d.date, contributionCount: d.count })) })),
                        },
                    },
                },
            },
        };
    }

    if (op === "RecentRepos") {
        const nodes = snap.repos
            .filter(r => r.languages !== null)
            .map(r => ({
                ...core(r),
                repositoryTopics: { nodes: r.topics.map(name => ({ topic: { name } })) },
                languages: { edges: Object.entries(r.languages ?? {}).map(([name, size]) => ({ size, node: { name } })) },
            }));
        return { data: { user: { repositories: { nodes } } } };
    }

    if (op === "ReposByStars") {
        const sorted = [...snap.repos].sort((a, b) => b.stars - a.stars);
        const offset = vars.after ? Number(vars.after) : 0;
        const page = sorted.slice(offset, offset + 100);
        const next = offset + page.length;
        return {
            data: {
                user: {
                    repositories: {
                        pageInfo: { hasNextPage: next < sorted.length, endCursor: String(next) },
                        nodes: page.map(core),
                    },
                },
            },
        };
    }

    return { data: null, errors: [{ type: "INTERNAL", message: `mock has no answer for ${op}` }] };
}

async function body(req: IncomingMessage): Promise<string> {
    let data = "";
    for await (const chunk of req) data += chunk;
    return data;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function startMockGitHub(port: number): Promise<Server> {
    const server = createServer(handle);
    return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function handle(req: IncomingMessage, res: ServerResponse) {
    const json = (status: number, payload: unknown, headers: Record<string, string> = {}) => {
        res.writeHead(status, { "Content-Type": "application/json", ...headers });
        res.end(JSON.stringify(payload));
    };

    if (req.url === "/__stats") return json(200, state);
    if (req.url === "/__config" && req.method === "POST") {
        configure(JSON.parse((await body(req)) || "{}"));
        return json(200, state);
    }
    if (req.url !== "/graphql" || req.method !== "POST") return json(404, { message: "Not Found" });

    const { query, variables } = JSON.parse(await body(req)) as { query: string; variables: Record<string, unknown> };
    const op = /query (\w+)/.exec(query)?.[1] ?? "unknown";
    state.requests++;
    state.byQuery[op] = (state.byQuery[op] ?? 0) + 1;
    if (typeof variables.login === "string") {
        const key = variables.login.toLowerCase();
        state.byLogin[key] = (state.byLogin[key] ?? 0) + 1;
        if (op === "User") state.collections[key] = (state.collections[key] ?? 0) + 1;
    }

    await sleep((LATENCY[op] ?? 300) * state.latencyScale);

    if (state.fail) return json(502, { message: "Server Error" });

    // GitHub's semantics: a request made with nothing left is refused.
    const exhausted = state.remaining === 0;
    if (!exhausted) state.remaining--;
    const headers = {
        "x-ratelimit-limit": String(state.budget),
        "x-ratelimit-remaining": String(state.remaining),
        "x-ratelimit-reset": String(state.resetAt),
        "x-ratelimit-resource": "graphql",
    };
    if (exhausted) {
        state.refused++;
        return json(200, { data: null, errors: [{ type: "RATE_LIMITED", message: "API rate limit exceeded" }] }, headers);
    }
    return json(200, answer(op, variables), headers);
}

if (require.main === module) {
    const port = Number(process.env.MOCK_PORT ?? 4010);
    startMockGitHub(port).then(() => console.log(`mock GitHub on http://localhost:${port}/graphql`));
}
