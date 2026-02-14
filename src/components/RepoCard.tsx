"use client";

import { Repository, getLanguageColor } from "@/types/github";
import { Star, GitFork, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RepoCardProps {
    repo: Repository;
    highlight?: boolean;
}

export function RepoCard({ repo, highlight = false }: RepoCardProps) {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`repo-card ${highlight ? 'repo-card--highlight' : ''}`}
        >
            {highlight && (
                <span className="repo-card__badge">Most Impactful</span>
            )}
            <div className="repo-name">{repo.name}</div>
            {repo.description && (
                <p className="repo-description">{repo.description}</p>
            )}
            <div className="repo-stats">
                {repo.language && (
                    <span className="language-legend-item">
                        <span
                            className="language-dot"
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                        />
                        {repo.language}
                    </span>
                )}
                {repo.stargazers_count > 0 && (
                    <span className="language-legend-item">
                        <Star size={14} />
                        {repo.stargazers_count.toLocaleString()}
                    </span>
                )}
                {repo.forks_count > 0 && (
                    <span className="language-legend-item">
                        <GitFork size={14} />
                        {repo.forks_count.toLocaleString()}
                    </span>
                )}
                <span className="language-legend-item text-muted">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true })}
                </span>
            </div>
        </a>
    );
}
