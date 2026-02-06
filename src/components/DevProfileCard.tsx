"use client";

import { Star, GitFork, Code2, Zap, Copy, Check, ExternalLink } from "lucide-react";
import { UserStats, LanguageStats } from "@/types/github";
import { useState } from "react";

interface DevProfileCardProps {
    stats: UserStats;
    compact?: boolean;
}

/**
 * DevProfileCard - The shareable "identity card" component
 * Can be embedded in portfolios and shared as a link
 */
export function DevProfileCard({ stats, compact = false }: DevProfileCardProps) {
    const [copied, setCopied] = useState(false);
    const { user, languageStats, totalStars, totalForks, languageDiversity, topLanguage } = stats;

    // Get top 3 languages for display
    const topLanguages = languageStats
        .filter(l => !l.isMarkup)
        .slice(0, 3);

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/dashboard/${user.login}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`dev-profile-card ${compact ? 'dev-profile-card--compact' : ''}`}>
            {/* Gradient accent bar */}
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

                {/* Language diversity indicator */}
                <div className="dev-profile-card__diversity">
                    <Code2 size={14} />
                    <span className="dev-profile-card__diversity-label">
                        {languageDiversity} developer
                    </span>
                </div>

                {/* Top languages */}
                {topLanguages.length > 0 && (
                    <div className="dev-profile-card__languages">
                        {topLanguages.map((lang) => (
                            <LanguageTag key={lang.language} language={lang} />
                        ))}
                    </div>
                )}

                {/* Quick stats */}
                <div className="dev-profile-card__stats">
                    <div className="dev-profile-card__stat">
                        <Star size={14} />
                        <span>{totalStars.toLocaleString()}</span>
                    </div>
                    <div className="dev-profile-card__stat">
                        <GitFork size={14} />
                        <span>{totalForks.toLocaleString()}</span>
                    </div>
                    <div className="dev-profile-card__stat">
                        <Zap size={14} />
                        <span>{stats.publicRepoCount} repos</span>
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

            {/* GitWrapped branding */}
            <div className="dev-profile-card__branding">
                <span>GitWrapped</span>
            </div>
        </div>
    );
}

function LanguageTag({ language }: { language: LanguageStats }) {
    return (
        <span
            className="dev-profile-card__lang-tag"
            style={{ '--lang-color': language.color } as React.CSSProperties}
        >
            <span className="dev-profile-card__lang-dot" />
            {language.language}
            <span className="dev-profile-card__lang-pct">{language.percentage}%</span>
        </span>
    );
}
