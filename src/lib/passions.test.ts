import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis";
import { loadFixture, repo } from "@/lib/analysis/test-helpers";
import { detectPassion, normalize } from "./passions";

describe("detectPassion", () => {
    it("finds the fitness repo in asynced24's real profile", () => {
        const passion = detectPassion(loadFixture("asynced24").repos);
        expect(passion).toMatchObject({ key: "fitness", edition: "Iron Stage Edition", repo: "your-prime-fitness-tracker" });
    });

    it("counts a topic tag on its own", () => {
        expect(detectPassion([repo({ name: "tracker", topics: ["boxing"] })])?.key).toBe("combat");
    });

    it("needs more than one passing mention in a description", () => {
        expect(detectPassion([repo({ name: "notes", description: "my gym notes" })])).toBeNull();
        expect(
            detectPassion([
                repo({ name: "notes", description: "my gym notes" }),
                repo({ name: "plans", description: "workout plans" }),
            ])?.key
        ).toBe("fitness");
    });

    it("does not match words that merely contain a keyword", () => {
        const repos = [
            repo({ name: "race-condition-demo", description: "ballot tracking, gamestate machine, trapped rapids" }),
            repo({ name: "raptor-benchmarks", description: "gymnastics of pointers" }),
        ];
        expect(detectPassion(repos)).toBeNull();
    });

    it("splits camelCase and snake_case repo names", () => {
        expect(normalize("myF1_Telemetry")).toBe(" my f1 telemetry ");
        expect(detectPassion([repo({ name: "myF1Telemetry" })])?.key).toBe("racing");
    });

    it("sends NFL words to American football and plain football to soccer", () => {
        expect(detectPassion([repo({ name: "nfl-draft-model" })])?.key).toBe("american-football");
        expect(detectPassion([repo({ name: "football-xg-model" })])?.key).toBe("soccer");
    });

    it("picks the strongest passion when several appear", () => {
        const repos = [
            repo({ name: "gym-log", topics: ["fitness"] }),
            repo({ name: "tiny-game" }),
        ];
        expect(detectPassion(repos)?.key).toBe("fitness");
    });

    it("finds nothing for accounts without passion repos", () => {
        expect(detectPassion(loadFixture("torvalds").repos)).toBeNull();
        expect(analyzeSnapshot(loadFixture("torvalds")).passion).toBeNull();
    });
});
