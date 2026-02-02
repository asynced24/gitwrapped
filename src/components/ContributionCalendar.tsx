"use client";

import { motion } from "framer-motion";
import { ContributionWeek } from "@/types/github";

interface ContributionCalendarProps {
    data: ContributionWeek[];
}

const LEVEL_COLORS = [
    "rgba(255, 255, 255, 0.05)",
    "#1e4620",
    "#2ea043",
    "#40c463",
    "#57d96a",
];

export function ContributionCalendar({ data }: ContributionCalendarProps) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const getMonthLabels = () => {
        const labels: { month: string; position: number }[] = [];
        let lastMonth = -1;

        data.forEach((week, weekIndex) => {
            const firstDay = week.days[0];
            if (firstDay) {
                const date = new Date(firstDay.date);
                const month = date.getMonth();
                if (month !== lastMonth) {
                    labels.push({ month: months[month], position: weekIndex });
                    lastMonth = month;
                }
            }
        });

        return labels;
    };

    const monthLabels = getMonthLabels();
    const days = ["", "Mon", "", "Wed", "", "Fri", ""];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 overflow-x-auto"
        >
            <h3 className="text-lg font-semibold mb-4 gradient-text">
                Contribution Activity
            </h3>

            <div className="flex">
                <div className="flex flex-col justify-around pr-2 text-xs text-white/40">
                    {days.map((day, i) => (
                        <span key={i} className="h-3">{day}</span>
                    ))}
                </div>

                <div className="flex-1">
                    <div className="flex text-xs text-white/40 mb-1">
                        {monthLabels.map(({ month, position }) => (
                            <span
                                key={position}
                                style={{
                                    marginLeft: position === 0 ? 0 : `${(position - (monthLabels[monthLabels.indexOf({ month, position }) - 1]?.position || 0)) * 14}px`
                                }}
                            >
                                {month}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-[3px]">
                        {data.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                {week.days.map((day, dayIndex) => (
                                    <motion.div
                                        key={day.date}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: (weekIndex * 7 + dayIndex) * 0.001,
                                        }}
                                        className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-150 hover:z-10"
                                        style={{ background: LEVEL_COLORS[day.level] }}
                                        title={`${day.date}: ${day.count} contributions`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-white/40">
                <span>Less</span>
                {LEVEL_COLORS.map((color, i) => (
                    <div
                        key={i}
                        className="w-3 h-3 rounded-sm"
                        style={{ background: color }}
                    />
                ))}
                <span>More</span>
            </div>
        </motion.div>
    );
}
