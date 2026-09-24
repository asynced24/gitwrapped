import { readFileSync } from "node:fs";
import path from "node:path";
import type { RawRepo, RawSnapshot } from "@/lib/github/types";

let nextId = 1;

/** A detailed repo with sensible defaults; override what the test is about. */
export function repo(overrides: Partial<RawRepo> = {}): RawRepo {
    const id = nextId++;
    return {
        id,
        name: `repo-${id}`,
        fullName: `someone/repo-${id}`,
        description: null,
        url: `https://github.com/someone/repo-${id}`,
        stars: 0,
        forks: 0,
        createdAt: "2024-01-01T00:00:00Z",
        pushedAt: "2026-09-01T00:00:00Z",
        sizeKb: 100,
        archived: false,
        primaryLanguage: "TypeScript",
        topics: [],
        languages: { TypeScript: 1000 },
        rootEntries: ["readme.md", "package.json"],
        workflowFiles: [],
        ...overrides,
    };
}

export const FIXTURE_USERS = ["asynced24", "torvalds", "gaearon", "shrikanthv15"] as const;

/** Real snapshots captured with `SAVE_FIXTURES=1 scripts/count-calls.ts`. */
export function loadFixture(username: (typeof FIXTURE_USERS)[number]): RawSnapshot {
    const file = path.join(__dirname, "__fixtures__", `${username}.json`);
    return JSON.parse(readFileSync(file, "utf8")) as RawSnapshot;
}
