import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubError } from "@/lib/github/errors";

vi.mock("@/lib/profile", () => ({ getProfile: vi.fn() }));
const { getProfile } = await import("@/lib/profile");
const { GET } = await import("./route");

async function badgeFor(error: unknown) {
    vi.mocked(getProfile).mockRejectedValue(error);
    const res = await GET(new NextRequest("http://localhost/api/badge/someone"), {
        params: Promise.resolve({ username: "someone" }),
    });
    return { status: res.status, cache: res.headers.get("cache-control"), svg: await res.text() };
}

describe("badge error responses", () => {
    afterEach(() => vi.mocked(getProfile).mockReset());

    it("says 'not found' only for a user that does not exist, and caches it longer", async () => {
        const res = await badgeFor(new GitHubError("not-found", "nope"));
        expect(res.status).toBe(200);
        expect(res.svg).toContain("User not found");
        expect(res.cache).toBe("public, max-age=3600");
    });

    it("does not blame the user for a rate limit or outage, and caches briefly", async () => {
        const limited = await badgeFor(new GitHubError("rate-limited", "limit"));
        expect(limited.svg).not.toContain("not found");
        expect(limited.cache).toBe("public, max-age=120");

        const outage = await badgeFor(new Error("socket hang up"));
        expect(outage.svg).toContain("GitHub unavailable");
        expect(outage.cache).toBe("public, max-age=60");
    });
});
