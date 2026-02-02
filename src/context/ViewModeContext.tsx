"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ViewMode = "dashboard" | "wrapped";

interface ViewModeContextType {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    toggleMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ViewMode>("dashboard");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", mode);
    }, [mode]);

    const toggleMode = () => {
        setMode((prev) => (prev === "dashboard" ? "wrapped" : "dashboard"));
    };

    return (
        <ViewModeContext.Provider value={{ mode, setMode, toggleMode }}>
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
