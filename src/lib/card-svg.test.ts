import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { FIXTURE_USERS, loadFixture } from "@/lib/analysis/test-helpers";
import { buildCardData } from "./card";
import { renderCardSVG, renderErrorSVG } from "./card-svg";

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
        expect(svg).toContain(`Since ${data.memberSince}`);
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

describe("renderErrorSVG", () => {
    it("tells a rate limit apart from a missing user", () => {
        expect(renderErrorSVG("not-found")).toContain("User Not Found");
        expect(renderErrorSVG("rate-limited")).toContain("Back Soon");
        expect(renderErrorSVG("rate-limited")).not.toContain("User Not Found");
    });
});
