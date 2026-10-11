/**
 * Render every badge variant × theme from a recorded fixture into one PNG
 * contact sheet, for checking the design without deploying.
 *
 *   npx tsx scripts/badge-preview.ts [fixture] [out.png]
 */
import sharp from "sharp";
import { analyzeSnapshot } from "../src/lib/analysis";
import { loadFixture, FIXTURE_USERS } from "../src/lib/analysis/test-helpers";
import { BADGE_THEMES, BADGE_VARIANTS, badgeDataFrom, renderBadgeErrorSVG, renderBadgeSVG } from "../src/lib/badge-svg";

async function main() {
    const user = (process.argv[2] ?? "asynced24") as (typeof FIXTURE_USERS)[number];
    const out = process.argv[3] ?? "badge-preview.png";
    const stats = analyzeSnapshot(loadFixture(user));
    const avatarRes = await fetch(`${stats.user.avatar_url}&s=96`).catch(() => null);
    const mime = avatarRes?.headers.get("content-type") ?? "image/png";
    const avatar = avatarRes?.ok ? `data:${mime};base64,${Buffer.from(await avatarRes.arrayBuffer()).toString("base64")}` : null;
    const data = badgeDataFrom(stats, avatar, { portfolio: "aryansync.com", linkedin: "linkedin.com/in/aryansingh24" });

    const svgs = BADGE_VARIANTS.flatMap(v => BADGE_THEMES.map(t => renderBadgeSVG(data, v, t)));
    svgs.push(renderBadgeErrorSVG("GitHub busy, retrying soon", "dark"), renderBadgeErrorSVG("User not found", "light"));
    const tiles = await Promise.all(svgs.map(s => sharp(Buffer.from(s), { density: 144 }).resize({ width: 500 }).png().toBuffer()));
    const metas = await Promise.all(tiles.map(t => sharp(t).metadata()));
    const cols = 3;
    const rowH: number[] = [];
    metas.forEach((m, i) => (rowH[Math.floor(i / cols)] = Math.max(rowH[Math.floor(i / cols)] ?? 0, m.height ?? 0)));
    const height = rowH.reduce((a, b) => a + b + 16, 16);
    await sharp({ create: { width: 16 + cols * 516, height, channels: 3, background: "#8a8f98" } })
        .composite(tiles.map((input, i) => ({
            input,
            left: 16 + (i % cols) * 516,
            top: 16 + rowH.slice(0, Math.floor(i / cols)).reduce((a, b) => a + b + 16, 0),
        })))
        .png()
        .toFile(out);
    console.log(out);
}

main();
