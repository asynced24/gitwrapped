import { describe, expect, it, vi } from "vitest";
import type { RawSnapshot } from "@/lib/github/types";
import { loadFixture } from "@/lib/analysis/test-helpers";

// Outside a Next request there is no incremental cache: pass straight through.
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/github/collect", () => ({ collectSnapshot: vi.fn() }));
const { collectSnapshot } = await import("@/lib/github/collect");
const { sharedSnapshot } = await import("./profile");

describe("sharedSnapshot", () => {
    it("runs one collection for concurrent requests for the same login, and a fresh one afterwards", async () => {
        let release!: (s: RawSnapshot) => void;
        vi.mocked(collectSnapshot).mockImplementation(() => new Promise(r => (release = r)));

        const requests = Array.from({ length: 20 }, () => sharedSnapshot("asynced24"));
        expect(collectSnapshot).toHaveBeenCalledTimes(1);
        release(loadFixture("asynced24"));
        const results = await Promise.all(requests);
        expect(new Set(results).size).toBe(1);

        vi.mocked(collectSnapshot).mockResolvedValue(loadFixture("asynced24"));
        await sharedSnapshot("asynced24");
        expect(collectSnapshot).toHaveBeenCalledTimes(2);
    });

    it("shares a failure too, then lets the next request retry", async () => {
        vi.mocked(collectSnapshot).mockReset().mockRejectedValueOnce(new Error("boom"));
        const [a, b] = await Promise.allSettled([sharedSnapshot("torvalds"), sharedSnapshot("torvalds")]);
        expect(a.status).toBe("rejected");
        expect(b.status).toBe("rejected");
        expect(collectSnapshot).toHaveBeenCalledTimes(1);

        vi.mocked(collectSnapshot).mockResolvedValue(loadFixture("torvalds"));
        await expect(sharedSnapshot("torvalds")).resolves.toBeDefined();
    });

    it("does not share between different logins", async () => {
        vi.mocked(collectSnapshot).mockReset().mockResolvedValue(loadFixture("gaearon"));
        await Promise.all([sharedSnapshot("gaearon"), sharedSnapshot("someone-else")]);
        expect(collectSnapshot).toHaveBeenCalledTimes(2);
    });
});
