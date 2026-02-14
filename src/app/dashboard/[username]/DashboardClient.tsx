"use client";

import { useState, useMemo } from "react";
import { UserStats, Repository } from "@/types/github";
import { ViewModeProvider, useViewMode } from "@/context/ViewModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { DevProfileCard } from "@/components/DevProfileCard";
import { LanguageBar } from "@/components/LanguageBar";
import { RepoCard } from "@/components/RepoCard";
import { ActivityChart } from "@/components/ActivityChart";
import { WrappedStory } from "@/components/WrappedStory";
import {
    Activity,
    Code2,
    FolderGit2,
    Beaker,
    ShieldCheck,
    ArrowUpDown,
    Copy,
    Check,
} from "lucide-react";

interface DashboardClientProps {
    stats: UserStats;
}

export default function DashboardClient({ stats }: DashboardClientProps) {
    return (
        <ViewModeProvider>
            <DashboardContent stats={stats} />
        </ViewModeProvider>
    );
}

type RepoSort = "stars" | "recent" | "size";

function DashboardContent({ stats }: DashboardClientProps) {
    const { mode } = useViewMode();
    const [repoSort, setRepoSort] = useState<RepoSort>("stars");
    const [badgeCopied, setBadgeCopied] = useState(false);

    // Sort repositories
    const sortedRepos = useMemo(() => {
        const repos = [...stats.topRepositories];
        switch (repoSort) {
            case "stars":
                return repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
            case "recent":
                return repos.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
            case "size":
                return repos.sort((a, b) => b.size - a.size);
            default:
                return repos;
        }
    }, [stats.topRepositories, repoSort]);

    const handleCopyBadge = async () => {
        const badgeUrl = `${window.location.origin}/api/badge/${stats.user.login}?portfolio=your-site.dev&linkedin=linkedin.com/in/you`;
        const markdown = `[![GitWrapped](${badgeUrl})](${window.location.origin}/dashboard/${stats.user.login})`;
        await navigator.clipboard.writeText(markdown);
        setBadgeCopied(true);
        setTimeout(() => setBadgeCopied(false), 2000);
    };

    if (mode === "wrapped") {
        return <WrappedStory stats={stats} />;
    }

    return (
        <div className="dashboard">
            {/* Navigation */}
            <nav className="dashboard-nav">
                <div className="dashboard-nav__left">
                    <a href="/" className="dashboard-nav__logo">GitWrapped</a>
                </div>
                <div className="dashboard-nav__center">
                    <ModeToggle />
                </div>
                <div className="dashboard-nav__right">
                    <ThemeSwitcher />
                </div>
            </nav>

            <div className="dashboard-content">
                {/* ============================================= */}
                {/* SECTION 1: Developer Identity Snapshot (Hero) */}
                {/* ============================================= */}
                <section className="dashboard-section">
                    <DevProfileCard stats={stats} />

                    {stats.user.bio && (
                        <p className="dashboard-bio">{stats.user.bio}</p>
                    )}

                    {/* Activity status */}
                    <div className="dashboard-hero-meta">
                        {stats.recentlyActive && (
                            <span className="activity-badge activity-badge--active">
                                <span className="activity-dot" />
                                Active in last 30 days
                            </span>
                        )}
                        {stats.contributionConsistency.pattern !== 'inactive' && (
                            <span className="activity-badge">
                                {stats.contributionConsistency.pattern === 'consistent' && '📊 Consistent contributor'}
                                {stats.contributionConsistency.pattern === 'burst' && '⚡ Burst contributor'}
                                {stats.contributionConsistency.pattern === 'sporadic' && '🌊 Sporadic contributor'}
                            </span>
                        )}
                    </div>
                </section>

                {/* ============================================= */}
                {/* SECTION 2: Activity & Growth                  */}
                {/* ============================================= */}
                <section className="dashboard-section">
                    <h2 className="section-title">
                        <Activity size={18} />
                        Activity & Growth
                    </h2>
                    <p className="section-subtitle">Repository creation and update activity over the last 24 months</p>

                    <div className="card">
                        <ActivityChart data={stats.monthlyActivity} />
                    </div>

                    {/* Quick activity stats */}
                    <div className="stats-grid stats-grid--3">
                        <div className="stat-card">
                            <span className="stat-value">{stats.ownRepoCount}</span>
                            <span className="stat-label">Own repos</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">
                                {stats.mostActiveYear || "-"}
                            </span>
                            <span className="stat-label">Most active year</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">
                                {stats.contributionConsistency.activeMonths}/{stats.contributionConsistency.totalMonths}
                            </span>
                            <span className="stat-label">Active months</span>
                        </div>
                    </div>
                </section>

                {/* ============================================= */}
                {/* SECTION 3: Stack & Focus                      */}
                {/* ============================================= */}
                <section className="dashboard-section">
                    <h2 className="section-title">
                        <Code2 size={18} />
                        Stack & Focus
                    </h2>

                    <div className="card">
                        <LanguageBar
                            languagesByBytes={stats.languageStats}
                            languagesByRepo={stats.languageStatsByRepoCount}
                        />
                    </div>

                    {/* Development Profile */}
                    <div className="card dev-profile-card">
                        <h3 className="card-title">Primary Development Profile</h3>
                        <p className="dev-profile-text">{stats.developmentProfile}</p>
                    </div>

                    {/* DevOps signals */}
                    {stats.devOpsMaturity.signals.some(s => s.found) && (
                        <div className="card">
                            <h3 className="card-title">
                                <ShieldCheck size={16} />
                                DevOps Signals
                            </h3>
                            <div className="devops-signals">
                                {stats.devOpsMaturity.signals
                                    .filter(s => s.found)
                                    .map(signal => (
                                        <span key={signal.type} className="devops-signal-badge">
                                            <span>{signal.icon}</span>
                                            <span>{signal.label}</span>
                                            <span className="text-muted">({signal.repoCount})</span>
                                        </span>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </section>

                {/* ============================================= */}
                {/* SECTION 4: Developer Profile Type (Optional)  */}
                {/* ============================================= */}
                {stats.developerDNA.labRatio > 0 && (
                    <section className="dashboard-section">
                        <h2 className="section-title">
                            <Beaker size={18} />
                            Lab vs Code
                        </h2>

                        <div className="card dna-card">
                            <div className="dna-bar">
                                <div
                                    className="dna-bar__lab"
                                    style={{ width: `${stats.developerDNA.labRatio}%` }}
                                />
                                <div
                                    className="dna-bar__code"
                                    style={{ width: `${100 - stats.developerDNA.labRatio}%` }}
                                />
                            </div>
                            <div className="dna-labels">
                                <span>{stats.developerDNA.labRatio}% lab work</span>
                                <span>{100 - stats.developerDNA.labRatio}% production code</span>
                            </div>
                            <p className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                                Lab work is based on repositories primarily using Jupyter Notebook.
                            </p>
                        </div>
                    </section>
                )}

                {/* ============================================= */}
                {/* SECTION 5: Projects                           */}
                {/* ============================================= */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FolderGit2 size={18} />
                            Projects
                        </h2>
                        <div className="repo-sort">
                            <ArrowUpDown size={14} />
                            {(["stars", "recent", "size"] as RepoSort[]).map((s) => (
                                <button
                                    key={s}
                                    className="repo-sort-btn"
                                    data-active={repoSort === s}
                                    onClick={() => setRepoSort(s)}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Most Impactful Repo */}
                    {stats.mostStarredRepo && stats.mostStarredRepo.stargazers_count > 0 && (
                        <RepoCard repo={stats.mostStarredRepo} highlight />
                    )}

                    {/* Remaining Repos */}
                    <div className="repo-grid">
                        {sortedRepos
                            .filter(r => r.id !== stats.mostStarredRepo?.id)
                            .map(repo => (
                                <RepoCard key={repo.id} repo={repo} />
                            ))
                        }
                    </div>
                </section>

                {/* ============================================= */}
                {/* BADGE EMBED                                   */}
                {/* ============================================= */}
                <section className="dashboard-section badge-section">
                    <h2 className="section-title">README Badge</h2>
                    <p className="section-subtitle">Add your GitWrapped badge to your README</p>

                    {/* Badge preview (standard) */}
                    <div className="badge-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/badge/${stats.user.login}?portfolio=your-site.dev&linkedin=linkedin.com/in/you`}
                            alt="GitWrapped Badge"
                            className="badge-img"
                        />
                    </div>

                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '8px', marginBottom: '12px' }}>
                        Replace <code>your-site.dev</code> and <code>linkedin.com/in/you</code> with your actual links.
                    </p>

                    {/* Copy button */}
                    <button
                        onClick={handleCopyBadge}
                        className="btn badge-copy-btn"
                    >
                        {badgeCopied ? <Check size={14} /> : <Copy size={14} />}
                        {badgeCopied ? "Copied!" : "Copy Markdown"}
                    </button>
                </section>
            </div>
        </div>
    );
}
