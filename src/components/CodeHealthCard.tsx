"use client";

import { CodeHealth } from "@/types/github";
import { motion } from "framer-motion";

interface CodeHealthCardProps {
    health: CodeHealth;
}

const TIER_CONFIG = {
    'needs-work': { label: 'Needs Work', color: '#ef4444', emoji: '🔧' },
    'getting-there': { label: 'Getting There', color: '#f59e0b', emoji: '📈' },
    'solid': { label: 'Solid', color: '#10b981', emoji: '✅' },
    'excellent': { label: 'Excellent', color: '#06b6d4', emoji: '🌟' },
};

const STRATEGY_LABELS = {
    'single-branch': 'Single Branch',
    'basic-branching': 'Basic Branching',
    'feature-branches': 'Feature Branches',
    'gitflow': 'GitFlow',
};

const README_LABELS = {
    'none': 'Missing',
    'minimal': 'Minimal',
    'good': 'Good',
    'excellent': 'Excellent',
};

export function CodeHealthCard({ health }: CodeHealthCardProps) {
    const tier = TIER_CONFIG[health.tier];

    return (
        <div className="code-health-card card">
            <div className="code-health-header">
                <h3 className="code-health-title">📊 Code Health</h3>
                <div className="code-health-score" style={{ '--score-color': tier.color } as React.CSSProperties}>
                    <span className="score-value">{health.overallScore}</span>
                    <span className="score-max">/100</span>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="code-health-progress-container">
                <motion.div
                    className="code-health-progress"
                    initial={{ width: 0 }}
                    animate={{ width: `${health.overallScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: tier.color }}
                />
            </div>

            <div className="code-health-tier">
                <span className="tier-emoji">{tier.emoji}</span>
                <span className="tier-label">{tier.label}</span>
            </div>

            {/* Category Breakdown */}
            <div className="code-health-categories">
                {/* Documentation */}
                <CategoryRow
                    icon="📖"
                    label="Documentation"
                    score={health.documentation.score}
                    detail={`${README_LABELS[health.documentation.readmeQuality]} READMEs${health.documentation.hasLicense ? ' • Licensed' : ''}`}
                />

                {/* Branching */}
                <CategoryRow
                    icon="🌿"
                    label="Branching"
                    score={health.branching.score}
                    detail={`${STRATEGY_LABELS[health.branching.strategy]} • ${health.branching.avgBranchesPerRepo} avg`}
                />

                {/* Deployment */}
                <CategoryRow
                    icon="🚀"
                    label="Deployment"
                    score={health.deployment.score}
                    detail={health.deployment.platforms.length > 0
                        ? health.deployment.platforms.map(p => `${p.icon} ${p.name}`).join(' ')
                        : 'No deployment detected'
                    }
                />

                {/* Organization */}
                <CategoryRow
                    icon="📁"
                    label="Organization"
                    score={health.organization.score}
                    detail={[
                        health.organization.hasSrcFolder && 'src/',
                        health.organization.hasGitignore && '.gitignore',
                        health.organization.hasPackageManager && 'pkg manager',
                    ].filter(Boolean).join(' • ') || 'Basic structure'}
                />

                {/* Testing */}
                <CategoryRow
                    icon="🧪"
                    label="Testing"
                    score={health.testing.score}
                    detail={health.testing.hasTestFiles
                        ? `${health.testing.reposWithTests} repos with tests`
                        : 'No tests detected'
                    }
                />

                {/* DevOps */}
                <CategoryRow
                    icon="🔧"
                    label="DevOps"
                    score={health.devOps.score}
                    detail={health.devOps.signals
                        .filter(s => s.found)
                        .slice(0, 3)
                        .map(s => s.label)
                        .join(' • ') || 'Basic setup'
                    }
                />
            </div>
        </div>
    );
}

interface CategoryRowProps {
    icon: string;
    label: string;
    score: number;
    detail: string;
}

function CategoryRow({ icon, label, score, detail }: CategoryRowProps) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return '#06b6d4';
        if (s >= 60) return '#10b981';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="category-row">
            <div className="category-left">
                <span className="category-icon">{icon}</span>
                <span className="category-label">{label}</span>
            </div>
            <div className="category-right">
                <div className="category-bar-container">
                    <motion.div
                        className="category-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ background: getScoreColor(score) }}
                    />
                </div>
                <span className="category-score" style={{ color: getScoreColor(score) }}>
                    {score}
                </span>
            </div>
            <p className="category-detail">{detail}</p>
        </div>
    );
}
