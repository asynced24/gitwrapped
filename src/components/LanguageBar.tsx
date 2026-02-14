"use client";

import { useState } from "react";
import { LanguageStats, LanguageStatsByRepo } from "@/types/github";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface LanguageBarProps {
    languagesByBytes: LanguageStats[];
    languagesByRepo: LanguageStatsByRepo[];
}

export function LanguageBar({ languagesByBytes, languagesByRepo }: LanguageBarProps) {
    const [mode, setMode] = useState<"bytes" | "repos">("bytes");
    const [expanded, setExpanded] = useState(false);

    const isByteMode = mode === "bytes";
    const topCount = 3;

    // Prepare display data based on mode
    const allItems = isByteMode
        ? languagesByBytes.map(l => ({
            language: l.language,
            value: l.percentage,
            color: l.color,
            label: `${l.percentage}%`,
        }))
        : languagesByRepo.map(l => ({
            language: l.language,
            value: l.percentage,
            color: l.color,
            label: `${l.repoCount} ${l.repoCount === 1 ? "repo" : "repos"}`,
        }));

    const topItems = allItems.slice(0, topCount);
    const restItems = allItems.slice(topCount);
    const displayItems = expanded ? allItems : topItems;

    return (
        <div>
            {/* Toggle */}
            <div className="language-toggle">
                <button
                    className="language-toggle-btn"
                    data-active={mode === "bytes"}
                    onClick={() => setMode("bytes")}
                >
                    By Code Volume
                </button>
                <button
                    className="language-toggle-btn"
                    data-active={mode === "repos"}
                    onClick={() => setMode("repos")}
                >
                    By Repository Distribution
                </button>
            </div>

            {/* Helper note for Code Volume */}
            {isByteMode && (
                <p className="text-muted language-note" style={{ fontSize: "11px", marginTop: "4px", marginBottom: "8px" }}>
                    Based on weighted byte size.
                </p>
            )}

            {/* Bar */}
            <div className="language-bar">
                {(isByteMode ? languagesByBytes.slice(0, 8) : languagesByRepo.slice(0, 8)).map((lang) => (
                    <div
                        key={lang.language}
                        className="language-bar-segment"
                        style={{
                            width: `${lang.percentage}%`,
                            backgroundColor: lang.color,
                        }}
                        title={`${lang.language}: ${lang.percentage}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="language-legend">
                {displayItems.map((item) => (
                    <span key={item.language} className="language-legend-item">
                        <span className="language-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.language}</span>
                        <span className="text-muted">{item.label}</span>
                    </span>
                ))}
            </div>

            {/* Expand/collapse */}
            {restItems.length > 0 && (
                <button
                    className="language-expand-btn"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={14} />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} />
                            Show all {allItems.length} languages
                        </>
                    )}
                </button>
            )}

            {/* Transparency note with tooltip */}
            <div className="language-transparency">
                <p className="text-muted language-note">
                    <Info size={12} className="language-info-icon" />
                    Language stats are calculated from {isByteMode ? "byte counts across" : "primary language of"} your repositories.
                </p>
                <div className="language-tooltip">
                    Language percentages are based on GitHub byte metrics. Jupyter Notebook files are weighted at 0.1x and credited to Python to reduce distortion from markdown and output cells.
                </div>
            </div>
        </div>
    );
}
