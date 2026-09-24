import { GitHubError } from "./errors";

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const DEFAULT_TIMEOUT_MS = 10_000;

interface GraphQLErrorItem {
    type?: string;
    message: string;
}

interface GraphQLResponse<T> {
    data?: T;
    errors?: GraphQLErrorItem[];
}

/**
 * POST a GraphQL query to GitHub and classify every failure into a
 * GitHubError. No caching here — callers cache successful results only
 * (see src/lib/profile.ts), so a rate-limit response is never stored.
 */
export async function githubGraphQL<T>(
    query: string,
    variables: Record<string, unknown>,
    { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<T> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new GitHubError("config", "GITHUB_TOKEN is not set; the GraphQL API requires a token.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
        res = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal,
            cache: "no-store",
        });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        throw new GitHubError("upstream", timedOut ? `GitHub did not respond within ${timeoutMs}ms` : "Could not reach GitHub");
    } finally {
        clearTimeout(timeoutId);
    }

    if (res.status === 401) {
        throw new GitHubError("config", "GitHub rejected the token (401).");
    }

    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 429 || (res.status === 403 && (remaining === "0" || res.headers.has("retry-after")))) {
        throw new GitHubError("rate-limited", "GitHub rate limit reached.", resetFromHeaders(res.headers));
    }

    if (!res.ok) {
        throw new GitHubError("upstream", `GitHub returned ${res.status}`);
    }

    const body = (await res.json()) as GraphQLResponse<T>;

    if (body.errors?.length) {
        const types = body.errors.map(e => e.type);
        if (types.includes("RATE_LIMITED")) {
            throw new GitHubError("rate-limited", "GitHub rate limit reached.", resetFromHeaders(res.headers));
        }
        if (types.includes("NOT_FOUND")) {
            throw new GitHubError("not-found", body.errors[0].message);
        }
        // Partial data (e.g. one repo's tree failed to resolve) is still usable.
        if (!body.data) {
            throw new GitHubError("upstream", body.errors[0].message);
        }
    }

    if (!body.data) {
        throw new GitHubError("upstream", "GitHub returned no data");
    }

    return body.data;
}

function resetFromHeaders(headers: Headers): string | null {
    const reset = headers.get("x-ratelimit-reset");
    if (reset && /^\d+$/.test(reset)) {
        return new Date(Number(reset) * 1000).toISOString();
    }
    const retryAfter = headers.get("retry-after");
    if (retryAfter && /^\d+$/.test(retryAfter)) {
        return new Date(Date.now() + Number(retryAfter) * 1000).toISOString();
    }
    return null;
}
