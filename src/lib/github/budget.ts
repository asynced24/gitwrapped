import { GitHubError } from "./errors";

/**
 * The GitHub token's hourly point budget, as last reported by GitHub.
 *
 * Every response carries x-ratelimit-remaining / -reset for the token. That
 * counter lives at GitHub, so it already reflects what every serverless
 * instance has spent: each instance learns the fleet-wide state on its next
 * response, with no shared store of our own. What an instance remembers is
 * at most one response stale, and GitHub's own refusal stays the backstop.
 *
 * Two gates use it:
 *  - assertCanRequest: once GitHub has said "no points left", stop sending
 *    requests until the reset instead of collecting more refusals.
 *  - assertCanStartCollection: below the reserve, refuse to start profiles
 *    that aren't cached, so collections already under way can finish.
 *    Cached profiles never reach this check.
 */

/** Fraction of the hourly limit kept back for collections already in flight. */
export const RESERVE_FRACTION = 0.02;

interface Budget {
    limit: number;
    remaining: number;
    /** Epoch ms when the window resets. */
    resetAt: number;
}

let budget: Budget | null = null;

export function recordBudget(headers: Headers): void {
    const limit = Number(headers.get("x-ratelimit-limit"));
    const remaining = Number(headers.get("x-ratelimit-remaining"));
    const reset = Number(headers.get("x-ratelimit-reset"));
    if (!headers.has("x-ratelimit-remaining") || !Number.isFinite(remaining) || !Number.isFinite(reset)) return;
    budget = { limit: Number.isFinite(limit) && limit > 0 ? limit : budget?.limit ?? 5000, remaining, resetAt: reset * 1000 };
}

/** GitHub refused a request (primary or secondary limit): nothing left until `resetAt`. */
export function recordExhausted(resetAt: string | null, now = Date.now()): void {
    // A secondary limit may not say when it ends; GitHub suggests waiting at least a minute.
    const until = resetAt ? Date.parse(resetAt) : now + 60_000;
    budget = { limit: budget?.limit ?? 5000, remaining: 0, resetAt: until };
}

function current(now: number): Budget | null {
    return budget && now < budget.resetAt ? budget : null;
}

function refusal(b: Budget, why: string): GitHubError {
    return new GitHubError("rate-limited", why, new Date(b.resetAt).toISOString());
}

export function assertCanRequest(now = Date.now()): void {
    const b = current(now);
    if (b && b.remaining <= 0) throw refusal(b, "GitHub budget exhausted; not sending until it resets.");
}

export function assertCanStartCollection(now = Date.now()): void {
    const b = current(now);
    if (b && b.remaining <= Math.ceil(b.limit * RESERVE_FRACTION)) {
        throw refusal(b, `GitHub budget below the ${RESERVE_FRACTION * 100}% reserve; not starting new profiles.`);
    }
}

export function budgetSnapshot(): Readonly<Budget> | null {
    return budget;
}

/** Tests only. */
export function resetBudget(): void {
    budget = null;
}
