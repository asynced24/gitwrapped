"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Sparkles,
    Star,
    GitFork,
    GitCommit,
    Flame,
    Calendar,
    Clock,
    Users,
    ArrowLeft,
} from "lucide-react";
import { UserStats } from "@/types/github";
import { ProfileCard } from "@/components/ProfileCard";
import { StatCard } from "@/components/StatCard";
import { LanguageChart } from "@/components/LanguageChart";
import { CommitChart } from "@/components/CommitChart";
import { ContributionCalendar } from "@/components/ContributionCalendar";
import { TopRepos } from "@/components/TopRepos";
import { CodingSchedule } from "@/components/CodingSchedule";
import { WrappedCard } from "@/components/WrappedCard";

interface DashboardClientProps {
    stats: UserStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
    const {
        user,
        totalStars,
        totalForks,
        totalCommits,
        languageStats,
        contributionCalendar,
        topRepositories,
        monthlyCommits,
        codingSchedule,
        longestStreak,
        currentStreak,
        mostActiveDay,
        mostActiveHour,
        accountAge,
    } = stats;

    return (
        <div className="min-h-screen py-8">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5">
                <div className="container flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft
                            size={18}
                            className="text-white/50 group-hover:text-white transition-colors"
                        />
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">GitWrapped</span>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <span>Viewing:</span>
                        <span className="font-semibold text-white">@{user.login}</span>
                    </div>
                </div>
            </nav>

            <div className="container pt-20">
                {/* Profile Card */}
                <section className="mb-8">
                    <ProfileCard
                        user={user}
                        totalStars={totalStars}
                        totalCommits={totalCommits}
                        accountAge={accountAge}
                    />
                </section>

                {/* Quick Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={GitCommit}
                        label="Total Commits"
                        value={totalCommits}
                        subValue="This year"
                        color="#8b5cf6"
                        delay={0}
                    />
                    <StatCard
                        icon={Star}
                        label="Stars Earned"
                        value={totalStars}
                        subValue="Across all repos"
                        color="#f59e0b"
                        delay={0.1}
                    />
                    <StatCard
                        icon={Flame}
                        label="Longest Streak"
                        value={longestStreak}
                        subValue="Consecutive days"
                        color="#ef4444"
                        delay={0.2}
                    />
                    <StatCard
                        icon={GitFork}
                        label="Total Forks"
                        value={totalForks}
                        subValue="On your repos"
                        color="#06b6d4"
                        delay={0.3}
                    />
                </section>

                {/* Charts Row */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <LanguageChart data={languageStats} />
                    <CommitChart data={monthlyCommits} />
                </section>

                {/* Contribution Calendar */}
                <section className="mb-8">
                    <ContributionCalendar data={contributionCalendar} />
                </section>

                {/* Additional Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Calendar}
                        label="Current Streak"
                        value={currentStreak}
                        subValue="Keep it going!"
                        color="#10b981"
                        delay={0}
                    />
                    <StatCard
                        icon={Clock}
                        label="Peak Hour"
                        value={`${mostActiveHour > 12 ? mostActiveHour - 12 : mostActiveHour || 12} ${mostActiveHour >= 12 ? 'PM' : 'AM'}`}
                        subValue="Most active time"
                        color="#f472b6"
                        delay={0.1}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Most Active Day"
                        value={mostActiveDay}
                        subValue="Day of the week"
                        color="#8b5cf6"
                        delay={0.2}
                    />
                    <StatCard
                        icon={Users}
                        label="GitHub Age"
                        value={`${accountAge}+ yrs`}
                        subValue="Time on GitHub"
                        color="#06b6d4"
                        delay={0.3}
                    />
                </section>

                {/* Coding Schedule */}
                <section className="mb-8">
                    <CodingSchedule
                        data={codingSchedule}
                        mostActiveHour={mostActiveHour}
                        mostActiveDay={mostActiveDay}
                    />
                </section>

                {/* Top Repositories */}
                <section className="mb-8">
                    <TopRepos repositories={topRepositories} />
                </section>

                {/* Wrapped Card */}
                <section className="mb-8">
                    <WrappedCard stats={stats} />
                </section>

                {/* Footer */}
                <footer className="text-center py-8 text-sm text-white/40">
                    <p>
                        Generated with{" "}
                        <Link href="/" className="gradient-text font-semibold hover:underline">
                            GitWrapped
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
