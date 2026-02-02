"use client";

import { motion } from "framer-motion";
import { UserStats, LanguageStats } from "@/types/github";
import { Download, Share2 } from "lucide-react";

interface WrappedCardProps {
    stats: UserStats;
}

export function WrappedCard({ stats }: WrappedCardProps) {
    const { user, totalCommits, totalStars, languageStats, longestStreak, topRepositories } = stats;
    const topLanguage = languageStats[0]?.language || "Code";
    const topRepo = topRepositories[0]?.name || "Repository";

    const handleDownload = async () => {
        const card = document.getElementById("wrapped-card");
        if (!card) return;

        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(card, {
                backgroundColor: null,
                scale: 2,
            });

            const link = document.createElement("a");
            link.download = `${user.login}-gitwrapped.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${user.name || user.login}'s GitWrapped`,
            text: `Check out my GitHub Wrapped! ${totalCommits} commits, ${totalStars} stars, and my top language is ${topLanguage}.`,
            url: window.location.href,
        };

        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(
                `${shareData.text}\n${shareData.url}`
            );
            alert("Link copied to clipboard!");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="glass-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold gradient-text">
                    Your GitWrapped Card
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Share"
                    >
                        <Share2 size={18} className="text-white/70" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Download"
                    >
                        <Download size={18} className="text-white/70" />
                    </button>
                </div>
            </div>

            {/* Shareable Card */}
            <div
                id="wrapped-card"
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                }}
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]" />

                {/* Card Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <img
                            src={user.avatar_url}
                            alt={user.login}
                            className="w-16 h-16 rounded-full ring-2 ring-purple-500/50"
                        />
                        <div>
                            <h4 className="text-xl font-bold text-white">{user.name || user.login}</h4>
                            <p className="text-white/50">@{user.login}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-xs text-white/40 uppercase tracking-wider">Year in Code</div>
                            <div className="text-2xl font-bold gradient-text">2024</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-purple-400">{totalCommits.toLocaleString()}</div>
                            <div className="text-xs text-white/50 uppercase mt-1">Commits</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-cyan-400">{totalStars.toLocaleString()}</div>
                            <div className="text-xs text-white/50 uppercase mt-1">Stars Earned</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-pink-400">{longestStreak}</div>
                            <div className="text-xs text-white/50 uppercase mt-1">Day Streak</div>
                        </div>
                    </div>

                    {/* Top Language & Repo */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="text-xs text-white/40 uppercase mb-1">Top Language</div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: languageStats[0]?.color || "#8b5cf6" }}
                                />
                                <span className="font-semibold text-white">{topLanguage}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="text-xs text-white/40 uppercase mb-1">Top Repo</div>
                            <div className="font-semibold text-white truncate">{topRepo}</div>
                        </div>
                    </div>

                    {/* Language Bar */}
                    <div className="mb-6">
                        <div className="text-xs text-white/40 uppercase mb-2">Languages Used</div>
                        <div className="flex h-3 rounded-full overflow-hidden">
                            {languageStats.slice(0, 5).map((lang, index) => (
                                <div
                                    key={lang.language}
                                    className="h-full"
                                    style={{
                                        width: `${lang.percentage}%`,
                                        background: lang.color,
                                    }}
                                    title={`${lang.language}: ${lang.percentage}%`}
                                />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {languageStats.slice(0, 5).map((lang) => (
                                <div key={lang.language} className="flex items-center gap-1 text-xs text-white/50">
                                    <span className="w-2 h-2 rounded-full" style={{ background: lang.color }} />
                                    <span>{lang.language}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-white/40">
                        <span>Generated with GitWrapped</span>
                        <span className="gradient-text font-semibold">gitwrapped.dev</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
