/**
 * How full each art pool is against its planned size.
 *
 *   npm run art:status
 */
import { ART_FAMILIES, FAMILIES, RARITIES, totalPoolTarget } from "../../src/lib/art/families";
import { ARTWORKS } from "../../src/lib/art/manifest";

const rows = ART_FAMILIES.map(family => {
    const cells = RARITIES.map(rarity => {
        const have = ARTWORKS.filter(a => a.family === family && a.rarity === rarity).length;
        return `${have}/${FAMILIES[family].poolTargets[rarity]}`.padStart(11);
    });
    return `${FAMILIES[family].label.padEnd(26)}${cells.join("")}`;
});

console.log(`${"".padEnd(26)}${RARITIES.map(r => r.padStart(11)).join("")}`);
console.log(rows.join("\n"));
console.log(`\n${ARTWORKS.length} of ${totalPoolTarget()} planned artworks. Empty pools use the family's original painting.`);
