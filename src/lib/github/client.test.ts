import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { budgetSnapshot, resetBudget } from "./budget";
import { githubGraphQL } from "./client";
import { GitHubError } from "./errors";

function respond(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
    vi.stubGlobal("fetch", vi.fn(async () =>
        new Response(JSON.stringify(body), { status: init.status ?? 200, headers: init.headers })
    ));
}

async function errorOf(promise: Promise<unknown>): Promise<GitHubError> {
    try {
        await promise;
    } catch (error) {
        if (error instanceof GitHubError) return error;
        throw error;
    }
    throw new Error("expected a GitHubError");
}

describe("githubGraphQL", () => {
    beforeEach(() => vi.stubEnv("GITHUB_TOKEN", "test-token"));
    afterEach(() => {
        resetBudget();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("returns data on success", async () => {
        respond({ data: { user: { login: "x" } } });
        await expect(githubGraphQL("q", {})).resolves.toEqual({ user: { login: "x" } });
    });

    it("is a config error without a token, before any request", async () => {
        vi.stubEnv("GITHUB_TOKEN", "");
        const fetchSpy = vi.fn();
        vi.stubGlobal("fetch", fetchSpy);
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("config");
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("classifies NOT_FOUND as not-found (not a generic failure)", async () => {
        respond({ data: { user: null }, errors: [{ type: "NOT_FOUND", message: "Could not resolve to a User" }] });
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("not-found");
    });

    it("classifies a GraphQL RATE_LIMITED error and reports when it resets", async () => {
        respond({ errors: [{ type: "RATE_LIMITED", message: "API rate limit exceeded" }] }, {
            headers: { "x-ratelimit-reset": "1790000000" },
        });
        const error = await errorOf(githubGraphQL("q", {}));
        expect(error.kind).toBe("rate-limited");
        expect(error.resetAt).toBe(new Date(1790000000 * 1000).toISOString());
    });

    it("classifies a 403 with no remaining quota as rate-limited", async () => {
        respond({ message: "rate limited" }, { status: 403, headers: { "x-ratelimit-remaining": "0" } });
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("rate-limited");
    });

    it("classifies a bad token as config and a 502 as upstream", async () => {
        respond({}, { status: 401 });
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("config");
        respond({}, { status: 502 });
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("upstream");
    });

    it("keeps partial data when some fields errored", async () => {
        respond({ data: { nodes: [null] }, errors: [{ type: "SOMETHING", message: "one tree failed" }] });
        await expect(githubGraphQL("q", {})).resolves.toEqual({ nodes: [null] });
    });

    it("hands partial errors (including NOT_FOUND) to an opted-in caller instead of throwing", async () => {
        const errors = [{ type: "NOT_FOUND", message: "no node", path: ["nodes", 1] }];
        respond({ data: { nodes: [{ id: "a" }, null] }, errors });
        const seen: unknown[] = [];
        await expect(githubGraphQL("q", {}, { onPartialErrors: e => seen.push(...e) })).resolves.toEqual({
            nodes: [{ id: "a" }, null],
        });
        expect(seen).toEqual(errors);
    });

    it("still throws on a rate limit even when the caller accepts partial data", async () => {
        respond({ data: { nodes: [] }, errors: [{ type: "RATE_LIMITED", message: "slow down" }] });
        expect((await errorOf(githubGraphQL("q", {}, { onPartialErrors: () => {} }))).kind).toBe("rate-limited");
    });

    it("records the token budget GitHub reports on every response", async () => {
        respond({ data: {} }, { headers: { "x-ratelimit-limit": "5000", "x-ratelimit-remaining": "4321", "x-ratelimit-reset": "4102444800" } });
        await githubGraphQL("q", {});
        expect(budgetSnapshot()).toEqual({ limit: 5000, remaining: 4321, resetAt: 4102444800_000 });
    });

    it("stops sending requests after GitHub refuses one, until the window resets", async () => {
        respond({ errors: [{ type: "RATE_LIMITED", message: "slow down" }] }, {
            headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "4102444800" },
        });
        expect((await errorOf(githubGraphQL("q", {}))).kind).toBe("rate-limited");

        const fetchSpy = vi.fn();
        vi.stubGlobal("fetch", fetchSpy);
        const refused = await errorOf(githubGraphQL("q", {}));
        expect(refused.kind).toBe("rate-limited");
        expect(refused.resetAt).toBe("2100-01-01T00:00:00.000Z");
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("reports a timeout as upstream", async () => {
        vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) =>
            new Promise((_, reject) => init.signal?.addEventListener("abort", () =>
                reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
            ))
        ));
        const error = await errorOf(githubGraphQL("q", {}, { timeoutMs: 5 }));
        expect(error.kind).toBe("upstream");
        expect(error.message).toMatch(/5ms/);
    });
});
