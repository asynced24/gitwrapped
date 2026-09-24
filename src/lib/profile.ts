import { cache } from "react";
import { unstable_cache } from "next/cache";
import { analyzeSnapshot } from "@/lib/analysis";
import { collectSnapshot } from "@/lib/github/collect";
import type { RawSnapshot } from "@/lib/github/types";
import type { UserStats } from "@/types/github";

/** How long a fetched snapshot is reused before GitHub is asked again. */
export const SNAPSHOT_TTL_SECONDS = 3600;

/**
 * The raw snapshot is what gets cached, not the analysis: formulas can change
 * on deploy without waiting for the cache to expire. Only successful fetches
 * are cached — a thrown GitHubError (rate limit, outage) is never stored.
 * Bump the key version whenever RawSnapshot's shape changes.
 */
function cachedSnapshot(login: string): Promise<RawSnapshot> {
    return unstable_cache(() => collectSnapshot(login), ["snapshot-v1", login], {
        revalidate: SNAPSHOT_TTL_SECONDS,
        tags: [`github-user:${login}`],
    })();
}

/**
 * The single entry point for profile data. Dashboard, card, badge and the
 * generate page all call this, so they can never disagree. Wrapped in
 * React's cache() so generateMetadata and the page share one lookup.
 */
export const getProfile = cache(async (username: string): Promise<UserStats> => {
    const snapshot = await cachedSnapshot(username.toLowerCase());
    return analyzeSnapshot(snapshot);
});
