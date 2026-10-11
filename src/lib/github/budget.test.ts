import { afterEach, describe, expect, it } from "vitest";
import {
    assertCanRequest,
    assertCanStartCollection,
    recordBudget,
    recordExhausted,
    resetBudget,
} from "./budget";

const NOW = Date.parse("2026-10-11T00:00:00Z");
const RESET_S = NOW / 1000 + 1800;

function report(remaining: number, limit = 5000) {
    recordBudget(new Headers({
        "x-ratelimit-limit": String(limit),
        "x-ratelimit-remaining": String(remaining),
        "x-ratelimit-reset": String(RESET_S),
    }));
}

const refused = (fn: () => void) => {
    try {
        fn();
        return null;
    } catch (error) {
        return error as { kind: string; resetAt: string };
    }
};

describe("GitHub budget gates", () => {
    afterEach(resetBudget);

    it("allows everything before GitHub has reported anything", () => {
        expect(refused(() => assertCanStartCollection(NOW))).toBeNull();
        expect(refused(() => assertCanRequest(NOW))).toBeNull();
    });

    it("keeps a 2% reserve: new profiles stop at 100 of 5000, requests carry on", () => {
        report(101);
        expect(refused(() => assertCanStartCollection(NOW))).toBeNull();
        report(100);
        expect(refused(() => assertCanStartCollection(NOW))).toMatchObject({
            kind: "rate-limited",
            resetAt: new Date(RESET_S * 1000).toISOString(),
        });
        expect(refused(() => assertCanRequest(NOW))).toBeNull();
    });

    it("stops all requests at zero, then lifts both gates once the window resets", () => {
        report(0);
        expect(refused(() => assertCanRequest(NOW))?.kind).toBe("rate-limited");
        const afterReset = RESET_S * 1000 + 1;
        expect(refused(() => assertCanRequest(afterReset))).toBeNull();
        expect(refused(() => assertCanStartCollection(afterReset))).toBeNull();
    });

    it("treats a secondary limit with no reset time as a one-minute pause", () => {
        recordExhausted(null, NOW);
        expect(refused(() => assertCanRequest(NOW + 59_000))?.kind).toBe("rate-limited");
        expect(refused(() => assertCanRequest(NOW + 60_001))).toBeNull();
    });

    it("ignores responses without rate-limit headers", () => {
        report(0);
        recordBudget(new Headers());
        expect(refused(() => assertCanRequest(NOW))?.kind).toBe("rate-limited");
    });
});
