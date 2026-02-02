"use client";

import { LayoutDashboard, Sparkles } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

export function ModeToggle() {
    const { mode, setMode } = useViewMode();

    return (
        <div className="mode-toggle">
            <button
                className="mode-toggle-option"
                data-active={mode === "dashboard"}
                onClick={() => setMode("dashboard")}
                aria-label="Switch to Dashboard view"
            >
                <LayoutDashboard size={14} className="inline mr-1.5" />
                Dashboard
            </button>
            <button
                className="mode-toggle-option"
                data-active={mode === "wrapped"}
                onClick={() => setMode("wrapped")}
                aria-label="Switch to Wrapped view"
            >
                <Sparkles size={14} className="inline mr-1.5" />
                Wrapped
            </button>
        </div>
    );
}
