import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { FIXTURE_USERS, loadFixture } from "@/lib/analysis/test-helpers";
import { buildCardData } from "./card";
import { LAYOUT, RARITY_STYLE, fitText, horizonPoints, renderCardSVG, renderErrorSVG, sparkles } from "./card-svg";

const NO_IMAGES = { cardArt: null, avatar: null };

describe("renderCardSVG", () => {
    it.each(FIXTURE_USERS)("renders %s's card unchanged", username => {
        const data = buildCardData(analyzeSnapshot(loadFixture(username)));
        expect(renderCardSVG(data, NO_IMAGES)).toMatchSnapshot();
    });

    it("shows the real numbers from the card data", () => {
        const data = buildCardData(analyzeSnapshot(loadFixture("torvalds")));
        const svg = renderCardSVG(data, NO_IMAGES);
        expect(svg).toContain(`>${data.hp}</text>`);
        expect(svg).toContain(`${data.contributions.toLocaleString("en-US")} contribs`);
        expect(svg).toContain(`${data.art.species} · ${data.art.variant}`);
        expect(svg).toContain("LEGENDARY");
        expect(svg).not.toMatch(/XP|Velocity/);
    });

    it("escapes user-controlled text", () => {
        const data = buildCardData(analyzeSnapshot(loadFixture("asynced24")));
        const svg = renderCardSVG({ ...data, location: `<script>"x"</script>` }, NO_IMAGES);
        expect(svg).not.toContain("<script>");
    });

    it("draws the initial when the avatar could not be loaded", () => {
        const data = buildCardData(analyzeSnapshot(loadFixture("asynced24")));
        expect(renderCardSVG(data, NO_IMAGES)).toContain(">A</text>");
    });
});

describe("rarity styling", () => {
    it("frames and sparkles more as rarity rises", () => {
        const data = buildCardData(analyzeSnapshot(loadFixture("asynced24")));
        const sparkleCount = (svg: string) => (svg.match(/<path d="M[^"]*Z" fill="#FFFFFF"/g) ?? []).length;
        const common = renderCardSVG({ ...data, rarity: "common" }, NO_IMAGES);
        const legendary = renderCardSVG({ ...data, rarity: "legendary" }, NO_IMAGES);
        expect(sparkleCount(common)).toBe(RARITY_STYLE.common.sparkles);
        expect(sparkleCount(legendary)).toBe(RARITY_STYLE.legendary.sparkles);
        expect(legendary).toContain(`stroke="${RARITY_STYLE.legendary.frameColor}"`);
        expect(legendary).toContain(`stroke-width="${RARITY_STYLE.legendary.frameWidth}"`);
    });

    it("keeps sparkles in the art window and off the avatar", () => {
        const { cx, cy, r } = LAYOUT.avatar;
        for (const s of sparkles("legendary")) {
            expect(s.y - s.size).toBeGreaterThan(LAYOUT.header.y + LAYOUT.header.height);
            expect(s.y + s.size).toBeLessThan(LAYOUT.ability.y);
            expect(Math.hypot(s.x - cx, s.y - cy)).toBeGreaterThan(r + s.size);
        }
    });
});

describe("fitText", () => {
    it("keeps the size when the text fits", () => {
        expect(fitText("Polyglot", 250, 14.5, "display", 11)).toEqual({ text: "Polyglot", size: 14.5 });
    });

    it("shrinks before it truncates, and escapes", () => {
        const long = "Active 31/53 weeks — immune to all status effects & more";
        const fitted = fitText(long, 310, 9.5, "mono", 8);
        expect(fitted.size).toBeLessThan(9.5);
        expect(fitted.size).toBeGreaterThanOrEqual(8);
        expect(fitted.text).toContain("&amp;");
        expect(fitted.text).not.toContain("…");
    });

    it("truncates only below the minimum size", () => {
        const fitted = fitText("x".repeat(200), 100, 9, "mono", 8);
        expect(fitted.size).toBe(8);
        expect(fitted.text.endsWith("…")).toBe(true);
    });
});

describe("real cards", () => {
    it.each(FIXTURE_USERS)("%s: no text is cut off", username => {
        const svg = renderCardSVG(buildCardData(analyzeSnapshot(loadFixture(username))), NO_IMAGES);
        expect(svg).not.toContain("…");
    });

    it("animates only legendary and one-of-one cards, and respects reduced motion", () => {
        const data = buildCardData(analyzeSnapshot(loadFixture("asynced24")));
        expect(renderCardSVG({ ...data, rarity: "rare" }, NO_IMAGES)).not.toContain("@keyframes");
        const legendary = renderCardSVG({ ...data, rarity: "legendary" }, NO_IMAGES);
        expect(legendary).toContain("@keyframes");
        expect(legendary).toContain("prefers-reduced-motion");
        expect(legendary).not.toContain("animateTransform");
        const oneOfOne = renderCardSVG({ ...data, art: { ...data.art, custom: true } }, NO_IMAGES);
        expect(oneOfOne).toContain("animateTransform");
        expect(oneOfOne).toContain("ONE OF ONE");
    });
});

describe("horizonPoints", () => {
    it("puts empty weeks on the baseline and the busiest week at full height", () => {
        const pts = horizonPoints([0, 4, 16, 0], 0, 30, 100, 40).split(" ").map(p => p.split(",").map(Number));
        expect(pts.map(p => p[0])).toEqual([0, 10, 20, 30]);
        expect(pts[0][1]).toBe(100);
        expect(pts[2][1]).toBe(60);
        expect(pts[1][1]).toBe(80); // sqrt(4/16) = half height
        expect(pts[3][1]).toBe(100);
    });

    it("draws a flat line for an account with no activity", () => {
        expect(horizonPoints([], 0, 10, 50, 20)).toBe("0,50 10,50");
    });
});

describe("renderErrorSVG", () => {
    it("tells a rate limit apart from a missing user", () => {
        expect(renderErrorSVG("not-found")).toContain("User Not Found");
        expect(renderErrorSVG("rate-limited")).toContain("Back Soon");
        expect(renderErrorSVG("rate-limited")).not.toContain("User Not Found");
    });
});
