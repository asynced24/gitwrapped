"use client";

import { useViewMode } from "@/context/ViewModeContext";
import { BarChart3, Sparkles } from "lucide-react";

export function ModeToggle() {
    const { mode, setMode } = useViewMode();

    return (
        <div className="view-toggle">
            <button
                onClick={() => setMode("dashboard")}
                className="view-toggle-btn"
                data-active={mode === "dashboard"}
            >
                <BarChart3 size={16} />
                <span>Dashboard</span>
            </button>
            <button
                onClick={() => setMode("wrapped")}
                className="view-toggle-btn"
                data-active={mode === "wrapped"}
            >
                <Sparkles size={16} />
                <span>Wrapped</span>
            </button>
        </div>
    );
}
