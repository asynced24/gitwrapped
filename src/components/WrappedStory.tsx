"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { UserStats, getLanguageColor } from "@/types/github";
import { useViewMode } from "@/context/ViewModeContext";

interface WrappedStoryProps {
    stats: UserStats;
}

interface Slide {
    id: string;
    type: 'text' | 'superpowers' | 'devops' | 'archaeology' | 'dna' | 'archetype';
    title: string;
    value?: string | number;
    label?: string;
    detail?: string;
}

/**
 * WrappedStory presents GitHub stats in an immersive story format.
 * Enhanced with Developer DNA, Superpowers, DevOps maturity, and Code Archaeology.
 */
export function WrappedStory({ stats }: WrappedStoryProps) {
    const { setMode } = useViewMode();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    // Build slides from real data
    const slides: Slide[] = [
        // Opening
        {
            id: "intro",
            type: "text",
            title: "Your GitHub profile",
            value: stats.user.login,
            label: stats.user.name || "Developer",
        },
        // Repos
        {
            id: "repos",
            type: "text",
            title: "You've created",
            value: stats.ownRepoCount,
            label: stats.ownRepoCount === 1 ? "original repository" : "original repositories",
            detail: stats.forkedRepoCount > 0
                ? `Plus ${stats.forkedRepoCount} forks you're contributing to`
                : undefined,
        },
    ];

    // Stars (if any)
    if (stats.totalStars > 0) {
        slides.push({
            id: "stars",
            type: "text",
            title: "Your work has earned",
            value: stats.totalStars.toLocaleString(),
            label: stats.totalStars === 1 ? "star" : "stars",
            detail: stats.mostStarredRepo
                ? `Your best: ${stats.mostStarredRepo.name}`
                : undefined,
        });
    }

    // Language slide
    if (stats.topLanguage) {
        slides.push({
            id: "language",
            type: "text",
            title: "Your signature language is",
            value: stats.topLanguage,
            label: `${stats.topLanguagePercentage}% of your code`,
            detail: `You're a ${stats.languageDiversity} developer`,
        });
    }

    // Code Archaeology - Language Eras (if we have multiple)
    if (stats.languageEras.length >= 2) {
        slides.push({
            id: "archaeology",
            type: "archaeology",
            title: "Your Code Archaeology",
        });
    }

    // Developer DNA (if they have notebooks)
    if (stats.developerDNA.notebookRepoCount > 0) {
        slides.push({
            id: "dna",
            type: "dna",
            title: "Your Developer DNA",
        });
    }

    // DevOps Maturity (if they have any signals)
    if (stats.devOpsMaturity.score > 0) {
        slides.push({
            id: "devops",
            type: "devops",
            title: "Your DevOps DNA",
        });
    }

    // Superpowers (if they have any)
    if (stats.superpowers.primary) {
        slides.push({
            id: "superpowers",
            type: "superpowers",
            title: "Your Superpowers",
        });
    }

    // Account age
    slides.push({
        id: "age",
        type: "text",
        title: "You've been building for",
        value: stats.accountAgeYears,
        label: stats.accountAgeYears === 1 ? "year" : "years",
        detail: stats.mostActiveYear
            ? `Peak year: ${stats.mostActiveYear}`
            : undefined,
    });

    // Final archetype slide
    slides.push({
        id: "archetype",
        type: "archetype",
        title: "You are a",
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

    // Render slide content based on type
    const renderSlideContent = () => {
        switch (slide.type) {
            case 'superpowers':
                return (
                    <div className="wrapped-special-content">
                        <p className="wrapped-title">{slide.title}</p>
                        <div style={{ marginTop: 32 }}>
                            {stats.superpowers.primary && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="superpower-card superpower-primary"
                                >
                                    <span className="superpower-icon">{stats.superpowers.primary.icon}</span>
                                    <span className="superpower-name">{stats.superpowers.primary.name}</span>
                                    <span className="superpower-desc">{stats.superpowers.primary.description}</span>
                                </motion.div>
                            )}
                            <div className="superpower-secondary-grid">
                                {stats.superpowers.secondary.slice(0, 3).map((power, index) => (
                                    <motion.div
                                        key={power.id}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                        className="superpower-card superpower-secondary"
                                    >
                                        <span className="superpower-icon">{power.icon}</span>
                                        <span className="superpower-name">{power.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'devops':
                const tierLabels = {
                    'code-shipper': 'Code Shipper',
                    'devops-curious': 'DevOps Curious',
                    'pipeline-builder': 'Pipeline Builder',
                    'infrastructure-architect': 'Infrastructure Architect',
                };
                const tierEmoji = {
                    'code-shipper': '📦',
                    'devops-curious': '🔍',
                    'pipeline-builder': '🔧',
                    'infrastructure-architect': '🏗️',
                };
                return (
                    <div className="wrapped-special-content">
                        <p className="wrapped-title">{slide.title}</p>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="devops-tier"
                        >
                            <span className="devops-emoji">{tierEmoji[stats.devOpsMaturity.tier]}</span>
                            <span className="devops-label">{tierLabels[stats.devOpsMaturity.tier]}</span>
                            <span className="devops-score">{stats.devOpsMaturity.score}% DevOps Score</span>
                        </motion.div>
                        <div className="devops-signals">
                            {stats.devOpsMaturity.signals
                                .filter(s => s.found)
                                .map((signal, index) => (
                                    <motion.div
                                        key={signal.type}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                        className="devops-signal"
                                    >
                                        <span>{signal.icon}</span>
                                        <span>{signal.label}</span>
                                        <span className="signal-count">×{signal.repoCount}</span>
                                    </motion.div>
                                ))}
                        </div>
                    </div>
                );

            case 'archaeology':
                return (
                    <div className="wrapped-special-content">
                        <p className="wrapped-title">⛏️ {slide.title}</p>
                        <div className="archaeology-timeline">
                            {stats.languageEras.map((era, index) => (
                                <motion.div
                                    key={era.year}
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 + index * 0.15 }}
                                    className="archaeology-era"
                                >
                                    <span className="era-year">{era.year}</span>
                                    <div
                                        className="era-bar"
                                        style={{ background: era.languageColor }}
                                    />
                                    <div className="era-info">
                                        <span className="era-language">{era.dominantLanguage}</span>
                                        {era.secondaryLanguages.length > 0 && (
                                            <span className="era-secondary">
                                                +{era.secondaryLanguages.map(l => l.language).join(', +')}
                                            </span>
                                        )}
                                        <span className="era-name">{era.eraName}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 'dna':
                const archetypeLabels = {
                    'production-focused': 'Production Developer',
                    'hybrid': 'Hybrid Developer',
                    'research-oriented': 'Research Developer',
                    'lab-scientist': 'Lab Scientist',
                };
                return (
                    <div className="wrapped-special-content">
                        <p className="wrapped-title">🧬 {slide.title}</p>
                        <div className="dna-strands">
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="dna-strand dna-code"
                            >
                                <span className="strand-label">Code Strand</span>
                                <div className="strand-bar" style={{ width: `${100 - stats.developerDNA.labRatio}%` }} />
                                <span className="strand-percent">{100 - stats.developerDNA.labRatio}%</span>
                            </motion.div>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="dna-strand dna-lab"
                            >
                                <span className="strand-label">🔬 Lab Strand</span>
                                <div className="strand-bar lab" style={{ width: `${stats.developerDNA.labRatio}%` }} />
                                <span className="strand-percent">{stats.developerDNA.labRatio}%</span>
                            </motion.div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="dna-archetype"
                        >
                            {stats.developerDNA.notebookRepoCount} notebooks — You're a {archetypeLabels[stats.developerDNA.labArchetype]}
                        </motion.p>
                    </div>
                );

            case 'archetype':
                return (
                    <div className="wrapped-special-content archetype-slide">
                        <p className="wrapped-title">{slide.title}</p>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="archetype-value"
                        >
                            {stats.superpowers.archetype}
                        </motion.div>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="archetype-name"
                        >
                            {stats.user.name || stats.user.login}
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="archetype-cta"
                        >
                            {stats.experienceProfile.closingMessage}
                        </motion.p>
                        {stats.experienceProfile.contextualMessage && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="archetype-context"
                            >
                                {stats.experienceProfile.contextualMessage}
                            </motion.p>
                        )}
                    </div>
                );

            default:
                return (
                    <>
                        <p className="wrapped-title">{slide.title}</p>
                        <div className="wrapped-value">{slide.value}</div>
                        <p className="wrapped-label">{slide.label}</p>
                        {slide.detail && (
                            <p className="wrapped-detail">{slide.detail}</p>
                        )}
                    </>
                );
        }
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
                    {renderSlideContent()}
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
