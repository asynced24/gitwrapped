import { githubGraphQL } from "./client";
import { GitHubError } from "./errors";
import {
    RECENT_REPOS_QUERY,
    REPO_TREES_QUERY,
    REPOS_BY_STARS_QUERY,
    USER_QUERY,
    type GqlRepoCore,
    type GqlRepoFull,
    type RecentReposQueryResult,
    type ReposByStarsQueryResult,
    type RepoTreesQueryResult,
    type UserQueryResult,
} from "./queries";
import type { RawRepo, RawSnapshot } from "./types";

/** Repos listed per page; also the size of the analysed (detailed) set. */
const PAGE_SIZE = 100;
/** Star-ordered pages fetched at most, for accounts with > 100 repos. */
const MAX_STAR_PAGES = 5;
/** Repos per tree-lookup request; batches run in parallel. */
const TREE_BATCH_SIZE = 20;
/** Tree lookups are best-effort: a slow batch is dropped, not fatal. */
const TREE_TIMEOUT_MS = 8000;

type TreeNode = NonNullable<RepoTreesQueryResult["nodes"][number]>;

/**
 * Fetch everything the app needs about one user. Request plan:
 *
 *   USER_QUERY ─────────┬─ (repoTotal > 100) REPOS_BY_STARS pages, serial
 *   RECENT_REPOS_QUERY ─┴─ REPO_TREES batches of 20, parallel
 *
 * A typical account costs 2 + ceil(repos / 20) requests.
 */
export async function collectSnapshot(login: string): Promise<RawSnapshot> {
    const userPromise = githubGraphQL<UserQueryResult>(USER_QUERY, { login });
    const recentPromise = githubGraphQL<RecentReposQueryResult>(RECENT_REPOS_QUERY, { login });

    // Star pages depend only on the user query, so they start while the
    // (slower) recent-repos query is still running.
    const starPagesPromise = userPromise.then(({ user }) =>
        user && user.repositories.totalCount > PAGE_SIZE ? fetchReposByStars(login) : null
    );
    // Keep a rejection here from surfacing as unhandled before it's awaited.
    starPagesPromise.catch(() => undefined);

    const [{ user }, recent] = await Promise.all([userPromise, recentPromise]);
    if (!user || !recent.user) {
        throw new GitHubError("not-found", `No GitHub user named ${login}`);
    }

    const recentNodes = recent.user.repositories.nodes;
    const [trees, starPages] = await Promise.all([fetchTrees(recentNodes.map(n => n.id)), starPagesPromise]);

    const repos = recentNodes.map(node => toDetailedRepo(node, trees.get(node.id)));
    const seen = new Set(repos.map(r => r.id));
    for (const repo of starPages?.repos ?? []) {
        if (!seen.has(repo.id)) {
            seen.add(repo.id);
            repos.push(repo);
        }
    }

    const cc = user.contributionsCollection;

    return {
        schemaVersion: 1,
        fetchedAt: new Date().toISOString(),
        user: {
            login: user.login,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            company: user.company,
            location: user.location,
            websiteUrl: user.websiteUrl,
            twitterUsername: user.twitterUsername,
            createdAt: user.createdAt,
            followers: user.followers.totalCount,
            following: user.following.totalCount,
        },
        repos,
        repoTotal: user.repositories.totalCount,
        forkTotal: user.forks.totalCount,
        starTotalsComplete: repos.length >= user.repositories.totalCount || (starPages?.complete ?? true),
        contributions: {
            total: cc.contributionCalendar.totalContributions,
            commits: cc.totalCommitContributions,
            pullRequests: cc.totalPullRequestContributions,
            reviews: cc.totalPullRequestReviewContributions,
            issues: cc.totalIssueContributions,
            restricted: cc.restrictedContributionsCount,
            weeks: cc.contributionCalendar.weeks.map(w =>
                w.contributionDays.map(d => ({ date: d.date, count: d.contributionCount }))
            ),
        },
    };
}

/**
 * Page repos most-starred first until a zero-star repo appears (everything
 * after it adds nothing to star totals) or MAX_STAR_PAGES is reached.
 */
async function fetchReposByStars(login: string): Promise<{ repos: RawRepo[]; complete: boolean }> {
    const repos: RawRepo[] = [];
    let after: string | null = null;

    for (let page = 0; page < MAX_STAR_PAGES; page++) {
        const data: ReposByStarsQueryResult = await githubGraphQL<ReposByStarsQueryResult>(REPOS_BY_STARS_QUERY, {
            login,
            after,
        });
        if (!data.user) break;
        const { nodes, pageInfo } = data.user.repositories;
        repos.push(...nodes.map(toLiteRepo));

        const reachedZeroStars = nodes.some(n => n.stargazerCount === 0);
        if (reachedZeroStars || !pageInfo.hasNextPage || !pageInfo.endCursor) {
            return { repos, complete: true };
        }
        after = pageInfo.endCursor;
    }
    return { repos, complete: false };
}

async function fetchTrees(ids: string[]): Promise<Map<string, TreeNode>> {
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += TREE_BATCH_SIZE) batches.push(ids.slice(i, i + TREE_BATCH_SIZE));

    const results = await Promise.allSettled(
        batches.map(batch =>
            githubGraphQL<RepoTreesQueryResult>(REPO_TREES_QUERY, { ids: batch }, { timeoutMs: TREE_TIMEOUT_MS })
        )
    );

    const trees = new Map<string, TreeNode>();
    for (const result of results) {
        if (result.status === "rejected") {
            // A rate limit is still fatal: carrying on would under-report practices.
            if (result.reason instanceof GitHubError && result.reason.kind === "rate-limited") throw result.reason;
            continue;
        }
        for (const node of result.value.nodes) if (node) trees.set(node.id, node);
    }
    return trees;
}

function toLiteRepo(node: GqlRepoCore): RawRepo {
    return {
        id: node.databaseId,
        name: node.name,
        fullName: node.nameWithOwner,
        description: node.description,
        url: node.url,
        stars: node.stargazerCount,
        forks: node.forkCount,
        createdAt: node.createdAt,
        // An empty repo has no push; fall back to creation so date math stays valid.
        pushedAt: node.pushedAt ?? node.createdAt,
        sizeKb: node.diskUsage ?? 0,
        archived: node.isArchived,
        primaryLanguage: node.primaryLanguage?.name ?? null,
        topics: [],
        languages: null,
        rootEntries: null,
        workflowFiles: null,
    };
}

function toDetailedRepo(node: GqlRepoFull, tree: TreeNode | undefined): RawRepo {
    const languages: Record<string, number> = {};
    for (const edge of node.languages?.edges ?? []) {
        languages[edge.node.name] = edge.size;
    }

    return {
        ...toLiteRepo(node),
        topics: node.repositoryTopics.nodes.map(n => n.topic.name),
        languages,
        // No tree result means the lookup failed: leave as "unknown" so the repo
        // is excluded from practice shares. An empty repo resolves to [].
        rootEntries: tree ? (tree.root?.entries ?? []).map(e => e.name.toLowerCase()) : null,
        workflowFiles: tree ? (tree.workflows?.entries ?? []).map(e => e.name.toLowerCase()) : null,
    };
}
