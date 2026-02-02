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
        if (intensity === 0) return "rgba(255, 255, 255, 0.03)";
        if (intensity < 0.25) return "rgba(139, 92, 246, 0.2)";
        if (intensity < 0.5) return "rgba(139, 92, 246, 0.4)";
        if (intensity < 0.75) return "rgba(139, 92, 246, 0.6)";
        return "rgba(139, 92, 246, 0.9)";
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
                <h3 className="text-lg font-semibold gradient-text">
                    Coding Schedule
                </h3>
                <div className="text-sm text-white/50">
                    Peak: <span className="text-purple-400">{mostActiveDay}</span> at{" "}
                    <span className="text-cyan-400">{formatHour(mostActiveHour)}</span>
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
                                    className="text-xs text-white/40"
                                    style={{ width: "12.5%", textAlign: "center" }}
                                >
                                    {formatHour(hour)}
                                </div>
                            ))}
                    </div>

                    {/* Heatmap grid */}
                    {days.map((day, dayIndex) => (
                        <div key={day} className="flex items-center mb-1">
                            <div className="w-10 text-xs text-white/40">{day}</div>
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
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-white/40">
                <span>Less</span>
                <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(255, 255, 255, 0.03)" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(139, 92, 246, 0.2)" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(139, 92, 246, 0.4)" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(139, 92, 246, 0.6)" }} />
                <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(139, 92, 246, 0.9)" }} />
                <span>More</span>
            </div>
        </motion.div>
    );
}
