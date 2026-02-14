"use client";

import { MonthlyActivity } from "@/types/github";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
    data: MonthlyActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    // Filter to only months with some activity for a cleaner view
    const chartData = data.map(d => ({
        month: formatMonth(d.month),
        rawMonth: d.month,
        activity: d.reposCreated + d.reposPushed,
        created: d.reposCreated,
        pushed: d.reposPushed,
    }));

    return (
        <div className="activity-chart">
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                        contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                            color: "var(--text-primary)",
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: any) => {
                            const label = name === "created" ? "Created" : name === "pushed" ? "Pushed" : "Activity";
                            return [value, label];
                        }}
                        labelFormatter={(label: any) => String(label)}
                    />
                    <Area
                        type="monotone"
                        dataKey="activity"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        fill="url(#activityGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "var(--accent-primary)" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
}
