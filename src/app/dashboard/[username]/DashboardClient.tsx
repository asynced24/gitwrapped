"use client";

import Link from "next/link";
import { Star, GitFork, BookOpen, MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { UserStats } from "@/types/github";
import { ViewModeProvider, useViewMode } from "@/context/ViewModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { LanguageBar } from "@/components/LanguageBar";
import { RepoCard } from "@/components/RepoCard";
import { WrappedStory } from "@/components/WrappedStory";
import { formatDistanceToNow } from "date-fns";

interface DashboardClientProps {
    stats: UserStats;
}

function DashboardContent({ stats }: DashboardClientProps) {
    const { mode } = useViewMode();

    if (mode === "wrapped") {
        return <WrappedStory stats={stats} />;
    }

    const {
        user,
        totalStars,
        totalForks,
        languageStats,
        topRepositories,
        accountAgeYears,
        ownRepoCount,
        forkedRepoCount,
        recentlyActive,
    } = stats;

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="nav">
                <div className="container nav-content">
                    <Link href="/" className="nav-brand">
                        <BookOpen size={20} />
                        <span>GitWrapped</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <ModeToggle />
                    </div>
                </div>
            </nav>

            <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {/* Profile Section */}
                <section className="profile-header" style={{ marginBottom: 32 }}>
                    <img
                        src={user.avatar_url}
                        alt={`${user.login}'s avatar`}
                        width={96}
                        height={96}
                        className="avatar"
                    />
                    <div className="profile-info">
                        <h1 className="profile-name">{user.name || user.login}</h1>
                        <p className="profile-login">@{user.login}</p>

                        {user.bio && (
                            <p className="profile-bio">{user.bio}</p>
                        )}

                        <div className="profile-meta">
                            {user.location && (
                                <span className="profile-meta-item">
                                    <MapPin size={16} />
                                    {user.location}
                                </span>
                            )}
                            {user.blog && (
                                <a
                                    href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-meta-item"
                                    style={{ color: "var(--accent-primary)" }}
                                >
                                    <LinkIcon size={16} />
                                    {user.blog.replace(/^https?:\/\//, "")}
                                </a>
                            )}
                            <span className="profile-meta-item">
                                <Calendar size={16} />
                                Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: false })} ago
                            </span>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid-4" style={{ marginBottom: 32 }}>
                    <div className="card">
                        <div className="stat-value">{user.public_repos}</div>
                        <div className="stat-label">Public repositories</div>
                    </div>
                    <div className="card">
                        <div className="stat-value">{totalStars.toLocaleString()}</div>
                        <div className="stat-label">Stars earned</div>
                    </div>
                    <div className="card">
                        <div className="stat-value">{totalForks.toLocaleString()}</div>
                        <div className="stat-label">Times forked</div>
                    </div>
                    <div className="card">
                        <div className="stat-value">{user.followers.toLocaleString()}</div>
                        <div className="stat-label">Followers</div>
                    </div>
                </section>

                {/* Language Breakdown */}
                {languageStats.length > 0 && (
                    <section className="card" style={{ marginBottom: 32 }}>
                        <h2 className="card-header">Languages</h2>
                        <LanguageBar languages={languageStats} />
                        <p className="text-muted" style={{ marginTop: 16, fontSize: 12 }}>
                            Based on bytes across your {ownRepoCount} original repositories.
                            Jupyter notebooks are counted as Python.
                        </p>
                    </section>
                )}

                {/* Repositories */}
                {topRepositories.length > 0 && (
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ marginBottom: 16 }}>Popular repositories</h2>
                        <div className="grid-2">
                            {topRepositories.map((repo) => (
                                <RepoCard key={repo.id} repo={repo} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Account Summary */}
                <section className="card card-muted">
                    <h2 className="card-header">Summary</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                            <span className="text-secondary">Account age:</span>{" "}
                            <strong>{accountAgeYears} {accountAgeYears === 1 ? "year" : "years"}</strong> on GitHub
                        </li>
                        <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                            <span className="text-secondary">Repository split:</span>{" "}
                            <strong>{ownRepoCount}</strong> original, <strong>{forkedRepoCount}</strong> forked
                        </li>
                        <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                            <span className="text-secondary">Top language:</span>{" "}
                            <strong>{stats.topLanguage || "Not enough data"}</strong>
                            {stats.topLanguagePercentage > 0 && (
                                <span className="text-muted"> ({stats.topLanguagePercentage}% of code)</span>
                            )}
                        </li>
                        <li style={{ padding: "8px 0" }}>
                            <span className="text-secondary">Activity:</span>{" "}
                            {recentlyActive ? (
                                <span style={{ color: "var(--accent-success)" }}>Active in the last 30 days</span>
                            ) : (
                                <span className="text-muted">No recent activity</span>
                            )}
                        </li>
                    </ul>
                </section>

                {/* Footer */}
                <footer style={{ textAlign: "center", marginTop: 64, color: "var(--text-muted)", fontSize: 12 }}>
                    <p>
                        Data from GitHub's public API. Language stats are byte-based and may not reflect actual coding time.
                    </p>
                </footer>
            </main>
        </div>
    );
}

export function DashboardClient({ stats }: DashboardClientProps) {
    return (
        <ViewModeProvider>
            <DashboardContent stats={stats} />
        </ViewModeProvider>
    );
}
