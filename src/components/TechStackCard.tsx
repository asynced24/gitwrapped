"use client";

import { UserStats } from "@/types/github";
import { motion } from "framer-motion";

interface TechStackCardProps {
    stats: UserStats;
}

// Technology detection patterns based on what we can find in repo files
const TECH_CATEGORIES = {
    frontend: {
        label: "Frontend",
        icon: "🎨",
        techs: [
            { name: "React", signals: ["react", "jsx", "tsx"], color: "#61DAFB" },
            { name: "Vue", signals: ["vue"], color: "#4FC08D" },
            { name: "Next.js", signals: ["next"], color: "#000000" },
            { name: "Tailwind", signals: ["tailwind"], color: "#06B6D4" },
            { name: "TypeScript", signals: ["typescript"], color: "#3178C6" },
        ],
    },
    backend: {
        label: "Backend",
        icon: "⚙️",
        techs: [
            { name: "Node.js", signals: ["node", "express"], color: "#339933" },
            { name: "Python", signals: ["python", "flask", "django", "fastapi"], color: "#3776AB" },
            { name: "Java", signals: ["java", "spring"], color: "#007396" },
            { name: "Go", signals: ["go"], color: "#00ADD8" },
            { name: "Rust", signals: ["rust", "cargo"], color: "#DEA584" },
        ],
    },
    data: {
        label: "Data & ML",
        icon: "📊",
        techs: [
            { name: "Jupyter", signals: ["jupyter notebook"], color: "#F37626" },
            { name: "Pandas", signals: ["pandas"], color: "#150458" },
            { name: "TensorFlow", signals: ["tensorflow"], color: "#FF6F00" },
            { name: "PyTorch", signals: ["pytorch"], color: "#EE4C2C" },
        ],
    },
    infra: {
        label: "Infrastructure",
        icon: "☁️",
        techs: [
            { name: "Docker", signals: ["docker"], color: "#2496ED" },
            { name: "Kubernetes", signals: ["kubernetes", "k8s"], color: "#326CE5" },
            { name: "Terraform", signals: ["terraform", "hcl"], color: "#7B42BC" },
            { name: "AWS", signals: ["aws"], color: "#FF9900" },
            { name: "GitHub Actions", signals: ["actions"], color: "#2088FF" },
        ],
    },
};

export function TechStackCard({ stats }: TechStackCardProps) {
    // Detect technologies from language stats and DevOps signals
    const detectedTechs: { category: string; name: string; color: string }[] = [];

    // From language stats
    const languageNames = stats.languageStats.map(l => l.language.toLowerCase());

    // Check each category
    for (const [categoryKey, category] of Object.entries(TECH_CATEGORIES)) {
        for (const tech of category.techs) {
            const found = tech.signals.some(signal =>
                languageNames.some(lang => lang.includes(signal)) ||
                (stats.devOpsMaturity?.signals?.some(s => s.type.toLowerCase().includes(signal) && s.found))
            );
            if (found && !detectedTechs.some(t => t.name === tech.name)) {
                detectedTechs.push({
                    category: category.label,
                    name: tech.name,
                    color: tech.color,
                });
            }
        }
    }

    // Add from DevOps signals directly
    if (stats.devOpsMaturity?.hasDocker) {
        if (!detectedTechs.some(t => t.name === "Docker")) {
            detectedTechs.push({ category: "Infrastructure", name: "Docker", color: "#2496ED" });
        }
    }
    if (stats.devOpsMaturity?.hasGitHubActions) {
        if (!detectedTechs.some(t => t.name === "GitHub Actions")) {
            detectedTechs.push({ category: "Infrastructure", name: "GitHub Actions", color: "#2088FF" });
        }
    }
    if (stats.devOpsMaturity?.hasTerraform) {
        if (!detectedTechs.some(t => t.name === "Terraform")) {
            detectedTechs.push({ category: "Infrastructure", name: "Terraform", color: "#7B42BC" });
        }
    }
    if (stats.devOpsMaturity?.hasKubernetes) {
        if (!detectedTechs.some(t => t.name === "Kubernetes")) {
            detectedTechs.push({ category: "Infrastructure", name: "Kubernetes", color: "#326CE5" });
        }
    }

    // Add from Jupyter notebooks
    if (stats.developerDNA?.notebookRepoCount > 0) {
        if (!detectedTechs.some(t => t.name === "Jupyter")) {
            detectedTechs.push({ category: "Data & ML", name: "Jupyter", color: "#F37626" });
        }
    }

    // Add top languages as tech
    stats.languageStats.slice(0, 5).forEach(lang => {
        const langLower = lang.language.toLowerCase();
        if (langLower === "typescript" && !detectedTechs.some(t => t.name === "TypeScript")) {
            detectedTechs.push({ category: "Frontend", name: "TypeScript", color: "#3178C6" });
        }
        if (langLower === "python" && !detectedTechs.some(t => t.name === "Python")) {
            detectedTechs.push({ category: "Backend", name: "Python", color: "#3776AB" });
        }
        if (langLower === "java" && !detectedTechs.some(t => t.name === "Java")) {
            detectedTechs.push({ category: "Backend", name: "Java", color: "#007396" });
        }
        if (langLower === "go" && !detectedTechs.some(t => t.name === "Go")) {
            detectedTechs.push({ category: "Backend", name: "Go", color: "#00ADD8" });
        }
        if (langLower === "rust" && !detectedTechs.some(t => t.name === "Rust")) {
            detectedTechs.push({ category: "Backend", name: "Rust", color: "#DEA584" });
        }
        if ((langLower === "javascript" || langLower === "vue") && !detectedTechs.some(t => t.name === "Vue")) {
            // Check if they have Vue files
            if (stats.languageStats.some(l => l.language.toLowerCase() === "vue")) {
                detectedTechs.push({ category: "Frontend", name: "Vue", color: "#4FC08D" });
            }
        }
    });

    // Group by category for display
    const groupedTechs = detectedTechs.reduce((acc, tech) => {
        if (!acc[tech.category]) acc[tech.category] = [];
        acc[tech.category].push(tech);
        return acc;
    }, {} as Record<string, typeof detectedTechs>);

    if (detectedTechs.length === 0) {
        return null; // Don't show if nothing detected
    }

    return (
        <div className="tech-stack-card card">
            <h3 className="tech-stack-title">🛠️ Your Stack</h3>
            <p className="tech-stack-subtitle">Technologies detected in your repositories</p>

            <div className="tech-stack-grid">
                {Object.entries(groupedTechs).map(([category, techs], categoryIndex) => (
                    <div key={category} className="tech-category">
                        <span className="tech-category-label">{category}</span>
                        <div className="tech-badges">
                            {techs.map((tech, techIndex) => (
                                <motion.span
                                    key={tech.name}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: categoryIndex * 0.1 + techIndex * 0.05 }}
                                    className="tech-badge"
                                    style={{
                                        '--tech-color': tech.color,
                                        borderColor: tech.color,
                                    } as React.CSSProperties}
                                >
                                    {tech.name}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
