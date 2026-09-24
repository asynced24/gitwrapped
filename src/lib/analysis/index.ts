import type { RawSnapshot } from "@/lib/github/types";
import type { UserStats } from "@/types/github";
import { analyzeActivity } from "./activity";
import { analyzeLanguages, describeDiversity } from "./languages";
import { describeExperience, describeFocus } from "./narrative";
import { analyzePractices } from "./practices";
import { detectPassion } from "@/lib/passions";
import {
    accountAge,
    analyzeLanguageEras,
    busiestYear,
    daysSince,
    isMaintained,
    rankByStars,
    reposCreatedByYear,
    sumStarsAndForks,
    toRepository,
} from "./repos";

/** A repo this starred counts as "popular". */
export const POPULAR_REPO_STARS = 50;
/** Activity within this many days counts as "recently active". */
export const RECENT_DAYS = 30;

/**
 * Pure: the same snapshot always produces the same stats. All "now"-relative
 * values use the snapshot's fetch time, not the wall clock.
 */
export function analyzeSnapshot(snapshot: RawSnapshot): UserStats {
    const now = new Date(snapshot.fetchedAt);
    const today = snapshot.fetchedAt.slice(0, 10);
    const { user, repos } = snapshot;

    const detailed = repos.filter(r => r.languages !== null);
    const languages = analyzeLanguages(detailed);
    const activity = analyzeActivity(snapshot.contributions, today);
    const practices = analyzePractices(repos);
    const { stars, forks } = sumStarsAndForks(repos);
    const ranked = rankByStars(repos);
    const age = accountAge(user.createdAt, now);
    const byYear = reposCreatedByYear(repos);

    const languageCount = languages.programming.length;
    const top = languages.programming[0] ?? null;
    const mostStarred = ranked[0] && ranked[0].stars > 0 ? ranked[0] : null;

    const lastActiveDay = [...activity.weeks.flat()].reverse().find(d => d.count > 0)?.date;
    const recentlyActive =
        (lastActiveDay !== undefined && daysSince(`${lastActiveDay}T00:00:00Z`, now) <= RECENT_DAYS) ||
        repos.some(r => daysSince(r.pushedAt, now) <= RECENT_DAYS);

    return {
        fetchedAt: snapshot.fetchedAt,
        user: {
            login: user.login,
            name: user.name,
            avatar_url: user.avatarUrl,
            bio: user.bio,
            company: user.company,
            location: user.location,
            blog: user.websiteUrl,
            twitter_username: user.twitterUsername,
            followers: user.followers,
            following: user.following,
            created_at: user.createdAt,
        },
        repositories: repos.map(toRepository),

        ownRepoCount: snapshot.repoTotal,
        forkedRepoCount: snapshot.forkTotal,
        analyzedRepoCount: detailed.length,
        maintainedRepoCount: repos.filter(r => isMaintained(r, now)).length,

        totalStars: stars,
        starTotalsComplete: snapshot.starTotalsComplete,
        totalForks: forks,
        topRepositories: ranked.slice(0, 6).map(toRepository),
        mostStarredRepo: mostStarred ? toRepository(mostStarred) : null,
        hasPopularRepo: (mostStarred?.stars ?? 0) >= POPULAR_REPO_STARS,

        accountAgeYears: age.years,
        accountAgeMonths: age.months,
        recentlyActive,
        reposByYear: byYear,
        mostActiveYear: busiestYear(byYear),

        languageStats: languages.byBytes,
        programmingLanguages: languages.programming,
        languageCount,
        languageStatsByRepoCount: languages.byRepoCount,
        topLanguage: top?.language ?? null,
        topLanguagePercentage: top?.percentage ?? 0,
        languageDiversity: describeDiversity(languageCount),
        languageEras: analyzeLanguageEras(detailed),

        developerDNA: {
            notebookBytes: languages.notebookBytes,
            notebookRepoCount: languages.notebookRepoCount,
            labRatio: repos.length > 0 ? Math.round((languages.notebookRepoCount / repos.length) * 100) : 0,
            totalCodeBytes: languages.totalCodeBytes,
        },
        practices,
        activity,
        experienceProfile: describeExperience({
            years: age.years,
            repoCount: snapshot.repoTotal,
            stars,
            languageCount,
            activeWeeks: activity.activeWeeks,
            totalWeeks: activity.totalWeeks,
        }),
        developmentProfile: describeFocus(languages.programming, languages.notebookRepoCount > 0),
        passion: detectPassion(repos),
    };
}
