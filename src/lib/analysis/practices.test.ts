import { describe, expect, it } from "vitest";
import { analyzePractices, detectPractices } from "./practices";
import { repo } from "./test-helpers";

describe("detectPractices", () => {
    it("does not mistake folders that merely contain 'test' for a test suite", () => {
        expect(detectPractices(repo({ rootEntries: ["latest", "contest", "attestation.md"] }))).not.toContain("tests");
    });

    it.each([
        ["tests"],
        ["__tests__"],
        ["vitest.config.ts"],
        ["pytest.ini"],
        ["conftest.py"],
        ["main_test.go"],
        ["playwright.config.ts"],
    ])("detects tests from %s", entry => {
        expect(detectPractices(repo({ rootEntries: [entry] }))).toContain("tests");
    });

    it("needs an actual workflow file for GitHub Actions CI", () => {
        expect(detectPractices(repo({ rootEntries: [".github"], workflowFiles: [] }))).not.toContain("ci");
        expect(detectPractices(repo({ rootEntries: [".github"], workflowFiles: ["ci.yml"] }))).toContain("ci");
        expect(detectPractices(repo({ rootEntries: [".gitlab-ci.yml"] }))).toContain("ci");
    });

    it("detects Terraform from .tf files and license variants", () => {
        const found = detectPractices(repo({ rootEntries: ["main.tf", "licence", "readme.md"] }));
        expect(found).toEqual(expect.arrayContaining(["iac", "license", "readme"]));
    });

    it("reports nothing for a repo whose tree was never fetched", () => {
        expect(detectPractices(repo({ rootEntries: null }))).toEqual([]);
    });
});

describe("analyzePractices", () => {
    it("computes shares over analysed, non-archived repos only", () => {
        const summary = analyzePractices([
            repo({ rootEntries: ["dockerfile"] }),
            repo({ rootEntries: ["src"] }),
            repo({ rootEntries: ["dockerfile"], archived: true }),
            repo({ rootEntries: null }),
        ]);
        expect(summary.analyzedRepos).toBe(2);
        const containers = summary.signals.find(s => s.key === "containers")!;
        expect(containers.repoCount).toBe(1);
        expect(containers.share).toBe(50);
    });

    it("returns zero shares instead of dividing by zero", () => {
        const summary = analyzePractices([]);
        expect(summary.analyzedRepos).toBe(0);
        expect(summary.signals.every(s => s.share === 0)).toBe(true);
    });
});
