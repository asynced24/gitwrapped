import { describe, expect, it } from "vitest";
import { analyzeLanguages } from "./languages";
import { repo } from "./test-helpers";

describe("analyzeLanguages", () => {
    it("keeps markup in the byte breakdown but not in programming languages", () => {
        const result = analyzeLanguages([repo({ languages: { TypeScript: 800, HTML: 150, CSS: 50 } })]);
        expect(result.byBytes.map(l => l.language)).toEqual(["TypeScript", "HTML", "CSS"]);
        expect(result.byBytes.find(l => l.language === "HTML")?.isMarkup).toBe(true);
        expect(result.programming.map(l => l.language)).toEqual(["TypeScript"]);
    });

    it("does not count a language that is a trace in one repo", () => {
        const result = analyzeLanguages([
            repo({ languages: { C: 99_000, Perl: 500, Python: 500 } }),
        ]);
        expect(result.programming.map(l => l.language)).toEqual(["C"]);
    });

    it("counts a small-byte language if it is the primary language of two repos", () => {
        const result = analyzeLanguages([
            repo({ languages: { Go: 100_000 }, primaryLanguage: "Go" }),
            repo({ languages: { Lua: 300 }, primaryLanguage: "Lua" }),
            repo({ languages: { Lua: 300 }, primaryLanguage: "Lua" }),
        ]);
        expect(result.programming.map(l => l.language)).toEqual(["Go", "Lua"]);
    });

    it("tracks notebooks separately so they don't inflate code volume", () => {
        const result = analyzeLanguages([
            repo({ languages: { "Jupyter Notebook": 1_000_000, Python: 2000 }, primaryLanguage: "Jupyter Notebook" }),
        ]);
        expect(result.notebookBytes).toBe(1_000_000);
        expect(result.notebookRepoCount).toBe(1);
        expect(result.totalCodeBytes).toBe(2000);
        expect(result.programming[0]).toMatchObject({ language: "Python", percentage: 100 });
    });

    it("ignores repos without language detail", () => {
        expect(analyzeLanguages([repo({ languages: null })]).byBytes).toEqual([]);
    });
});
