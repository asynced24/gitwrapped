/**
 * GraphQL documents. A handful of GraphQL requests replace what used to be
 * 70-90 REST calls. USER_QUERY and RECENT_REPOS_QUERY run in parallel, then
 * REPO_TREES_QUERY batches run in parallel with REPOS_BY_STARS_QUERY pages.
 */

const REPO_CORE = `
    id
    databaseId
    name
    nameWithOwner
    description
    url
    stargazerCount
    forkCount
    createdAt
    pushedAt
    diskUsage
    isArchived
    primaryLanguage { name }
`;

/** User fields, contribution calendar, and repo totals. Fast (~1s). */
export const USER_QUERY = `
query User($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl
    bio
    company
    location
    websiteUrl
    twitterUsername
    createdAt
    followers { totalCount }
    following { totalCount }
    forks: repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: true) { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}
`;

/** The 100 most recently pushed repos with languages: the "analysed" set. */
export const RECENT_REPOS_QUERY = `
query RecentRepos($login: String!) {
  user(login: $login) {
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      nodes {
        ${REPO_CORE}
        repositoryTopics(first: 10) { nodes { topic { name } } }
        languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
      }
    }
  }
}
`;

/**
 * Root tree + workflow files for a batch of repos. Resolving git trees is the
 * slow part of the API, so it runs as parallel batches instead of inside
 * PROFILE_QUERY (which timed out for accounts with ~100 repos).
 */
export const REPO_TREES_QUERY = `
query RepoTrees($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Repository {
      id
      root: object(expression: "HEAD:") {
        ... on Tree { entries { name } }
      }
      workflows: object(expression: "HEAD:.github/workflows") {
        ... on Tree { entries { name } }
      }
    }
  }
}
`;

/**
 * Repos by stars, for star/fork totals on accounts with more than 100 repos.
 * Ordered by stars so paging can stop at the first zero-star repo.
 */
export const REPOS_BY_STARS_QUERY = `
query ReposByStars($login: String!, $after: String) {
  user(login: $login) {
    repositories(
      first: 100
      after: $after
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ${REPO_CORE}
      }
    }
  }
}
`;

/* Response shapes (only the fields requested above). */

interface GqlRepoCore {
    id: string;
    databaseId: number;
    name: string;
    nameWithOwner: string;
    description: string | null;
    url: string;
    stargazerCount: number;
    forkCount: number;
    createdAt: string;
    pushedAt: string | null;
    diskUsage: number | null;
    isArchived: boolean;
    primaryLanguage: { name: string } | null;
}

export interface GqlRepoFull extends GqlRepoCore {
    repositoryTopics: { nodes: { topic: { name: string } }[] };
    languages: { edges: { size: number; node: { name: string } }[] } | null;
}

export interface RepoTreesQueryResult {
    nodes: ({
        id: string;
        root: { entries?: { name: string }[] } | null;
        workflows: { entries?: { name: string }[] } | null;
    } | null)[];
}

export interface GqlPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

export interface UserQueryResult {
    user: {
        login: string;
        name: string | null;
        avatarUrl: string;
        bio: string | null;
        company: string | null;
        location: string | null;
        websiteUrl: string | null;
        twitterUsername: string | null;
        createdAt: string;
        followers: { totalCount: number };
        following: { totalCount: number };
        forks: { totalCount: number };
        repositories: { totalCount: number };
        contributionsCollection: {
            totalCommitContributions: number;
            totalPullRequestContributions: number;
            totalPullRequestReviewContributions: number;
            totalIssueContributions: number;
            restrictedContributionsCount: number;
            contributionCalendar: {
                totalContributions: number;
                weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
            };
        };
    } | null;
}

export interface RecentReposQueryResult {
    user: { repositories: { nodes: GqlRepoFull[] } } | null;
}

export interface ReposByStarsQueryResult {
    user: {
        repositories: { pageInfo: GqlPageInfo; nodes: GqlRepoCore[] };
    } | null;
}

export type { GqlRepoCore };
