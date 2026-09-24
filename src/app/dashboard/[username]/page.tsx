import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { isGitHubError } from "@/lib/github/errors";
import { GITHUB_USERNAME_RE } from "@/lib/rate-limit";
import DashboardClient from "./DashboardClient";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { ProfileError } from "@/components/ProfileError";

interface DashboardPageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
    const { username } = await params;
    return {
        title: `${username}'s GitWrapped | GitHub Analytics`,
        description: `${username}'s GitHub activity, languages, engineering practices and dev card, computed from public GitHub data.`,
    };
}

async function DashboardContent({ username }: { username: string }) {
    if (!GITHUB_USERNAME_RE.test(username)) notFound();

    let stats;
    try {
        stats = await getProfile(username);
    } catch (error) {
        if (!isGitHubError(error)) throw error;
        if (error.kind === "not-found") notFound();
        // Rate limits and outages are not "user not found": say what happened.
        return <ProfileError kind={error.kind} resetAt={error.resetAt} username={username} />;
    }
    return <DashboardClient stats={stats} />;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
    const { username } = await params;

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent username={username} />
        </Suspense>
    );
}
