"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-8"
                >
                    <Search size={40} className="text-purple-400" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold mb-4"
                >
                    User <span className="gradient-text">Not Found</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/60 mb-8"
                >
                    We couldn&apos;t find a GitHub user with that username.
                    Please check the spelling and try again.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        href="/"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
