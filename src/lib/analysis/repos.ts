import type { RawRepo } from "@/lib/github/types";
import { getLanguageColor, type LanguageEra, type Repository } from "@/types/github";
import { NON_PROGRAMMING_LANGUAGES } from "./languages";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A repo is "maintained" if pushed within this many days and not archived. */
export const MAINTAINED_WITHIN_DAYS = 180;

export function toRepository(repo: RawRepo): Repository {
    return {
        id: repo.id,
        name: repo.name,
        full_name: repo.fullName,
        description: repo.description,
        html_url: repo.url,
        language: repo.primaryLanguage,
        stargazers_count: repo.stars,
        forks_count: repo.forks,
        created_at: repo.createdAt,
        pushed_at: repo.pushedAt,
        size: repo.sizeKb,
        topics: repo.topics,
        archived: repo.archived,
    };
}

export function daysSince(iso: string, now: Date): number {
    return (now.getTime() - new Date(iso).getTime()) / DAY_MS;
}

export function isMaintained(repo: RawRepo, now: Date): boolean {
    return !repo.archived && daysSince(repo.pushedAt, now) <= MAINTAINED_WITHIN_DAYS;
}

/** Stars and forks on the user's own (non-fork) repos. */
export function sumStarsAndForks(repos: RawRepo[]): { stars: number; forks: number } {
    let stars = 0;
    let forks = 0;
    for (const r of repos) {
        stars += r.stars;
        forks += r.forks;
    }
    return { stars, forks };
}

/** Most starred first; ties broken by most recent push. Never mutates input. */
export function rankByStars(repos: RawRepo[]): RawRepo[] {
    return [...repos].sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
}

export function reposCreatedByYear(repos: RawRepo[]): Record<number, number> {
    const byYear: Record<number, number> = {};
    for (const repo of repos) {
        const year = new Date(repo.createdAt).getUTCFullYear();
        byYear[year] = (byYear[year] ?? 0) + 1;
    }
    return byYear;
}

export function busiestYear(byYear: Record<number, number>): number | null {
    let best: number | null = null;
    let max = 0;
    for (const [year, count] of Object.entries(byYear)) {
        if (count > max || (count === max && best !== null && Number(year) > best)) {
            max = count;
            best = Number(year);
        }
    }
    return best;
}

/** Account age in whole years and remaining months, as of `now`. */
export function accountAge(createdAt: string, now: Date): { years: number; months: number } {
    const created = new Date(createdAt);
    let months = (now.getUTCFullYear() - created.getUTCFullYear()) * 12 + (now.getUTCMonth() - created.getUTCMonth());
    if (now.getUTCDate() < created.getUTCDate()) months--;
    months = Math.max(0, months);
    return { years: Math.floor(months / 12), months: months % 12 };
}

/**
 * Language eras: for each year, which programming language dominated the
 * bytes of repos created that year. Only repos with language detail count.
 */
export function analyzeLanguageEras(repos: RawRepo[]): LanguageEra[] {
    const years = new Map<number, { repoCount: number; languages: Record<string, number> }>();

    for (const repo of repos) {
        if (!repo.languages) continue;
        const year = new Date(repo.createdAt).getUTCFullYear();
        const entry = years.get(year) ?? { repoCount: 0, languages: {} };
        entry.repoCount++;
        for (const [lang, size] of Object.entries(repo.languages)) {
            if (NON_PROGRAMMING_LANGUAGES.has(lang)) continue;
            entry.languages[lang] = (entry.languages[lang] ?? 0) + size;
        }
        years.set(year, entry);
    }

    const eras: LanguageEra[] = [];
    for (const [year, data] of [...years.entries()].sort((a, b) => a[0] - b[0])) {
        const sorted = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) continue;
        const total = sorted.reduce((sum, [, size]) => sum + size, 0);
        const allLanguages = sorted.map(([language, bytes]) => ({
            language,
            bytes,
            percentage: Math.round((bytes / total) * 100),
        }));
        const dominantLanguage = sorted[0][0];
        eras.push({
            year,
            dominantLanguage,
            languageColor: getLanguageColor(dominantLanguage),
            repoCount: data.repoCount,
            eraName: `${dominantLanguage} era`,
            secondaryLanguages: allLanguages
                .slice(1)
                .filter(l => l.percentage >= 10)
                .map(({ language, percentage }) => ({ language, percentage })),
            allLanguages,
        });
    }
    return eras;
}
