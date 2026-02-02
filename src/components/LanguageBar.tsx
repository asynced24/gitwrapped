"use client";

import { LanguageStats } from "@/types/github";

interface LanguageBarProps {
    languages: LanguageStats[];
}

export function LanguageBar({ languages }: LanguageBarProps) {
    // Show top 8 languages, group the rest as "Other"
    const topLanguages = languages.slice(0, 8);

    return (
        <div>
            <div className="language-bar">
                {topLanguages.map((lang) => (
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
            <div className="language-legend">
                {topLanguages.map((lang) => (
                    <span key={lang.language} className="language-legend-item">
                        <span className="language-dot" style={{ backgroundColor: lang.color }} />
                        <span>{lang.language}</span>
                        <span className="text-muted">{lang.percentage}%</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
