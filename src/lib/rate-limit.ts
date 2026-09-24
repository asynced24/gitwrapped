/**
 * Fixed-window rate limiter.
 *
 * With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counts live
 * in Upstash Redis (shared by every serverless instance) via its REST API,
 * so no client library is needed. Without them it falls back to an
 * in-memory Map, which only limits within one warm instance — a best-effort
 * guard for local dev and small deployments, not real abuse protection.
 *
 * The limiter fails open: if Redis is unreachable, requests are allowed.
 * Snapshot caching (src/lib/profile.ts) is the main protection for the
 * GitHub quota; this only stops one client hammering uncached usernames.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}

function countInMemory(key: string, windowMs: number, now: number): { count: number; resetAt: number } {
    cleanup(now);
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
        const fresh = { count: 1, resetAt: now + windowMs };
        store.set(key, fresh);
        return fresh;
    }
    entry.count++;
    return entry;
}

async function countInRedis(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number } | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    const windowStart = Math.floor(now / windowMs) * windowMs;
    const redisKey = `rl:${key}:${windowStart}`;
    try {
        const res = await fetch(`${url}/pipeline`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify([
                ["INCR", redisKey],
                ["PEXPIRE", redisKey, String(windowMs)],
            ]),
            cache: "no-store",
            signal: AbortSignal.timeout(1000),
        });
        if (!res.ok) return null;
        const [incr] = (await res.json()) as { result: number }[];
        return { count: incr.result, resetAt: windowStart + windowMs };
    } catch {
        return null; // fail open
    }
}

/**
 * @returns `null` if allowed, or a 429 Response if the key is over the limit.
 */
export async function rateLimit(key: string, limit = 30, windowMs = 60_000): Promise<Response | null> {
    const now = Date.now();
    const { count, resetAt } = (await countInRedis(key, windowMs, now)) ?? countInMemory(key, windowMs, now);
    if (count <= limit) return null;

    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.max(1, Math.ceil((resetAt - now) / 1000))),
            "Cache-Control": "no-store",
        },
    });
}

/** GitHub username format: alphanumeric and single hyphens, max 39 chars. */
export const GITHUB_USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
