const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
      }
    }
  }
}
`;

/**
 * Fetch a user's total contributions (commits, PRs, issues, reviews) over
 * the last 12 months via the GraphQL API. This is the only GitHub API that
 * exposes real contribution counts, including private contributions when
 * the profile owner has "Include private contributions on my profile"
 * enabled (GitHub makes that total public once opted in, without revealing
 * which repos it came from).
 *
 * Never throws — resolves to 0 on a missing token, network failure, or
 * malformed response, so callers can treat this as a best-effort boost
 * rather than a hard dependency.
 */
export async function fetchContributionsLastYear(username: string): Promise<number> {
    if (!process.env.GITHUB_TOKEN) return 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const to = new Date();
        const from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);

        const res = await fetch(GITHUB_GRAPHQL_API, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: CONTRIBUTIONS_QUERY,
                variables: {
                    login: username,
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            }),
            signal: controller.signal,
        });

        if (!res.ok) return 0;

        const json = await res.json();
        const total = json?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;

        return typeof total === "number" ? total : 0;
    } catch {
        return 0;
    } finally {
        clearTimeout(timeoutId);
    }
}
