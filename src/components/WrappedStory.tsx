"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserStats } from "@/types/github";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

interface WrappedStoryProps {
    stats: UserStats;
}

interface Slide {
    id: string;
    type: string;
}

export function WrappedStory({ stats }: WrappedStoryProps) {
    const { setMode } = useViewMode();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Build slides - only use defensible, data-backed content
    const slides: Slide[] = buildSlides(stats);

    const goNext = useCallback(() => {
        if (currentIndex < slides.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, slides.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const handleClose = () => {
        setMode("dashboard");
    };

    const currentSlide = slides[currentIndex];

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    return (
        <div className="wrapped-container">
            {/* Controls */}
            <div className="wrapped-controls">
                <button onClick={handleClose} className="wrapped-close" aria-label="Close">
                    <X size={20} />
                </button>
                <div className="wrapped-progress">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`wrapped-progress-dot ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'done' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {/* Slide content */}
            <div className="wrapped-stage">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentSlide.id}
                        className="wrapped-slide"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {renderSlide(currentSlide, stats)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="wrapped-nav">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="wrapped-nav-btn"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="wrapped-counter">
                    {currentIndex + 1} / {slides.length}
                </span>
                <button
                    onClick={goNext}
                    disabled={currentIndex === slides.length - 1}
                    className="wrapped-nav-btn"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}

/**
 * Build the slide deck - only from defensible data
 */
function buildSlides(stats: UserStats): Slide[] {
    const slides: Slide[] = [
        { id: "intro", type: "intro" },
        { id: "identity", type: "identity" },
        { id: "activity", type: "activity" },
        { id: "languages", type: "languages" },
    ];

    // Only show archaeology if there are multiple eras
    if (stats.languageEras.length >= 2) {
        slides.push({ id: "archaeology", type: "archaeology" });
    }

    // Only show DevOps if any signals found
    if (stats.devOpsMaturity.signals.some(s => s.found)) {
        slides.push({ id: "devops", type: "devops" });
    }

    // Only show DNA if there's lab work
    if (stats.developerDNA.labRatio > 0) {
        slides.push({ id: "dna", type: "dna" });
    }

    // Projects highlight
    if (stats.mostStarredRepo) {
        slides.push({ id: "project", type: "project" });
    }

    // Closing slide
    slides.push({ id: "closing", type: "closing" });

    return slides;
}

/**
 * Render individual slide content
 */
function renderSlide(slide: Slide, stats: UserStats) {
    switch (slide.type) {
        case "intro":
            return (
                <div className="slide-content slide-intro">
                    <motion.p
                        className="slide-eyebrow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        @{stats.user.login}
                    </motion.p>
                    <motion.h1
                        className="slide-headline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Your Developer Story
                    </motion.h1>
                    <motion.p
                        className="slide-subtext"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {stats.accountAgeYears} years on GitHub •{" "}
                        {stats.ownRepoCount} repositories •{" "}
                        {stats.languageStats.filter(l => !l.isMarkup).length} languages
                    </motion.p>
                </div>
            );

        case "identity":
            return (
                <div className="slide-content slide-identity">
                    <p className="slide-eyebrow">Identity Snapshot</p>
                    <div className="slide-avatar-row">
                        <img
                            src={stats.user.avatar_url}
                            alt={stats.user.login}
                            className="slide-avatar"
                        />
                        <div>
                            <h2 className="slide-name">{stats.user.name || stats.user.login}</h2>
                            <p className="slide-username">@{stats.user.login}</p>
                        </div>
                    </div>
                    {stats.user.bio && (
                        <p className="slide-bio">{stats.user.bio}</p>
                    )}
                    <div className="slide-stats-row">
                        <div className="slide-stat">
                            <span className="slide-stat-value">{stats.accountAgeYears}</span>
                            <span className="slide-stat-label">years</span>
                        </div>
                        <div className="slide-stat">
                            <span className="slide-stat-value">{stats.ownRepoCount}</span>
                            <span className="slide-stat-label">repos</span>
                        </div>
                        {stats.totalStars >= 10 && (
                            <div className="slide-stat">
                                <span className="slide-stat-value">{stats.totalStars.toLocaleString()}</span>
                                <span className="slide-stat-label">stars</span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "activity":
            return (
                <div className="slide-content slide-activity">
                    <p className="slide-eyebrow">Activity & Growth</p>
                    <h2 className="slide-headline">
                        {stats.contributionConsistency.pattern === "consistent"
                            ? "Consistent builder"
                            : stats.contributionConsistency.pattern === "burst"
                                ? "Burst creator"
                                : "Evolving coder"}
                    </h2>
                    <div className="slide-stats-row">
                        <div className="slide-stat">
                            <span className="slide-stat-value">{stats.contributionConsistency.activeMonths}</span>
                            <span className="slide-stat-label">active months</span>
                        </div>
                        <div className="slide-stat">
                            <span className="slide-stat-value">{stats.mostActiveYear || "-"}</span>
                            <span className="slide-stat-label">peak year</span>
                        </div>
                        {stats.recentlyActive && (
                            <div className="slide-stat">
                                <span className="slide-stat-value">✓</span>
                                <span className="slide-stat-label">active now</span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "languages":
            const topLangs = stats.languageStats
                .filter(l => !l.isMarkup)
                .slice(0, 5);

            return (
                <div className="slide-content slide-languages">
                    <p className="slide-eyebrow">Stack & Focus</p>
                    <h2 className="slide-headline">
                        {stats.topLanguage
                            ? `${stats.topLanguage} is your primary language`
                            : "Your language journey"}
                    </h2>
                    <div className="slide-lang-list">
                        {topLangs.map((lang, i) => (
                            <motion.div
                                key={lang.language}
                                className="slide-lang-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                            >
                                <span className="slide-lang-rank">#{i + 1}</span>
                                <span
                                    className="slide-lang-dot"
                                    style={{ backgroundColor: lang.color }}
                                />
                                <span className="slide-lang-name">{lang.language}</span>
                                <span className="slide-lang-pct">{lang.percentage}%</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );

        case "archaeology":
            return (
                <div className="slide-content slide-archaeology">
                    <p className="slide-eyebrow">Language Archaeology</p>
                    <h2 className="slide-headline">How your stack evolved</h2>
                    <div className="slide-era-timeline">
                        {stats.languageEras.map((era, i) => (
                            <motion.div
                                key={era.year}
                                className="slide-era"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 * i }}
                            >
                                <span className="slide-era-year">{era.year}</span>
                                <span
                                    className="slide-era-dot"
                                    style={{ backgroundColor: era.languageColor }}
                                />
                                <span className="slide-era-lang">{era.dominantLanguage}</span>
                                <span className="slide-era-count">{era.repoCount} repos</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );

        case "devops":
            const foundSignals = stats.devOpsMaturity.signals.filter(s => s.found);
            return (
                <div className="slide-content slide-devops">
                    <p className="slide-eyebrow">DevOps</p>
                    <h2 className="slide-headline">Your infrastructure toolkit</h2>
                    <div className="slide-signal-grid">
                        {foundSignals.map((signal, i) => (
                            <motion.div
                                key={signal.type}
                                className="slide-signal"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 * i }}
                            >
                                <span className="slide-signal-icon">{signal.icon}</span>
                                <span className="slide-signal-label">{signal.label}</span>
                                <span className="slide-signal-count">
                                    {signal.repoCount} {signal.repoCount === 1 ? "repo" : "repos"}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );

        case "dna":
            return (
                <div className="slide-content slide-dna">
                    <p className="slide-eyebrow">Notebook Signal</p>
                    <h2 className="slide-headline">How often you explore in notebooks</h2>
                    <div className="slide-dna-visual">
                        <div className="slide-dna-bar">
                            <motion.div
                                className="slide-dna-lab"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.developerDNA.labRatio}%` }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                            />
                        </div>
                        <div className="slide-dna-labels">
                            <span>{stats.developerDNA.notebookRepoCount} notebook repos</span>
                            <span>{stats.developerDNA.labRatio}% of repositories</span>
                        </div>
                    </div>
                </div>
            );

        case "project":
            const repo = stats.mostStarredRepo!;
            return (
                <div className="slide-content slide-project">
                    <p className="slide-eyebrow">Spotlight</p>
                    <h2 className="slide-headline">{repo.name}</h2>
                    {repo.description && (
                        <p className="slide-subtext">{repo.description}</p>
                    )}
                    <div className="slide-stats-row">
                        {repo.stargazers_count > 0 && (
                            <div className="slide-stat">
                                <span className="slide-stat-value">★ {repo.stargazers_count}</span>
                                <span className="slide-stat-label">stars</span>
                            </div>
                        )}
                        {repo.language && (
                            <div className="slide-stat">
                                <span className="slide-stat-value">{repo.language}</span>
                                <span className="slide-stat-label">language</span>
                            </div>
                        )}
                        {repo.forks_count > 0 && (
                            <div className="slide-stat">
                                <span className="slide-stat-value">{repo.forks_count}</span>
                                <span className="slide-stat-label">forks</span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "closing":
            return (
                <div className="slide-content slide-closing">
                    <motion.p
                        className="slide-eyebrow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {stats.experienceProfile.tier}
                    </motion.p>
                    <motion.h2
                        className="slide-headline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {stats.experienceProfile.closingMessage}
                    </motion.h2>
                    {stats.experienceProfile.contextualMessage && (
                        <motion.p
                            className="slide-subtext"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {stats.experienceProfile.contextualMessage}
                        </motion.p>
                    )}
                    <motion.div
                        className="slide-branding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <span>GitWrapped</span>
                    </motion.div>
                </div>
            );

        default:
            return null;
    }
}
