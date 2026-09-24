/**
 * Add paintings to an art pool.
 *
 *   npm run art:add -- <family> <rarity> <image> [<image> ...]
 *   npm run art:add -- ts-js common ~/Downloads/kimi/storm-ridge.png ~/Downloads/kimi/neon-alley.png
 *
 * Each image is cropped to 5:7 (keeping the top, where the creature is),
 * resized to 700×980 (2× the card), encoded as WebP under 150 KB, saved to
 * public/art/<family>/<rarity>/<slug>.webp and appended to manifest.json.
 * The variant name comes from the file name: "storm-ridge.png" → "Storm Ridge".
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ART_FAMILIES, RARITIES, type ArtFamily, type Rarity } from "../../src/lib/art/families";
import type { Artwork } from "../../src/lib/art/manifest";

const MANIFEST = "src/lib/art/manifest.json";
const WIDTH = 700;
const HEIGHT = 980;
const MAX_BYTES = 150 * 1024;

function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(slug: string): string {
    return slug.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

async function encode(file: string): Promise<Buffer> {
    const base = sharp(file).rotate().resize(WIDTH, HEIGHT, { fit: "cover", position: "north" });
    for (let quality = 84; quality >= 40; quality -= 6) {
        const out = await base.clone().webp({ quality, effort: 6 }).toBuffer();
        if (out.length <= MAX_BYTES) return out;
    }
    throw new Error(`${file}: could not get under 150 KB even at quality 40`);
}

async function main() {
    const [family, rarity, ...files] = process.argv.slice(2);
    if (!ART_FAMILIES.includes(family as ArtFamily) || !RARITIES.includes(rarity as Rarity) || files.length === 0) {
        console.error(`usage: npm run art:add -- <family> <rarity> <image...>
  families: ${ART_FAMILIES.join(", ")}
  rarities: ${RARITIES.join(", ")}`);
        process.exit(1);
    }

    const manifest: Artwork[] = JSON.parse(readFileSync(MANIFEST, "utf8"));
    const dir = path.join("public", "art", family, rarity);
    mkdirSync(dir, { recursive: true });

    for (const file of files) {
        const slug = slugify(path.basename(file, path.extname(file)));
        const id = `${family}-${rarity}-${slug}`;
        if (manifest.some(a => a.id === id)) {
            console.error(`skip ${file}: ${id} is already in the manifest (ids are permanent; rename the file to add a new variant)`);
            continue;
        }
        if (!existsSync(file)) {
            console.error(`skip ${file}: not found`);
            continue;
        }
        const webp = await encode(file);
        const out = path.join(dir, `${slug}.webp`);
        writeFileSync(out, webp);
        manifest.push({ id, family: family as ArtFamily, rarity: rarity as Rarity, variant: titleCase(slug), file: `/art/${family}/${rarity}/${slug}.webp` });
        console.log(`added ${id}  (${Math.round(webp.length / 1024)} KB)`);
    }

    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 4) + "\n");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
