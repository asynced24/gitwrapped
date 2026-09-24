import type { ExperienceProfile, ExperienceTier, LanguageStats } from "@/types/github";

const FRONTEND = new Set(["JavaScript", "TypeScript", "Vue", "Svelte", "Astro", "Elm"]);
const BACKEND = new Set(["Python", "Go", "Rust", "Java", "C#", "Ruby", "PHP", "Elixir", "Scala", "Kotlin"]);
const SYSTEMS = new Set(["Rust", "C", "C++", "Go", "Zig", "Assembly"]);
const DATA = new Set(["Python", "R", "Julia"]);
const MOBILE = new Set(["Swift", "Kotlin", "Dart", "Objective-C"]);

/** One-line focus label from the top two programming languages. */
export function describeFocus(programming: LanguageStats[], hasNotebooks: boolean): string {
    const [first, second] = programming.map(l => l.language);
    if (!first) return "Developer";

    if (FRONTEND.has(first) && second && BACKEND.has(second)) {
        return hasNotebooks ? "Full-stack engineer with ML experimentation" : "Full-stack engineer";
    }
    if (DATA.has(first) && hasNotebooks) {
        return second && BACKEND.has(second) && second !== first
            ? "ML engineer with production systems experience"
            : "ML & data science focused";
    }
    if (MOBILE.has(first)) return "Mobile developer";
    if (SYSTEMS.has(first)) return "Systems programmer";
    if (FRONTEND.has(first)) return "Frontend-focused developer";
    if (BACKEND.has(first)) return hasNotebooks ? "Backend & ML-focused systems builder" : "Backend engineer";
    return `${first} developer`;
}

const CLOSING: Record<ExperienceTier, string> = {
    pioneer: "You walked so others could run.",
    veteran: "Your journey is a roadmap for others.",
    established: "You've built a foundation worth building on.",
    rising: "Every repository is a step forward.",
    newcomer: "The first commit is always the hardest. You did it.",
};

export function describeExperience(input: {
    years: number;
    repoCount: number;
    stars: number;
    languageCount: number;
    activeWeeks: number;
    totalWeeks: number;
}): ExperienceProfile {
    const { years, repoCount, stars, languageCount, activeWeeks, totalWeeks } = input;

    let tier: ExperienceTier = "newcomer";
    if (years >= 8 && repoCount >= 30) tier = "pioneer";
    else if (years >= 5 && repoCount >= 20) tier = "veteran";
    else if (years >= 3 && repoCount >= 10) tier = "established";
    else if (years >= 1 && repoCount >= 3) tier = "rising";

    const weekShare = totalWeeks > 0 ? activeWeeks / totalWeeks : 0;
    let contextualMessage: string | null = null;
    if (stars >= 1000) contextualMessage = "Your work resonates with developers worldwide.";
    else if (stars >= 100) contextualMessage = "Your code has found its audience.";
    else if (weekShare >= 0.75) contextualMessage = `You showed up ${activeWeeks} of the last ${totalWeeks} weeks.`;
    else if (languageCount >= 8) contextualMessage = "Languages change. Your curiosity doesn't.";
    else if (activeWeeks === 0 && years >= 2) contextualMessage = "Welcome back. The code missed you.";
    else if (activeWeeks > 0) contextualMessage = "Still shipping. Still growing.";

    return { tier, closingMessage: CLOSING[tier], contextualMessage };
}
