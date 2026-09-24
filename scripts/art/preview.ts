/**
 * Render the four fixture users' cards to PNG, to check new art on real cards.
 *
 *   npm run art:preview            → art-preview/cards.png (+ one SVG per user)
 *
 * Uses the same renderer as the README card, with the art read from /public.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { analyzeSnapshot } from "../../src/lib/analysis";
import { FIXTURE_USERS } from "../../src/lib/analysis/test-helpers";
import { buildCardData } from "../../src/lib/card";
import { renderCardSVG } from "../../src/lib/card-svg";

const OUT = "art-preview";

async function main() {
    mkdirSync(OUT, { recursive: true });
    const pngs: Buffer[] = [];
    for (const user of FIXTURE_USERS) {
        const snapshot = JSON.parse(readFileSync(`src/lib/analysis/__fixtures__/${user}.json`, "utf8"));
        const data = buildCardData(analyzeSnapshot(snapshot));
        const file = path.join("public", data.art.file);
        const mime = file.endsWith(".webp") ? "image/webp" : "image/jpeg";
        const art = `data:${mime};base64,${readFileSync(file).toString("base64")}`;
        const svg = renderCardSVG(data, { cardArt: art, avatar: null });
        writeFileSync(path.join(OUT, `${user}.svg`), svg);
        pngs.push(await sharp(Buffer.from(svg), { density: 144 }).png().toBuffer());
        console.log(`${user.padEnd(14)} ${data.rarity.padEnd(10)} ${data.art.id}`);
    }
    const w = 716, h = 996, gap = 20;
    await sharp({ create: { width: pngs.length * (w + gap) + gap, height: h + 2 * gap, channels: 4, background: "#0d1117" } })
        .composite(pngs.map((input, i) => ({ input, left: gap + i * (w + gap), top: gap })))
        .png()
        .toFile(path.join(OUT, "cards.png"));
    console.log(`\nwrote ${OUT}/cards.png`);
}

main();
