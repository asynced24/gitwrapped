"use client";

import type { MonthlyContributions } from "@/types/github";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ActivityChartProps {
    data: MonthlyContributions[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(month: string): string {
    const [year, m] = month.split("-");
    return `${MONTHS[Number(m) - 1]} '${year.slice(2)}`;
}

/** Contributions per calendar month, last 12 months, from the contribution calendar. */
export function ActivityChart({ data }: ActivityChartProps) {
    const chartData = data.map(d => ({ month: formatMonth(d.month), count: d.count }));

    return (
        <div className="activity-chart">
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border-muted)" }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: "var(--border-muted)", opacity: 0.4 }}
                        contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                            color: "var(--text-primary)",
                        }}
                        formatter={(value) => [Number(value).toLocaleString("en-US"), "Contributions"]}
                    />
                    <Bar dataKey="count" fill="var(--accent-primary)" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
