"use client";

import { useViewMode } from "@/context/ViewModeContext";
import { LayoutDashboard, Sparkles } from "lucide-react";

export function ModeToggle() {
    const { mode, setMode } = useViewMode();

    return (
        <div className="mode-toggle">
            <button
                className="mode-toggle-btn"
                data-active={mode === "dashboard"}
                onClick={() => setMode("dashboard")}
                aria-label="Switch to Dashboard view"
            >
                <LayoutDashboard size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Dashboard
            </button>
            <button
                className="mode-toggle-btn"
                data-active={mode === "wrapped"}
                onClick={() => setMode("wrapped")}
                aria-label="Switch to Wrapped view"
            >
                <Sparkles size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Wrapped
            </button>
        </div>
    );
}
