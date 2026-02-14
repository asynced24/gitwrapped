"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ViewMode = "dashboard" | "wrapped";
export type Theme = "monochrome" | "dark-minimal" | "light-clean";

interface ViewModeContextType {
    mode: ViewMode;
    theme: Theme;
    setMode: (mode: ViewMode) => void;
    setTheme: (theme: Theme) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ViewMode>("dashboard");
    const [theme, setTheme] = useState<Theme>("monochrome");

    useEffect(() => {
        // Wrapped mode always stays dark
        if (mode === "wrapped") {
            document.documentElement.setAttribute("data-theme", "wrapped");
        } else {
            document.documentElement.setAttribute("data-theme", theme);
        }
    }, [mode, theme]);

    return (
        <ViewModeContext.Provider value={{ mode, theme, setMode, setTheme }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error("useViewMode must be used within a ViewModeProvider");
    }
    return context;
}
