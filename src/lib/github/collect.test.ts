import { afterEach, describe, expect, it, vi } from "vitest";
import { collectSnapshot } from "./collect";
import { GitHubError } from "./errors";

vi.mock("./client", () => ({ githubGraphQL: vi.fn() }));
const { githubGraphQL } = await import("./client");
const mockedGraphQL = vi.mocked(githubGraphQL);

function core(n: number, stars: number) {
    return {
        id: `R_${n}`,
        databaseId: n,
        name: `r${n}`,
        nameWithOwner: `u/r${n}`,
        description: null,
        url: `https://github.com/u/r${n}`,
        stargazerCount: stars,
        forkCount: 0,
        createdAt: "2024-01-01T00:00:00Z",
        pushedAt: null,
        diskUsage: null,
        isArchived: false,
        primaryLanguage: null,
    };
}

const user = (repoTotal: number) => ({
    user: {
        login: "u", name: null, avatarUrl: "a", bio: null, company: null, location: null,
        websiteUrl: null, twitterUsername: null, createdAt: "2020-01-01T00:00:00Z",
        followers: { totalCount: 1 }, following: { totalCount: 2 }, forks: { totalCount: 3 },
        repositories: { totalCount: repoTotal },
        contributionsCollection: {
            totalCommitContributions: 1, totalPullRequestContributions: 0, totalPullRequestReviewContributions: 0,
            totalIssueContributions: 0, restrictedContributionsCount: 0,
            contributionCalendar: { totalContributions: 1, weeks: [{ contributionDays: [{ date: "2026-09-20", contributionCount: 1 }] }] },
        },
    },
});

const detailed = (n: number, stars: number) => ({
    ...core(n, stars),
    repositoryTopics: { nodes: [] },
    languages: { edges: [{ size: 10, node: { name: "Go" } }] },
});

function route(handlers: Record<string, (vars: Record<string, unknown>) => unknown>) {
    mockedGraphQL.mockImplementation(async (query: string, vars: Record<string, unknown>) => {
        const name = /query (\w+)/.exec(query)![1];
        return handlers[name](vars) as never;
    });
}

describe("collectSnapshot", () => {
    afterEach(() => mockedGraphQL.mockReset());

    it("uses 2 requests + tree batches for a small account and never pages by stars", async () => {
        route({
            User: () => user(2),
            RecentRepos: () => ({ user: { repositories: { nodes: [detailed(1, 5), detailed(2, 0)] } } }),
            RepoTrees: () => ({ nodes: [{ id: "R_1", root: { entries: [{ name: "README.md" }] }, workflows: null }, null] }),
            ReposByStars: () => { throw new Error("should not page"); },
        });

        const snap = await collectSnapshot("u");
        expect(mockedGraphQL).toHaveBeenCalledTimes(3);
        expect(snap.repos[0].rootEntries).toEqual(["readme.md"]);
        expect(snap.repos[0].workflowFiles).toEqual([]);
        // Tree lookup returned null for r2: unknown, not "empty".
        expect(snap.repos[1].rootEntries).toBeNull();
        // Empty repo with no push falls back to creation date.
        expect(snap.repos[0].pushedAt).toBe("2024-01-01T00:00:00Z");
        expect(snap.starTotalsComplete).toBe(true);
    });

    it("adds star-ordered repos for big accounts, deduped, stopping at zero stars", async () => {
        const pages = [
            { nodes: [core(1, 900), core(200, 800)], pageInfo: { hasNextPage: true, endCursor: "c1" } },
            { nodes: [core(201, 3), core(202, 0)], pageInfo: { hasNextPage: true, endCursor: "c2" } },
        ];
        route({
            User: () => user(250),
            RecentRepos: () => ({ user: { repositories: { nodes: [detailed(1, 900)] } } }),
            RepoTrees: () => ({ nodes: [] }),
            ReposByStars: vars => ({ user: { repositories: pages[vars.after === "c1" ? 1 : 0] } }),
        });

        const snap = await collectSnapshot("u");
        expect(snap.repos.map(r => r.id)).toEqual([1, 200, 201, 202]);
        expect(snap.repos.slice(1).every(r => r.languages === null)).toBe(true);
        expect(snap.starTotalsComplete).toBe(true);
    });

    it("marks star totals incomplete when the page cap is hit", async () => {
        let page = 0;
        route({
            User: () => user(5000),
            RecentRepos: () => ({ user: { repositories: { nodes: [] } } }),
            RepoTrees: () => ({ nodes: [] }),
            ReposByStars: () => ({
                user: { repositories: { nodes: [core(1000 + page++, 50)], pageInfo: { hasNextPage: true, endCursor: `c${page}` } } },
            }),
        });
        expect((await collectSnapshot("u")).starTotalsComplete).toBe(false);
    });

    it("throws not-found when the user does not exist", async () => {
        route({ User: () => ({ user: null }), RecentRepos: () => ({ user: null }) });
        await expect(collectSnapshot("ghost")).rejects.toMatchObject({ kind: "not-found" });
    });

    it("drops a failed tree batch but still fails fast on a rate limit", async () => {
        route({
            User: () => user(1),
            RecentRepos: () => ({ user: { repositories: { nodes: [detailed(1, 0)] } } }),
            RepoTrees: () => { throw new GitHubError("upstream", "timeout"); },
        });
        expect((await collectSnapshot("u")).repos[0].rootEntries).toBeNull();

        route({
            User: () => user(1),
            RecentRepos: () => ({ user: { repositories: { nodes: [detailed(1, 0)] } } }),
            RepoTrees: () => { throw new GitHubError("rate-limited", "limit"); },
        });
        await expect(collectSnapshot("u")).rejects.toMatchObject({ kind: "rate-limited" });
    });
});
