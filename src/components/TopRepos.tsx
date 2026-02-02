"use client";

import { motion } from "framer-motion";
import { Repository, getLanguageColor } from "@/types/github";
import { Star, GitFork, ExternalLink } from "lucide-react";

interface TopReposProps {
    repositories: Repository[];
}

export function TopRepos({ repositories }: TopReposProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
        >
            <h3 className="text-lg font-semibold mb-4">
                Top Repositories
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repositories.map((repo, index) => (
                    <motion.a
                        key={repo.id}
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        className="group p-4 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate flex-1">
                                {repo.name}
                            </h4>
                            <ExternalLink
                                size={14}
                                className="text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors ml-2"
                            />
                        </div>

                        {repo.description && (
                            <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">
                                {repo.description}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                            {repo.language && (
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ background: getLanguageColor(repo.language) }}
                                    />
                                    <span className="text-[var(--muted)]">{repo.language}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 text-[var(--muted)]">
                                <Star size={14} />
                                <span>{repo.stargazers_count.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[var(--muted)]">
                                <GitFork size={14} />
                                <span>{repo.forks_count.toLocaleString()}</span>
                            </div>
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
