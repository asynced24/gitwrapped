import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { analyzeSnapshot } from "@/lib/analysis";
import { FIXTURE_USERS, loadFixture } from "@/lib/analysis/test-helpers";
import { buildSlides, renderSlide } from "./WrappedStory";

/** Visible text of a rendered slide. */
function slideText(node: ReturnType<typeof renderSlide>): string {
    return renderToStaticMarkup(<>{node}</>).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
}

describe("Wrapped story", () => {
    it.each(FIXTURE_USERS)("renders every slide for %s with real numbers", username => {
        const stats = analyzeSnapshot(loadFixture(username));
        const slides = buildSlides(stats);
        const texts = Object.fromEntries(slides.map(s => [s.type, slideText(renderSlide(s, stats))]));

        expect(slides[0].type).toBe("intro");
        expect(slides.at(-1)!.type).toBe("closing");
        for (const [type, text] of Object.entries(texts)) {
            expect(text, `${type} slide is empty`).not.toBe("");
            expect(text, `${type} slide leaks undefined/NaN`).not.toMatch(/undefined|NaN/);
        }

        expect(texts.intro).toContain(`${stats.languageCount} languages`);
        expect(texts.activity).toContain(stats.activity.total.toLocaleString("en-US"));
        expect(texts.activity).toContain(`${stats.activity.activeWeeks}/${stats.activity.totalWeeks}`);
        if (texts.devops) expect(texts.devops).toMatch(new RegExp(`of ${stats.practices.analyzedRepos} repos`));
    });
});
