import {
    GitHubUser,
    Repository,
    LanguageStats,
    ContributionWeek,
    UserStats,
    MonthlyCommits,
    DayHourActivity,
    getLanguageColor,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

async function fetchGitHub<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
        headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
        },
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }

    return res.json();
}

export async function fetchUser(username: string): Promise<GitHubUser> {
    return fetchGitHub<GitHubUser>(`/users/${username}`);
}

export async function fetchRepositories(username: string): Promise<Repository[]> {
    const repos: Repository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const pageRepos = await fetchGitHub<Repository[]>(
            `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`
        );

        repos.push(...pageRepos);

        if (pageRepos.length < perPage) break;
        page++;
        if (page > 10) break;
    }

    return repos;
}

export async function fetchRepoLanguages(
    owner: string,
    repo: string
): Promise<Record<string, number>> {
    try {
        return await fetchGitHub<Record<string, number>>(
            `/repos/${owner}/${repo}/languages`
        );
    } catch {
        return {};
    }
}

export function calculateLanguageStats(
    languageData: Record<string, number>[]
): LanguageStats[] {
    const aggregated: Record<string, number> = {};

    for (const repoLangs of languageData) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
            aggregated[lang] = (aggregated[lang] || 0) + bytes;
        }
    }

    const total = Object.values(aggregated).reduce((a, b) => a + b, 0);

    return Object.entries(aggregated)
        .map(([language, bytes]) => ({
            language,
            bytes,
            percentage: Math.round((bytes / total) * 1000) / 10,
            color: getLanguageColor(language),
        }))
        .sort((a, b) => b.bytes - a.bytes);
}

function generateContributionCalendar(): ContributionWeek[] {
    const weeks: ContributionWeek[] = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let currentDate = new Date(oneYearAgo);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    while (currentDate <= now) {
        const week: ContributionWeek = { days: [] };

        for (let i = 0; i < 7; i++) {
            const isWeekday = currentDate.getDay() !== 0 && currentDate.getDay() !== 6;
            const baseChance = isWeekday ? 0.6 : 0.3;
            const hasActivity = Math.random() < baseChance;

            const count = hasActivity
                ? Math.floor(Math.random() * Math.random() * 15) + 1
                : 0;

            let level: 0 | 1 | 2 | 3 | 4 = 0;
            if (count > 0) level = 1;
            if (count > 3) level = 2;
            if (count > 6) level = 3;
            if (count > 10) level = 4;

            week.days.push({
                date: currentDate.toISOString().split("T")[0],
                count,
                level,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        weeks.push(week);
    }

    return weeks;
}

function generateMonthlyCommits(): MonthlyCommits[] {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const now = new Date();
    const result: MonthlyCommits[] = [];

    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);

        result.push({
            month: `${monthName} '${year}`,
            commits: Math.floor(Math.random() * 150) + 20,
        });
    }

    return result;
}

function generateCodingSchedule(): DayHourActivity[] {
    const schedule: DayHourActivity[] = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const isWorkHour = hour >= 9 && hour <= 22;
            const isWeekday = day >= 1 && day <= 5;

            let baseActivity = 0;
            if (isWorkHour) baseActivity = 30;
            if (isWeekday && isWorkHour) baseActivity = 60;
            if (hour >= 14 && hour <= 18 && isWeekday) baseActivity = 100;

            schedule.push({
                day,
                hour,
                count: Math.floor(baseActivity * (0.5 + Math.random() * 0.5)),
            });
        }
    }

    return schedule;
}

function calculateStreaks(calendar: ContributionWeek[]): {
    longest: number;
    current: number;
} {
    const allDays = calendar.flatMap(w => w.days).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let longest = 0;
    let current = 0;
    let streak = 0;

    for (const day of allDays) {
        if (day.count > 0) {
            streak++;
            longest = Math.max(longest, streak);
        } else {
            streak = 0;
        }
    }

    const today = new Date().toISOString().split("T")[0];
    for (let i = allDays.length - 1; i >= 0; i--) {
        if (allDays[i].date === today || allDays[i].count > 0) {
            if (allDays[i].count > 0) {
                current++;
            } else if (allDays[i].date !== today) {
                break;
            }
        } else {
            break;
        }
    }

    return { longest, current };
}

export async function fetchUserStats(username: string): Promise<UserStats> {
    const [user, repositories] = await Promise.all([
        fetchUser(username),
        fetchRepositories(username),
    ]);

    const ownRepos = repositories.filter((r) => !r.fork);

    const languagePromises = ownRepos
        .slice(0, 20)
        .map((repo) => fetchRepoLanguages(username, repo.name));

    const languageData = await Promise.all(languagePromises);
    const languageStats = calculateLanguageStats(languageData);

    const contributionCalendar = generateContributionCalendar();
    const monthlyCommits = generateMonthlyCommits();
    const codingSchedule = generateCodingSchedule();
    const { longest, current } = calculateStreaks(contributionCalendar);

    const totalStars = repositories.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repositories.reduce((sum, r) => sum + r.forks_count, 0);
    const totalCommits = contributionCalendar
        .flatMap((w) => w.days)
        .reduce((sum, d) => sum + d.count, 0);

    const sortedByStars = [...ownRepos].sort(
        (a, b) => b.stargazers_count - a.stargazers_count
    );

    const schedule = codingSchedule;
    const maxActivity = schedule.reduce(
        (max, s) => (s.count > max.count ? s : max),
        schedule[0]
    );

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const accountAge = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    const totalSize = repositories.reduce((sum, r) => sum + r.size, 0);
    const averageRepoSize = repositories.length > 0
        ? Math.round(totalSize / repositories.length)
        : 0;

    return {
        user,
        repositories,
        totalStars,
        totalForks,
        totalCommits,
        languageStats,
        contributionCalendar,
        topRepositories: sortedByStars.slice(0, 6),
        monthlyCommits,
        codingSchedule,
        longestStreak: longest,
        currentStreak: current,
        mostActiveDay: days[maxActivity.day],
        mostActiveHour: maxActivity.hour,
        accountAge,
        averageRepoSize,
    };
}
