/**
 * Add paintings to an art pool.
 *
 *   npm run art:add -- <family> <pool> <image> [<image> ...]
 *
 * <pool> is one of:
 *   common | uncommon | rare | legendary   regular rarity pool
 *   passion:<key>                          passion edition (e.g. passion:fitness)
 *   owner:<login>[:<passion>]              one-of-one for a single user
 *
 *   npm run art:add -- ts-js common ~/Downloads/kimi/storm-ridge.png
 *   npm run art:add -- ts-js passion:fitness ~/Downloads/kimi/iron-stage.png
 *   npm run art:add -- python owner:shrikanthv15:rap ~/Downloads/kimi/rooftop-verse.png
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
import { PASSION_KEYS, type PassionKey } from "../../src/lib/passions";
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

interface Pool {
    /** Folder under public/art/<family>/. */
    folder: string;
    /** Rarity pools use it; passion and one-of-one art ignore it. */
    rarity: Rarity;
    passion?: PassionKey;
    owner?: string;
}

function parsePool(arg: string): Pool | null {
    if (RARITIES.includes(arg as Rarity)) return { folder: arg, rarity: arg as Rarity };
    const [kind, value, extra] = arg.split(":");
    if (kind === "passion" && PASSION_KEYS.includes(value as PassionKey)) {
        return { folder: `passion/${value}`, rarity: "common", passion: value as PassionKey };
    }
    if (kind === "owner" && /^[a-z\d-]{1,39}$/i.test(value ?? "") && (!extra || PASSION_KEYS.includes(extra as PassionKey))) {
        const owner = value.toLowerCase();
        return { folder: `custom/${owner}`, rarity: "legendary", owner, ...(extra ? { passion: extra as PassionKey } : {}) };
    }
    return null;
}

async function main() {
    const [family, poolArg = "", ...files] = process.argv.slice(2);
    const pool = parsePool(poolArg);
    if (!ART_FAMILIES.includes(family as ArtFamily) || !pool || files.length === 0) {
        console.error(`usage: npm run art:add -- <family> <pool> <image...>
  families: ${ART_FAMILIES.join(", ")}
  pools:    ${RARITIES.join(" | ")} | passion:<${PASSION_KEYS.join("|")}> | owner:<login>[:<passion>]`);
        process.exit(1);
    }

    const manifest: Artwork[] = JSON.parse(readFileSync(MANIFEST, "utf8"));
    if (pool.owner && manifest.some(a => a.owner === pool.owner)) {
        console.error(`${pool.owner} already has a one-of-one; remove it from the manifest first.`);
        process.exit(1);
    }
    const dir = path.join("public", "art", family, pool.folder);
    mkdirSync(dir, { recursive: true });

    for (const file of files) {
        const slug = slugify(path.basename(file, path.extname(file)));
        const id = `${family}-${pool.folder.replace("/", "-")}-${slug}`;
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
        manifest.push({
            id,
            family: family as ArtFamily,
            rarity: pool.rarity,
            variant: titleCase(slug),
            file: `/art/${family}/${pool.folder}/${slug}.webp`,
            ...(pool.passion ? { passion: pool.passion } : {}),
            ...(pool.owner ? { owner: pool.owner } : {}),
        });
        console.log(`added ${id}  (${Math.round(webp.length / 1024)} KB)`);
    }

    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 4) + "\n");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
