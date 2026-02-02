"use client";

import { Repository, getLanguageColor } from "@/types/github";
import { Star, GitFork } from "lucide-react";

interface RepoCardProps {
    repo: Repository;
}

export function RepoCard({ repo }: RepoCardProps) {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="repo-card"
        >
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
            </div>
        </a>
    );
}
