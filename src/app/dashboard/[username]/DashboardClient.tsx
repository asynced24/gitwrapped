"use client";

import { useState, useMemo, useRef } from "react";
import { domToPng } from "modern-screenshot";
import { UserStats } from "@/types/github";
import { ViewModeProvider, useViewMode } from "@/context/ViewModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { DevProfileCard } from "@/components/DevProfileCard";
import { LanguageBar } from "@/components/LanguageBar";
import { RepoCard } from "@/components/RepoCard";
import { ActivityChart } from "@/components/ActivityChart";
import { WrappedStory } from "@/components/WrappedStory";
import { PokemonCard } from "@/components/PokemonCard";
import { TechCursor } from "@/components/TechCursor";
import { buildCardData } from "@/lib/card";
import {
    Activity,
    Code2,
    FolderGit2,
    Beaker,
    ShieldCheck,
    ArrowUpDown,
    Copy,
    Check,
    Download,
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
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [linkedinUsername, setLinkedinUsername] = useState("");

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

    const { badgePath, readmeSnippet } = useMemo(() => {
        const normalizedPortfolio = portfolioUrl
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/\/$/, "");

        const normalizedLinkedin = linkedinUsername
            .trim()
            .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
            .replace(/^@/, "")
            .replace(/\/$/, "");

        const linkedinPath = normalizedLinkedin
            ? `linkedin.com/in/${normalizedLinkedin}`
            : "";

        const params = new URLSearchParams();
        if (normalizedPortfolio) params.set("portfolio", normalizedPortfolio);
        if (linkedinPath) params.set("linkedin", linkedinPath);

        const query = params.toString();
        const computedBadgePath = `/api/badge/${stats.user.login}${query ? `?${query}` : ""}`;
        const origin = typeof window !== "undefined"
            ? window.location.origin
            : "https://gitwrapped.aryansync.com";
        const dashboardUrl = `${origin}/dashboard/${stats.user.login}`;
        const absoluteBadgeUrl = `${origin}${computedBadgePath}`;
        const programmingLanguageCount = stats.languageStats.filter(l => !l.isMarkup).length;
        const portfolioHref = normalizedPortfolio ? `https://${normalizedPortfolio}` : "";

        const socialButtons = [
            `<a href="${dashboardUrl}"><img src="https://img.shields.io/badge/GitWrapped-0F172A?style=for-the-badge&logo=github&logoColor=white" alt="GitWrapped" /></a>`,
            portfolioHref
                ? `<a href="${portfolioHref}"><img src="https://img.shields.io/badge/Portfolio-111827?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio" /></a>`
                : "",
            linkedinPath
                ? `<a href="https://${linkedinPath}"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>`
                : "",
        ].filter(Boolean);

        const topLang = (stats.topLanguage ?? "Polyglot").replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "_");
        const topLangQuery = encodeURIComponent(stats.topLanguage ?? "");
        const githubProfileUrl = `https://github.com/${stats.user.login}`;

        const statButtons = [
            `<a href="${dashboardUrl}"><img src="https://img.shields.io/badge/Languages-${programmingLanguageCount}-1F2937?style=flat-square&logo=codefactor&logoColor=white" alt="Languages" /></a>`,
            `<a href="${githubProfileUrl}?tab=repositories"><img src="https://img.shields.io/badge/Repositories-${stats.ownRepoCount}-1F2937?style=flat-square&logo=github&logoColor=white" alt="Repositories" /></a>`,
            `<a href="${githubProfileUrl}?tab=repositories&language=${topLangQuery}"><img src="https://img.shields.io/badge/Top_Language-${topLang}-1F2937?style=flat-square&logo=stackblitz&logoColor=white" alt="Top Language" /></a>`,
        ];

        const snippet = `<div align="center">\n\n<a href="${dashboardUrl}">\n  <img src="${absoluteBadgeUrl}" alt="GitWrapped Badge" />\n</a>\n\n${socialButtons.join(" ")}\n\n${statButtons.join(" ")}\n\n</div>`;

        return {
            badgePath: computedBadgePath,
            readmeSnippet: snippet,
        };
    }, [portfolioUrl, linkedinUsername, stats.languageStats, stats.ownRepoCount, stats.user.login, stats.topLanguage]);

    const handleCopyBadge = async () => {
        const markdown = readmeSnippet;
        await navigator.clipboard.writeText(markdown);
        setBadgeCopied(true);
        setTimeout(() => setBadgeCopied(false), 2000);
    };

    if (mode === "wrapped") {
        return <WrappedStory stats={stats} />;
    }

    if (mode === "card") {
        return <PokemonCardView stats={stats} />;
    }

    return (
        <div className="dashboard">
            <TechCursor />
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

                    {stats.developerDNA.labRatio > 0 && (
                        <div className="card dna-card dna-card--subtle">
                            <h3 className="card-title">
                                <Beaker size={16} />
                                Notebook Signal
                            </h3>
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
                                <span>{stats.developerDNA.notebookRepoCount} notebook repos</span>
                                <span>{stats.developerDNA.labRatio}% of repos</span>
                            </div>
                            <p className="text-muted dna-note">
                                Based on repositories where the primary language is Jupyter Notebook.
                            </p>
                        </div>
                    )}
                </section>

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
                    <p className="section-subtitle">Generate a premium profile-ready README block with social buttons</p>

                    <div className="badge-input-grid">
                        <div>
                            <label className="badge-input-label" htmlFor="portfolio-url">Portfolio URL</label>
                            <input
                                id="portfolio-url"
                                type="text"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                placeholder="your-site.dev"
                                className="badge-input"
                            />
                        </div>
                        <div>
                            <label className="badge-input-label" htmlFor="linkedin-username">LinkedIn Username</label>
                            <input
                                id="linkedin-username"
                                type="text"
                                value={linkedinUsername}
                                onChange={(e) => setLinkedinUsername(e.target.value)}
                                placeholder="your-linkedin-username"
                                className="badge-input"
                            />
                        </div>
                    </div>

                    {/* Badge preview (standard) */}
                    <div className="badge-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={badgePath}
                            alt="GitWrapped Badge"
                            className="badge-img"
                        />
                    </div>

                    <div className="readme-preview">
                        <h3 className="card-title">README snippet preview</h3>
                        <pre className="readme-snippet">{readmeSnippet}</pre>
                    </div>

                    {/* Copy button */}
                    <button
                        onClick={handleCopyBadge}
                        className="btn badge-copy-btn"
                    >
                        {badgeCopied ? <Check size={14} /> : <Copy size={14} />}
                        {badgeCopied ? "Copied!" : "Copy README Snippet"}
                    </button>
                </section>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Pokémon Card View (third mode)
   ───────────────────────────────────────────── */

function PokemonCardView({ stats }: DashboardClientProps) {
    const { setMode } = useViewMode();
    const cardData = useMemo(() => buildCardData(stats), [stats]);
    const [copied, setCopied] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const cardPreviewRef = useRef<HTMLDivElement>(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://gitwrapped.aryansync.com";
    const cardUrl = `${origin}/api/card/${stats.user.login}`;
    const markdownSnippet = `![${stats.user.login}'s Dev Card](${cardUrl})`;

    const handleCopyMarkdown = async () => {
        await navigator.clipboard.writeText(markdownSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadImage = async () => {
        if (!cardPreviewRef.current || isCapturing) return;
        try {
            setIsCapturing(true);
            // Wait for captureMode to take effect
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

            const dataUrl = await domToPng(cardPreviewRef.current, {
                scale: 2,
                backgroundColor: null,
                style: { margin: "0", padding: "0" },
            });

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${stats.user.login}-dev-card.png`;
            link.click();
        } catch (error) {
            console.error("Failed to download image:", error);
            alert("Failed to download image. Please try again.");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="pokemon-card-view">
            <TechCursor />
            <nav className="dashboard-nav">
                <div className="dashboard-nav__left">
                    <a href="/" className="dashboard-nav__logo">GitWrapped</a>
                </div>
                <div className="dashboard-nav__center">
                    <ModeToggle />
                </div>
                <div className="dashboard-nav__right" />
            </nav>

            <div className="pokemon-card-view__content">
                <div className="pokemon-card-view__header">
                    <h2 className="pokemon-card-view__title">Your Dev Pokémon Card</h2>
                    <p className="pokemon-card-view__subtitle">
                        A collectible trading card generated from your GitHub profile
                    </p>
                </div>

                <div className="pokemon-card-view__card-wrapper" ref={cardPreviewRef}>
                    <PokemonCard data={cardData} captureMode={isCapturing} />
                </div>

                <div className="pokemon-card-view__actions">
                    <div className="pokemon-card-view__embed">
                        <p className="pokemon-card-view__embed-label">Embed in your README:</p>
                        <pre className="pokemon-card-view__embed-code">{markdownSnippet}</pre>
                    </div>

                    <div className="pokemon-card-view__buttons">
                        <button onClick={handleCopyMarkdown} className="btn badge-copy-btn">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy Markdown"}
                        </button>
                        <button onClick={handleDownloadImage} className="btn badge-copy-btn">
                            <Download size={14} />
                            {isCapturing ? "Preparing PNG..." : "Download Image"}
                        </button>
                    </div>

                    <button
                        onClick={() => setMode("dashboard")}
                        className="pokemon-card-view__back"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
