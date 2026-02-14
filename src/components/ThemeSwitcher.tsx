"use client";

import { useViewMode, Theme } from "@/context/ViewModeContext";
import { Palette } from "lucide-react";

const THEMES: { id: Theme; label: string; icon: string }[] = [
    { id: "monochrome", label: "Monochrome", icon: "◻" },
    { id: "dark-minimal", label: "Dark", icon: "◼" },
    { id: "light-clean", label: "Light", icon: "○" },
];

export function ThemeSwitcher() {
    const { theme, setTheme, mode } = useViewMode();

    // Don't show theme switcher in wrapped mode
    if (mode === "wrapped") return null;

    return (
        <div className="theme-switcher">
            <Palette size={14} className="text-muted" />
            {THEMES.map((t) => (
                <button
                    key={t.id}
                    className="theme-switch-btn"
                    data-active={theme === t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                >
                    <span className="theme-switch-icon">{t.icon}</span>
                    <span className="theme-switch-label">{t.label}</span>
                </button>
            ))}
        </div>
    );
}
