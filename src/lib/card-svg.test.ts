import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { FIXTURE_USERS, loadFixture } from "@/lib/analysis/test-helpers";
import { buildCardData } from "./card";
import { RARITY_STYLE, horizonPoints, renderCardSVG, renderErrorSVG, sparklePositions } from "./card-svg";

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
        expect(svg).toContain(`since ${data.memberSince}`);
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
        const sparkles = (svg: string) => (svg.match(/<path d="M[^"]*Z" fill="white"/g) ?? []).length;
        const common = renderCardSVG({ ...data, rarity: "common" }, NO_IMAGES);
        const legendary = renderCardSVG({ ...data, rarity: "legendary" }, NO_IMAGES);
        expect(sparkles(common)).toBe(0);
        expect(sparkles(legendary)).toBe(RARITY_STYLE.legendary.sparkles);
        expect(legendary).toContain(RARITY_STYLE.legendary.frame![0]);
    });

    it("keeps sparkles in the art window and stable per user", () => {
        const a = sparklePositions("asynced24", 8);
        expect(a).toEqual(sparklePositions("asynced24", 8));
        for (const s of a) {
            expect(s.y).toBeGreaterThanOrEqual(56);
            expect(s.y + s.size).toBeLessThan(250);
        }
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
