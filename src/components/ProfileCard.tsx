"use client";

import { motion } from "framer-motion";
import { GitHubUser } from "@/types/github";
import { MapPin, Link as LinkIcon, Building2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileCardProps {
    user: GitHubUser;
    totalStars: number;
    totalCommits: number;
    accountAge: number;
}

export function ProfileCard({ user, totalStars, totalCommits, accountAge }: ProfileCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 relative overflow-hidden"
        >
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="relative"
                >
                    <div className="avatar-ring">
                        <img
                            src={user.avatar_url}
                            alt={user.login}
                            className="w-28 h-28 rounded-full object-cover"
                        />
                    </div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-[var(--background)]"
                        style={{ background: "var(--success)" }}
                    />
                </motion.div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold mb-1"
                    >
                        {user.name || user.login}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="text-[var(--muted)] text-lg mb-3"
                    >
                        @{user.login}
                    </motion.p>

                    {user.bio && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-[var(--foreground)] opacity-80 mb-4 max-w-lg"
                        >
                            {user.bio}
                        </motion.p>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-[var(--muted)]"
                    >
                        {user.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                <span>{user.location}</span>
                            </div>
                        )}
                        {user.company && (
                            <div className="flex items-center gap-1.5">
                                <Building2 size={14} />
                                <span>{user.company}</span>
                            </div>
                        )}
                        {user.blog && (
                            <a
                                href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
                            >
                                <LinkIcon size={14} />
                                <span>{user.blog.replace(/^https?:\/\//, "")}</span>
                            </a>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>Joined {formatDistanceToNow(new Date(user.created_at))} ago</span>
                        </div>
                    </motion.div>
                </div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex md:flex-col gap-4 md:gap-2 text-center"
                >
                    <div className="px-4 py-2 rounded-xl bg-[var(--hover-bg)]">
                        <div className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                            {user.followers.toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--muted)]">Followers</div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[var(--hover-bg)]">
                        <div className="text-2xl font-bold" style={{ color: "var(--success)" }}>
                            {user.following.toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--muted)]">Following</div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[var(--hover-bg)]">
                        <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                            {user.public_repos}
                        </div>
                        <div className="text-xs text-[var(--muted)]">Repos</div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
