"use client";

import { motion } from "framer-motion";
import { MonthlyCommits } from "@/types/github";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface CommitChartProps {
    data: MonthlyCommits[];
}

export function CommitChart({ data }: CommitChartProps) {
    const maxCommits = Math.max(...data.map((d) => d.commits));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
        >
            <h3 className="text-lg font-semibold mb-4 gradient-text">
                Commit Timeline
            </h3>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#f472b6" />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                            domain={[0, maxCommits * 1.1]}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(0,0,0,0.9)",
                                border: "none",
                                borderRadius: "8px",
                                color: "white",
                            }}
                            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                            formatter={(value: number) => [
                                `${value} commits`,
                                "",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="commits"
                            stroke="url(#lineGradient)"
                            strokeWidth={3}
                            fill="url(#commitGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
