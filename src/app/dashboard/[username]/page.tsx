import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchUserStats } from "@/lib/github";
import DashboardClient from "./DashboardClient";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

interface DashboardPageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
    const resolvedParams = await params;
    return {
        title: `${resolvedParams.username}'s GitWrapped | GitHub Analytics`,
        description: `View ${resolvedParams.username}'s GitHub analytics, contribution history, and coding statistics.`,
    };
}

async function DashboardContent({ username }: { username: string }) {
    try {
        const stats = await fetchUserStats(username);
        return <DashboardClient stats={stats} />;
    } catch (error) {
        notFound();
    }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
    const resolvedParams = await params;

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent username={resolvedParams.username} />
        </Suspense>
    );
}
