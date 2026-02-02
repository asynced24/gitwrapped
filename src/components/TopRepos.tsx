"use client";

import { motion } from "framer-motion";
import { Repository } from "@/types/github";
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
            <h3 className="text-lg font-semibold mb-4 gradient-text">
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
                        className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/10"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors truncate flex-1">
                                {repo.name}
                            </h4>
                            <ExternalLink
                                size={14}
                                className="text-white/30 group-hover:text-purple-400 transition-colors ml-2"
                            />
                        </div>

                        {repo.description && (
                            <p className="text-sm text-white/50 mb-3 line-clamp-2">
                                {repo.description}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                            {repo.language && (
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{
                                            background:
                                                repo.language === "TypeScript"
                                                    ? "#3178c6"
                                                    : repo.language === "JavaScript"
                                                        ? "#f7df1e"
                                                        : repo.language === "Python"
                                                            ? "#3572A5"
                                                            : "#6b7280",
                                        }}
                                    />
                                    <span className="text-white/50">{repo.language}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 text-white/40">
                                <Star size={14} />
                                <span>{repo.stargazers_count}</span>
                            </div>

                            <div className="flex items-center gap-1 text-white/40">
                                <GitFork size={14} />
                                <span>{repo.forks_count}</span>
                            </div>
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
