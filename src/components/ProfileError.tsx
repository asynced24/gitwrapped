import Link from "next/link";
import { ArrowLeft, Clock, CloudOff, KeyRound } from "lucide-react";
import type { GitHubErrorKind } from "@/lib/github/errors";

interface ProfileErrorProps {
    kind: Exclude<GitHubErrorKind, "not-found">;
    resetAt: string | null;
    username: string;
}

const COPY = {
    "rate-limited": {
        icon: Clock,
        title: "GitHub asked us to slow down",
        body: "GitWrapped has used up its GitHub API quota for the moment. Nothing is wrong with this profile.",
    },
    upstream: {
        icon: CloudOff,
        title: "GitHub didn't answer in time",
        body: "The request to GitHub failed or timed out. This is usually temporary.",
    },
    config: {
        icon: KeyRound,
        title: "GitWrapped isn't configured",
        body: "The server has no valid GitHub token, so it can't read profiles yet.",
    },
} as const;

export function ProfileError({ kind, resetAt, username }: ProfileErrorProps) {
    const { icon: Icon, title, body } = COPY[kind];
    const resetTime = resetAt
        ? new Date(resetAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
        : null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-8">
                    <Icon size={40} className="text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                <p className="text-white/60 mb-3">{body}</p>
                {resetTime && <p className="text-white/60 mb-3">Try again after {resetTime}.</p>}
                <div className="flex gap-3 justify-center mt-8">
                    {kind !== "config" && (
                        <Link href={`/dashboard/${username}`} className="btn-primary inline-flex items-center gap-2">
                            Retry
                        </Link>
                    )}
                    <Link href="/" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
