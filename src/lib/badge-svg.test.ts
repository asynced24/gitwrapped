import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { loadFixture } from "@/lib/analysis/test-helpers";
import {
    BADGE_THEMES,
    BADGE_VARIANTS,
    badgeDataFrom,
    displayUrl,
    linkedinHandle,
    parseTheme,
    parseVariant,
    renderBadgeErrorSVG,
    renderBadgeSVG,
} from "./badge-svg";

const stats = analyzeSnapshot(loadFixture("asynced24"));
const data = badgeDataFrom(stats, "data:image/png;base64,AAAA", { portfolio: "aryansync.com", linkedin: "linkedin.com/in/aryansingh24" });

describe("badge SVG", () => {
    it("renders every variant and theme as one self-contained SVG", () => {
        for (const variant of BADGE_VARIANTS) {
            for (const theme of BADGE_THEMES) {
                const svg = renderBadgeSVG(data, variant, theme);
                expect(svg.startsWith("<svg")).toBe(true);
                expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
                // GitHub's image proxy loads nothing external: only data: URIs.
                expect(svg).not.toMatch(/href="(?!data:)/);
                expect(svg).toContain("<title>asynced24 on GitWrapped");
            }
        }
    });

    it("uses real data: weekly bars from the calendar and the counts from the profile", () => {
        expect(data.weekly.reduce((a, b) => a + b, 0)).toBe(stats.activity.weeks.flat().reduce((a, d) => a + d.count, 0));
        const svg = renderBadgeSVG(data, "compact", "dark");
        expect(svg).toContain(`${stats.ownRepoCount} repos`);
        expect(svg).toContain(`${stats.activity.total.toLocaleString("en-US")} contributions this year`);
    });

    it("only animates behind prefers-reduced-motion", () => {
        const svg = renderBadgeSVG(data, "identity", "light");
        expect(svg).toContain("@media (prefers-reduced-motion: reduce) { .sheen { animation: none; opacity: 0; } }");
    });

    it("escapes hostile link text and caps its length", () => {
        const evil = badgeDataFrom(stats, null, {
            portfolio: `"><script>alert(1)</script>`,
            linkedin: "x".repeat(200),
        });
        for (const variant of BADGE_VARIANTS) {
            const svg = renderBadgeSVG(evil, variant, "dark");
            expect(svg).not.toContain("<script>");
            expect(svg).not.toContain("x".repeat(60));
        }
    });

    it("keeps mono free of brand and language colour", () => {
        const svg = renderBadgeSVG(data, "identity", "mono");
        expect(svg).not.toContain("#0a66c2");
        expect(svg).not.toContain("#3178c6"); // TypeScript blue
    });

    it("shows links compactly and falls back on unknown variants and themes", () => {
        expect(displayUrl("https://www.aryansync.com/")).toBe("aryansync.com");
        expect(linkedinHandle("https://www.linkedin.com/in/aryansingh24/")).toBe("aryansingh24");
        expect(parseVariant("nope")).toBe("compact");
        expect(parseTheme(null)).toBe("light");
    });

    it("renders error badges with escaped text", () => {
        expect(renderBadgeErrorSVG("<b>", "dark")).toContain("&lt;b&gt;");
    });
});
