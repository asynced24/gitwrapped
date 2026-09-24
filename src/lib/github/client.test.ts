import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
