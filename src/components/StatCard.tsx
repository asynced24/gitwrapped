"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
    delay?: number;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    color = "var(--primary)",
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="glass-card p-6"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--muted)] mb-1">{label}</p>
                    <motion.h3
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: delay + 0.2 }}
                        className="text-3xl font-bold"
                        style={{ color }}
                    >
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </motion.h3>
                    {subValue && (
                        <p className="text-xs text-[var(--muted)] mt-1">{subValue}</p>
                    )}
                </div>
                <div
                    className="p-3 rounded-xl bg-[var(--hover-bg)]"
                >
                    <Icon size={24} style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}
