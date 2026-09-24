import type { RawRepo } from "@/lib/github/types";
import { getLanguageColor, type LanguageStats, type LanguageStatsByRepo } from "@/types/github";

/**
 * Linguist languages that are markup, styling, docs or build config rather
 * than programming languages. They still appear in the byte breakdown
 * (flagged `isMarkup`) but never count as a "language you use".
 */
export const NON_PROGRAMMING_LANGUAGES = new Set([
    "HTML", "CSS", "SCSS", "Sass", "Less", "Stylus", "Markdown", "MDX",
    "Dockerfile", "Makefile", "CMake", "Procfile", "Batchfile", "TeX",
    "Jupyter Notebook",
]);

/** A language counts as "used" at ≥ this share of programming bytes… */
export const MEANINGFUL_BYTE_SHARE = 2; // percent
/** …or when it is the primary language of at least this many repos. */
export const MEANINGFUL_PRIMARY_REPOS = 2;

export interface LanguageAnalysis {
    /** All languages by bytes (incl. markup, excl. notebooks), ≥ 0.5% share. */
    byBytes: LanguageStats[];
    /** Programming languages that pass the "meaningful" test, by bytes. */
    programming: LanguageStats[];
    byRepoCount: LanguageStatsByRepo[];
    notebookBytes: number;
    notebookRepoCount: number;
    totalCodeBytes: number;
}

export function analyzeLanguages(repos: RawRepo[]): LanguageAnalysis {
    const bytes: Record<string, number> = {};
    let notebookBytes = 0;

    for (const repo of repos) {
        for (const [lang, size] of Object.entries(repo.languages ?? {})) {
            if (lang === "Jupyter Notebook") notebookBytes += size;
            else bytes[lang] = (bytes[lang] ?? 0) + size;
        }
    }

    const totalCodeBytes = Object.values(bytes).reduce((a, b) => a + b, 0);
    const primaryCounts = countPrimaryLanguages(repos);

    const byBytes = toStats(bytes, totalCodeBytes).filter(s => s.percentage >= 0.5);

    const programmingBytes: Record<string, number> = {};
    for (const [lang, size] of Object.entries(bytes)) {
        if (!NON_PROGRAMMING_LANGUAGES.has(lang)) programmingBytes[lang] = size;
    }
    const programmingTotal = Object.values(programmingBytes).reduce((a, b) => a + b, 0);
    const programming = toStats(programmingBytes, programmingTotal).filter(
        s => s.percentage >= MEANINGFUL_BYTE_SHARE || (primaryCounts[s.language] ?? 0) >= MEANINGFUL_PRIMARY_REPOS
    );

    return {
        byBytes,
        programming,
        byRepoCount: languagesByRepoCount(primaryCounts),
        notebookBytes,
        notebookRepoCount: repos.filter(r => r.primaryLanguage === "Jupyter Notebook").length,
        totalCodeBytes,
    };
}

function countPrimaryLanguages(repos: RawRepo[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const repo of repos) {
        if (repo.primaryLanguage) counts[repo.primaryLanguage] = (counts[repo.primaryLanguage] ?? 0) + 1;
    }
    return counts;
}

function toStats(bytes: Record<string, number>, total: number): LanguageStats[] {
    if (total === 0) return [];
    return Object.entries(bytes)
        .map(([language, size]) => ({
            language,
            bytes: size,
            percentage: Math.round((size / total) * 1000) / 10,
            color: getLanguageColor(language),
            isMarkup: NON_PROGRAMMING_LANGUAGES.has(language),
        }))
        .sort((a, b) => b.bytes - a.bytes);
}

function languagesByRepoCount(counts: Record<string, number>): LanguageStatsByRepo[] {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(counts)
        .map(([language, repoCount]) => ({
            language,
            repoCount,
            percentage: Math.round((repoCount / total) * 1000) / 10,
            color: getLanguageColor(language),
        }))
        .sort((a, b) => b.repoCount - a.repoCount);
}

export function describeDiversity(languageCount: number): string {
    if (languageCount >= 8) return "polyglot";
    if (languageCount >= 5) return "versatile";
    if (languageCount >= 3) return "multi-language";
    if (languageCount === 2) return "bilingual";
    return "focused";
}
