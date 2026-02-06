"use client";

import Link from "next/link";
import { Star, GitFork, BookOpen, MapPin, Link as LinkIcon, Calendar, Share2, Copy, Check } from "lucide-react";
import { UserStats } from "@/types/github";
import { ViewModeProvider, useViewMode } from "@/context/ViewModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { LanguageBar } from "@/components/LanguageBar";
import { RepoCard } from "@/components/RepoCard";
import { WrappedStory } from "@/components/WrappedStory";
import { DevProfileCard } from "@/components/DevProfileCard";
import { TechStackCard } from "@/components/TechStackCard";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface DashboardClientProps {
    stats: UserStats;
}

function DashboardContent({ stats }: DashboardClientProps) {
    const { mode } = useViewMode();
    const [embedCopied, setEmbedCopied] = useState(false);

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

    const handleCopyEmbed = async () => {
        const embedCode = `[![GitWrapped](${window.location.origin}/api/badge/${user.login})](${window.location.origin}/dashboard/${user.login})`;
        await navigator.clipboard.writeText(embedCode);
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Navigation */}
            <nav className="nav">
                <div className="container nav-content">
                    <Link href="/" className="nav-brand">
                        <BookOpen size={20} />
                        <span>GitWrapped</span>
                    </Link>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <ModeToggle />
                    </div>
                </div>
            </nav>

            <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {/* Two-column layout: Profile Card + Info */}
                <section
                    className="dashboard-layout"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "360px 1fr",
                        gap: 32,
                        marginBottom: 32,
                        alignItems: "start"
                    }}
                >
                    {/* Left: Shareable Profile Card */}
                    <div>
                        <DevProfileCard stats={stats} />

                        {/* Embed code section */}
                        <div style={{ marginTop: 16 }}>
                            <button
                                onClick={handleCopyEmbed}
                                className="btn"
                                style={{ width: "100%", justifyContent: "center" }}
                            >
                                {embedCopied ? <Check size={14} /> : <Share2 size={14} />}
                                {embedCopied ? "Copied embed code!" : "Copy README badge"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Bio and Quick Stats */}
                    <div>
                        <div style={{ marginBottom: 24 }}>
                            <h1 style={{ fontSize: 28, marginBottom: 4 }}>{user.name || user.login}</h1>
                            <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 16 }}>@{user.login}</p>

                            {user.bio && (
                                <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
                                    {user.bio}
                                </p>
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

                        {/* Stats Grid */}
                        <div className="grid-4">
                            <div className="card">
                                <div className="stat-value">{user.public_repos}</div>
                                <div className="stat-label">Repositories</div>
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
                        </div>
                    </div>
                </section>

                {/* Language Breakdown */}
                {languageStats.length > 0 && (
                    <section className="card" style={{ marginBottom: 32 }}>
                        <h2 className="card-header">Languages</h2>
                        <LanguageBar languages={languageStats} />
                        <p className="text-muted" style={{ marginTop: 16, fontSize: 12 }}>
                            Based on bytes across your {ownRepoCount} original repositories.
                            Jupyter notebooks are excluded for accuracy.
                        </p>

                        {/* Lab Work Indicator */}
                        {stats.developerDNA.notebookRepoCount > 0 && (
                            <div className="lab-work-indicator">
                                <div className="lab-work-header">
                                    <span className="lab-work-icon">🔬</span>
                                    <span className="lab-work-title">Lab Work</span>
                                    <span className="lab-work-count">{stats.developerDNA.notebookRepoCount} notebooks</span>
                                </div>
                                <div className="lab-work-bar-container">
                                    <div className="lab-work-bar" style={{ width: `${Math.min(stats.developerDNA.labRatio, 100)}%` }} />
                                </div>
                                <p className="lab-work-archetype">
                                    You're a <strong>{
                                        stats.developerDNA.labArchetype === 'lab-scientist' ? 'Lab Scientist' :
                                            stats.developerDNA.labArchetype === 'research-oriented' ? 'Research-Oriented Developer' :
                                                stats.developerDNA.labArchetype === 'hybrid' ? 'Hybrid Developer' :
                                                    'Production-Focused Developer'
                                    }</strong> — balancing experimentation with production code.
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* Tech Stack Card */}
                <TechStackCard stats={stats} />

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
