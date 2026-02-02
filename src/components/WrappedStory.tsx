"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { UserStats } from "@/types/github";
import { useViewMode } from "@/context/ViewModeContext";

interface WrappedStoryProps {
    stats: UserStats;
}

interface Slide {
    id: string;
    title: string;
    value: string | number;
    label: string;
    detail?: string;
    color?: string;
}

export function WrappedStory({ stats }: WrappedStoryProps) {
    const { setMode } = useViewMode();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    const slides: Slide[] = [
        {
            id: "intro",
            title: "Your Year in Code",
            value: "2024",
            label: `@${stats.user.login}`,
            color: "#8b5cf6",
        },
        {
            id: "commits",
            title: "You made",
            value: stats.totalCommits.toLocaleString(),
            label: "commits this year",
            detail: `That's about ${Math.round(stats.totalCommits / 365)} commits per day`,
            color: "#8b5cf6",
        },
        {
            id: "stars",
            title: "Your repos earned",
            value: stats.totalStars.toLocaleString(),
            label: "stars",
            detail: stats.totalStars > 100 ? "People love your work!" : "Building your reputation",
            color: "#f59e0b",
        },
        {
            id: "streak",
            title: "Your longest streak was",
            value: stats.longestStreak,
            label: "consecutive days",
            detail: stats.longestStreak > 30 ? "That's impressive dedication!" : "Every streak counts",
            color: "#ef4444",
        },
        {
            id: "language",
            title: "Your top language",
            value: stats.languageStats[0]?.language || "Code",
            label: `${stats.languageStats[0]?.percentage || 0}% of your code`,
            color: stats.languageStats[0]?.color || "#8b5cf6",
        },
        {
            id: "schedule",
            title: "You code most on",
            value: stats.mostActiveDay,
            label: `around ${stats.mostActiveHour > 12 ? stats.mostActiveHour - 12 : stats.mostActiveHour || 12} ${stats.mostActiveHour >= 12 ? "PM" : "AM"}`,
            color: "#06b6d4",
        },
        {
            id: "repos",
            title: "You have",
            value: stats.user.public_repos,
            label: "public repositories",
            detail: stats.topRepositories[0] ? `Top repo: ${stats.topRepositories[0].name}` : undefined,
            color: "#10b981",
        },
        {
            id: "outro",
            title: "Keep building",
            value: stats.user.name || stats.user.login,
            label: `${stats.accountAge}+ years on GitHub`,
            color: "#8b5cf6",
        },
    ];

    const goToSlide = (index: number) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setDirection(1);
            setCurrentSlide((prev) => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setDirection(-1);
            setCurrentSlide((prev) => prev - 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextSlide();
            if (e.key === "ArrowLeft") prevSlide();
            if (e.key === "Escape") setMode("dashboard");
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSlide]);

    const progress = ((currentSlide + 1) / slides.length) * 100;
    const slide = slides[currentSlide];

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? "-100%" : "100%",
            opacity: 0,
        }),
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: "#0a0a0f" }}>
            {/* Background gradient orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(100px)" }} />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)", filter: "blur(100px)" }} />

            {/* Progress bar */}
            <motion.div
                className="wrapped-progress"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
            />

            {/* Close button */}
            <button
                onClick={() => setMode("dashboard")}
                className="fixed top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Exit Wrapped view"
            >
                <X size={20} />
            </button>

            {/* Navigation arrows */}
            {currentSlide > 0 && (
                <button
                    onClick={prevSlide}
                    className="fixed left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            {currentSlide < slides.length - 1 && (
                <button
                    onClick={nextSlide}
                    className="fixed right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            {/* Slide content */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={slide.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="wrapped-slide"
                >
                    <div className="wrapped-slide-content">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg mb-6"
                            style={{ color: "var(--muted)" }}
                        >
                            {slide.title}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="wrapped-stat-value"
                            style={{
                                background: `linear-gradient(135deg, ${slide.color}, #06b6d4)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {slide.value}
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="wrapped-stat-label"
                        >
                            {slide.label}
                        </motion.p>

                        {slide.detail && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-sm mt-8"
                                style={{ color: "var(--muted)" }}
                            >
                                {slide.detail}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="wrapped-nav">
                {slides.map((s, index) => (
                    <button
                        key={s.id}
                        className="wrapped-nav-dot"
                        data-active={index === currentSlide}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
