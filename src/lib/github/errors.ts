export type GitHubErrorKind = "not-found" | "rate-limited" | "upstream" | "config";

/**
 * The one error type the GitHub layer throws. `kind` lets each surface decide
 * what to show: a 404 page, a "try again at HH:MM" page, or a generic outage.
 */
export class GitHubError extends Error {
    readonly kind: GitHubErrorKind;
    /** When the rate limit window resets (rate-limited only). */
    readonly resetAt: string | null;

    constructor(kind: GitHubErrorKind, message: string, resetAt: string | null = null) {
        super(message);
        this.name = "GitHubError";
        this.kind = kind;
        this.resetAt = resetAt;
    }
}

export function isGitHubError(error: unknown): error is GitHubError {
    return error instanceof GitHubError;
}
