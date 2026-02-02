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
}

/**
 * WrappedStory presents GitHub stats in a story format.
 * All insights are derived from real, verifiable GitHub API data.
 */
export function WrappedStory({ stats }: WrappedStoryProps) {
    const { setMode } = useViewMode();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    // Build slides from real data only
    const slides: Slide[] = [
        {
            id: "intro",
            title: "Your GitHub profile",
            value: stats.user.login,
            label: stats.user.name || "Developer",
        },
        {
            id: "repos",
            title: "You have",
            value: stats.publicRepoCount,
            label: stats.publicRepoCount === 1 ? "public repository" : "public repositories",
            detail: stats.ownRepoCount > 0
                ? `${stats.ownRepoCount} original, ${stats.forkedRepoCount} forked`
                : undefined,
        },
        {
            id: "stars",
            title: "Your repos have earned",
            value: stats.totalStars.toLocaleString(),
            label: stats.totalStars === 1 ? "star" : "stars",
            detail: stats.hasPopularRepo && stats.mostStarredRepo
                ? `Most starred: ${stats.mostStarredRepo.name}`
                : undefined,
        },
    ];

    // Only add language slide if we have language data
    if (stats.topLanguage) {
        slides.push({
            id: "language",
            title: "Your most used language is",
            value: stats.topLanguage,
            label: `${stats.topLanguagePercentage}% of your code`,
            detail: `You're a ${stats.languageDiversity} developer`,
        });
    }

    // Add followers if significant
    if (stats.user.followers > 0) {
        slides.push({
            id: "followers",
            title: "You have",
            value: stats.user.followers.toLocaleString(),
            label: stats.user.followers === 1 ? "follower" : "followers",
        });
    }

    // Add account age
    slides.push({
        id: "age",
        title: "You've been on GitHub for",
        value: stats.accountAgeYears,
        label: stats.accountAgeYears === 1 ? "year" : "years",
        detail: stats.mostActiveYear
            ? `Most repos created in ${stats.mostActiveYear}`
            : undefined,
    });

    // Closing slide
    slides.push({
        id: "outro",
        title: stats.recentlyActive ? "You're still building" : "Keep building",
        value: "→",
        label: stats.user.name || stats.user.login,
    });

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
        <div className="wrapped-container" data-theme="wrapped">
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
                className="wrapped-close btn"
                aria-label="Exit Wrapped view"
            >
                <X size={16} />
            </button>

            {/* Navigation arrows */}
            {currentSlide > 0 && (
                <button
                    onClick={prevSlide}
                    className="wrapped-arrow wrapped-arrow-left"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>
            )}
            {currentSlide < slides.length - 1 && (
                <button
                    onClick={nextSlide}
                    className="wrapped-arrow wrapped-arrow-right"
                    aria-label="Next slide"
                >
                    <ChevronRight size={20} />
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
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="wrapped-slide"
                >
                    <p className="wrapped-title">{slide.title}</p>
                    <div className="wrapped-value">{slide.value}</div>
                    <p className="wrapped-label">{slide.label}</p>
                    {slide.detail && (
                        <p className="wrapped-detail">{slide.detail}</p>
                    )}
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
