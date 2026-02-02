"use client";

import { motion } from "framer-motion";

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen py-8">
            <div className="container">
                {/* Profile skeleton */}
                <div className="glass-card p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-28 h-28 rounded-full skeleton" />
                        <div className="flex-1 space-y-3">
                            <div className="h-8 w-48 skeleton" />
                            <div className="h-5 w-32 skeleton" />
                            <div className="h-4 w-64 skeleton" />
                            <div className="flex gap-4">
                                <div className="h-4 w-24 skeleton" />
                                <div className="h-4 w-24 skeleton" />
                                <div className="h-4 w-24 skeleton" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6"
                        >
                            <div className="h-4 w-16 skeleton mb-3" />
                            <div className="h-8 w-24 skeleton" />
                        </motion.div>
                    ))}
                </div>

                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="glass-card p-6">
                        <div className="h-6 w-32 skeleton mb-4" />
                        <div className="flex items-center gap-6">
                            <div className="w-48 h-48 rounded-full skeleton" />
                            <div className="flex-1 space-y-2">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-4 skeleton" style={{ width: `${100 - i * 10}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="h-6 w-32 skeleton mb-4" />
                        <div className="h-64 skeleton rounded-xl" />
                    </div>
                </div>

                {/* Contribution calendar skeleton */}
                <div className="glass-card p-6 mb-8">
                    <div className="h-6 w-40 skeleton mb-4" />
                    <div className="h-32 skeleton rounded-xl" />
                </div>

                {/* Repos skeleton */}
                <div className="glass-card p-6">
                    <div className="h-6 w-32 skeleton mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5">
                                <div className="h-5 w-32 skeleton mb-2" />
                                <div className="h-4 w-full skeleton mb-3" />
                                <div className="flex gap-4">
                                    <div className="h-4 w-16 skeleton" />
                                    <div className="h-4 w-12 skeleton" />
                                    <div className="h-4 w-12 skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
