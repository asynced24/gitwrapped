import { cache } from "react";
import { unstable_cache } from "next/cache";
import { analyzeSnapshot } from "@/lib/analysis";
import { collectSnapshot } from "@/lib/github/collect";
import type { RawSnapshot } from "@/lib/github/types";
import type { UserStats } from "@/types/github";

/** How long a fetched snapshot is reused before GitHub is asked again. */
export const SNAPSHOT_TTL_SECONDS = 3600;
/** The benchmark harness shortens the TTL to exercise expiry; production never sets this. */
const ttlSeconds = Number(process.env.GITWRAPPED_SNAPSHOT_TTL) || SNAPSHOT_TTL_SECONDS;

/**
 * The raw snapshot is what gets cached, not the analysis: formulas can change
 * on deploy without waiting for the cache to expire. Only successful fetches
 * are cached — a thrown GitHubError (rate limit, outage) is never stored.
 * Bump the key version whenever RawSnapshot's shape changes.
 */
function cachedSnapshot(login: string): Promise<RawSnapshot> {
    return unstable_cache(() => collectSnapshot(login), ["snapshot-v1", login], {
        revalidate: ttlSeconds,
        tags: [`github-user:${login}`],
    })();
}

/**
 * Profiles being collected right now, by login. unstable_cache does not
 * coalesce concurrent misses: the benchmark measured 20 simultaneous first
 * visits to one profile running 20 full collections (60 GitHub requests).
 * Sharing the pending promise makes that one. It is per instance, which is
 * where concurrent requests meet on Vercel's fluid compute; two instances
 * can still each collect once.
 */
const inFlight = new Map<string, Promise<RawSnapshot>>();

export function sharedSnapshot(login: string): Promise<RawSnapshot> {
    let pending = inFlight.get(login);
    if (!pending) {
        pending = cachedSnapshot(login).finally(() => inFlight.delete(login));
        inFlight.set(login, pending);
    }
    return pending;
}

/**
 * The single entry point for profile data. Dashboard, card, badge and the
 * generate page all call this, so they can never disagree. Wrapped in
 * React's cache() so generateMetadata and the page share one lookup.
 */
export const getProfile = cache(async (username: string): Promise<UserStats> => {
    const snapshot = await sharedSnapshot(username.toLowerCase());
    return analyzeSnapshot(snapshot);
});
