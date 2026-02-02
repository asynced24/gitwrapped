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
            <h3 className="text-lg font-semibold mb-4">
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
                                <stop offset="0%" stopColor="var(--primary, #2f81f7)" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="var(--primary, #2f81f7)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--muted)", fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--muted)", fontSize: 12 }}
                            domain={[0, maxCommits * 1.1]}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "var(--card-bg)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                color: "var(--foreground)",
                            }}
                            labelStyle={{ color: "var(--muted)" }}
                            formatter={(value: number) => [
                                `${value} commits`,
                                "",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="commits"
                            stroke="var(--primary, #2f81f7)"
                            strokeWidth={2}
                            fill="url(#commitGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
