"use client";

import { motion } from "framer-motion";
import { LanguageStats } from "@/types/github";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface LanguageChartProps {
    data: LanguageStats[];
}

export function LanguageChart({ data }: LanguageChartProps) {
    const topLanguages = data.slice(0, 8);
    const otherPercentage = data
        .slice(8)
        .reduce((sum, l) => sum + l.percentage, 0);

    const chartData = otherPercentage > 0
        ? [...topLanguages, { language: "Other", percentage: otherPercentage, color: "#6b7280" }]
        : topLanguages;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6"
        >
            <h3 className="text-lg font-semibold mb-4 gradient-text">
                Language Radar
            </h3>

            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="percentage"
                                nameKey="language"
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={2}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="transition-opacity hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(0,0,0,0.9)",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "white",
                                }}
                                formatter={(value: number) => [`${value}%`, ""]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2">
                    {chartData.map((lang, index) => (
                        <motion.div
                            key={lang.language}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                            className="flex items-center gap-2"
                        >
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ background: lang.color }}
                            />
                            <span className="text-sm text-white/70 truncate">
                                {lang.language}
                            </span>
                            <span className="text-sm text-white/40 ml-auto">
                                {lang.percentage}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
