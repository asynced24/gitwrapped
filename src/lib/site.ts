/**
 * Public URL used in anything a user copies out of the app (README snippets,
 * card embeds). Always the deployed site — never localhost or a preview URL —
 * and identical on server and client, so it can't cause hydration mismatches.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gitwrapped.aryansync.com").replace(/\/$/, "");
