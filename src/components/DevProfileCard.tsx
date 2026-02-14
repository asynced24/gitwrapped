"use client";

import { Star, GitFork, Code2, Copy, Check, ExternalLink } from "lucide-react";
import { UserStats } from "@/types/github";
import { useState } from "react";

interface DevProfileCardProps {
    stats: UserStats;
    compact?: boolean;
}

/**
 * DevProfileCard - The shareable "identity card" component
 * Focuses on identity, not vanity metrics.
 */
export function DevProfileCard({ stats, compact = false }: DevProfileCardProps) {
    const [copied, setCopied] = useState(false);
    const { user, languageStats, totalStars, totalForks, languageDiversity } = stats;

    // Get top 3 programming languages for display (no percentages, just names)
    const topLanguages = languageStats
        .filter(l => !l.isMarkup)
        .slice(0, 3);

    // Unique language count
    const languageCount = languageStats.filter(l => !l.isMarkup).length;

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/dashboard/${user.login}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`dev-profile-card ${compact ? 'dev-profile-card--compact' : ''}`}>
            {/* Accent bar */}
            <div className="dev-profile-card__accent" />

            <div className="dev-profile-card__content">
                {/* Header with avatar and name */}
                <div className="dev-profile-card__header">
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="dev-profile-card__avatar"
                    />
                    <div className="dev-profile-card__info">
                        <h3 className="dev-profile-card__name">{user.name || user.login}</h3>
                        <p className="dev-profile-card__username">@{user.login}</p>
                    </div>
                </div>

                {/* Identity metrics */}
                <div className="dev-profile-card__identity">
                    <span className="dev-profile-card__identity-item">
                        {stats.accountAgeYears}y on GitHub
                    </span>
                    <span className="dev-profile-card__identity-sep">•</span>
                    <span className="dev-profile-card__identity-item">
                        {languageCount} languages
                    </span>
                    <span className="dev-profile-card__identity-sep">•</span>
                    <span className="dev-profile-card__identity-item">
                        {stats.ownRepoCount} repos
                    </span>
                </div>

                {/* Top languages */}
                {topLanguages.length > 0 && (
                    <div className="dev-profile-card__languages">
                        {topLanguages.map((lang) => (
                            <span
                                key={lang.language}
                                className="dev-profile-card__lang-tag"
                                style={{ '--lang-color': lang.color } as React.CSSProperties}
                            >
                                <span className="dev-profile-card__lang-dot" />
                                {lang.language}
                            </span>
                        ))}
                    </div>
                )}

                {/* Quick stats - only show meaningful ones */}
                <div className="dev-profile-card__stats">
                    {totalStars >= 10 && (
                        <div className="dev-profile-card__stat">
                            <Star size={14} />
                            <span>{totalStars.toLocaleString()}</span>
                        </div>
                    )}
                    {totalForks >= 5 && (
                        <div className="dev-profile-card__stat">
                            <GitFork size={14} />
                            <span>{totalForks.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="dev-profile-card__stat">
                        <Code2 size={14} />
                        <span>{languageDiversity}</span>
                    </div>
                </div>

                {/* Actions */}
                {!compact && (
                    <div className="dev-profile-card__actions">
                        <button
                            onClick={handleCopyLink}
                            className="btn dev-profile-card__copy"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy link"}
                        </button>
                        <a
                            href={`https://github.com/${user.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                        >
                            <ExternalLink size={14} />
                            GitHub
                        </a>
                    </div>
                )}
            </div>

            {/* Branding */}
            <div className="dev-profile-card__branding">
                <span>GitWrapped</span>
            </div>
        </div>
    );
}
