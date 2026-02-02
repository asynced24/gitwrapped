"use client";

import { motion } from "framer-motion";
import { DayHourActivity } from "@/types/github";

interface CodingScheduleProps {
    data: DayHourActivity[];
    mostActiveHour: number;
    mostActiveDay: string;
}

export function CodingSchedule({ data, mostActiveHour, mostActiveDay }: CodingScheduleProps) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const maxCount = Math.max(...data.map((d) => d.count));

    const getHeatColor = (count: number) => {
        const intensity = count / maxCount;
        if (intensity === 0) return "var(--hover-bg)";
        if (intensity < 0.25) return "#0e4429";
        if (intensity < 0.5) return "#006d32";
        if (intensity < 0.75) return "#26a641";
        return "#39d353";
    };

    const formatHour = (hour: number) => {
        if (hour === 0) return "12a";
        if (hour === 12) return "12p";
        if (hour < 12) return `${hour}a`;
        return `${hour - 12}p`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                    Coding Schedule
                </h3>
                <div className="text-sm text-[var(--muted)]">
                    Peak: <span className="text-[var(--foreground)]">{mostActiveDay}</span> at{" "}
                    <span className="text-[var(--foreground)]">{formatHour(mostActiveHour)}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Hour labels */}
                    <div className="flex mb-2 ml-10">
                        {hours
                            .filter((h) => h % 3 === 0)
                            .map((hour) => (
                                <div
                                    key={hour}
                                    className="text-xs text-[var(--muted)]"
                                    style={{ width: "12.5%", textAlign: "center" }}
                                >
                                    {formatHour(hour)}
                                </div>
                            ))}
                    </div>

                    {/* Heatmap grid */}
                    {days.map((day, dayIndex) => (
                        <div key={day} className="flex items-center mb-1">
                            <div className="w-10 text-xs text-[var(--muted)]">{day}</div>
                            <div className="flex flex-1 gap-0.5">
                                {hours.map((hour) => {
                                    const activity = data.find(
                                        (d) => d.day === dayIndex && d.hour === hour
                                    );
                                    const count = activity?.count || 0;

                                    return (
                                        <motion.div
                                            key={hour}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: (dayIndex * 24 + hour) * 0.002,
                                            }}
                                            className="flex-1 h-5 rounded-sm cursor-pointer transition-transform hover:scale-110"
                                            style={{ background: getHeatColor(count) }}
                                            title={`${day} ${formatHour(hour)}: ${count} activities`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-[var(--muted)]">
                <span>Less</span>
                <div className="w-4 h-4 rounded-sm" style={{ background: "var(--hover-bg)" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "#0e4429" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "#006d32" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "#26a641" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "#39d353" }} />
                <span>More</span>
            </div>
        </motion.div>
    );
}
