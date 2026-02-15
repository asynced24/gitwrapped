"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { PokemonCardData, getLanguageTheme } from "@/lib/card";

interface PokemonCardProps {
    data: PokemonCardData;
    className?: string;
}

/* ─────────────────────────────────────────────
   Language color dot for energy cost
   ───────────────────────────────────────────── */
function EnergyDot({ language }: { language: string }) {
    const theme = getLanguageTheme(language);
    return (
        <span
            className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white/50 shrink-0"
            style={{
                background: `radial-gradient(circle at 35% 35%, ${theme.accentColor}, ${theme.borderColor})`,
                boxShadow: `0 0 4px ${theme.borderColor}40`,
            }}
        />
    );
}

/* ─────────────────────────────────────────────
   Retreat cost bug icons
   ───────────────────────────────────────────── */
function RetreatDots({ count }: { count: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                <span key={i} className="text-[11px]">🐛</span>
            ))}
        </span>
    );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export function PokemonCard({ data, className = "" }: PokemonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Motion values for smooth 3D tilt
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
    const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

    // Holo position
    const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });

    const theme = getLanguageTheme(data.topLanguage);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        rotateX.set((y - 0.5) * -20);
        rotateY.set((x - 0.5) * 20);
        setHoloPos({ x: x * 100, y: y * 100 });
    }, [rotateX, rotateY]);

    const handleMouseLeave = useCallback(() => {
        rotateX.set(0);
        rotateY.set(0);
        setIsHovering(false);
    }, [rotateX, rotateY]);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    return (
        <div className={`perspective-[1200px] ${className}`}>
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                animate={{
                    y: isHovering ? 0 : [0, -4, 0],
                    scale: isHovering ? 1.02 : 1,
                }}
                transition={{
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.3, ease: "easeOut" },
                }}
                className="relative w-[350px] h-[490px] rounded-[16px] cursor-pointer select-none"
                style={{
                    rotateX: springX,
                    rotateY: springY,
                    transformStyle: "preserve-3d",
                    boxShadow: `
                        0 4px 12px rgba(0,0,0,0.1),
                        0 8px 32px rgba(0,0,0,0.12),
                        0 0 48px ${theme.borderColor}20
                    `,
                }}
            >
                {/* === OUTER BORDER (language-colored) === */}
                <div
                    className="absolute inset-0 rounded-[16px]"
                    style={{ background: theme.borderColor }}
                />

                {/* === INNER ACCENT STROKE === */}
                <div
                    className="absolute rounded-[12px]"
                    style={{
                        inset: "6px",
                        border: "2px solid",
                        borderImage: `linear-gradient(135deg, #D4A853, #F0D68A, #D4A853) 1`,
                    }}
                />

                {/* === CARD BODY === */}
                <div
                    className="absolute rounded-[10px] flex flex-col overflow-hidden"
                    style={{
                        inset: "8px",
                        background: "#FFF8F0",
                    }}
                >
                    {/* ── HEADER ── */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            {/* Evolution badge */}
                            <span
                                className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                    background: data.evolutionStage === "STAGE 2" ? "#FFD700" :
                                                data.evolutionStage === "STAGE 1" ? "#C0C0C0" : "#CD7F32",
                                    color: "#1a1a2e",
                                }}
                            >
                                {data.evolutionStage}
                            </span>
                            <span className="text-[15px] font-extrabold text-[#1a1a2e] truncate leading-tight" style={{ fontFamily: "'Mona Sans', sans-serif" }}>
                                {data.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-semibold text-[#6b7280]">HP</span>
                            <span className="text-[20px] font-black text-[#1a1a2e] leading-none" style={{ fontFamily: "'Mona Sans', sans-serif" }}>
                                {data.totalStars}
                            </span>
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                                style={{
                                    background: `${theme.borderColor}18`,
                                    color: theme.borderColor,
                                    border: `1px solid ${theme.borderColor}30`,
                                }}
                            >
                                {theme.emoji} {theme.type}
                            </span>
                        </div>
                    </div>

                    {/* ── ARTWORK FRAME ── */}
                    <div className="flex justify-center py-2 px-4">
                        <div
                            className="relative w-full rounded-lg overflow-hidden"
                            style={{
                                height: "140px",
                                background: `linear-gradient(145deg, ${theme.borderColor}12, ${theme.accentColor}08)`,
                                border: `2px solid ${theme.borderColor}25`,
                            }}
                        >
                            {/* Pattern lines */}
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 8px,
                                        ${theme.borderColor} 8px,
                                        ${theme.borderColor} 9px
                                    )`,
                                }}
                            />
                            {/* Avatar */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="w-[100px] h-[100px] rounded-full overflow-hidden"
                                    style={{
                                        border: `3px solid ${theme.borderColor}40`,
                                        boxShadow: `0 0 0 2px #FFF8F0, 0 4px 16px rgba(0,0,0,0.12), inset 0 2px 4px rgba(0,0,0,0.06)`,
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={data.avatarUrl}
                                        alt={data.username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FLAVOR BAR ── */}
                    <div className="text-center px-4 pb-1">
                        <p className="text-[9.5px] text-[#9ca3af] tracking-wide font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            @{data.username} · {data.location} · Since {new Date().getFullYear() - data.accountAgeYears}
                        </p>
                    </div>

                    {/* ── DIVIDER ── */}
                    <div className="mx-4 my-1" style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${theme.borderColor}30, transparent)` }} />

                    {/* ── ATTACKS ── */}
                    <div className="flex-1 px-4 flex flex-col justify-center gap-2.5">
                        {data.topRepos.map((repo, i) => (
                            <div key={i}>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                        <EnergyDot language={repo.language} />
                                        {i === 1 && <EnergyDot language={data.topLanguage} />}
                                    </div>
                                    <span className="flex-1 text-[13px] font-bold text-[#1a1a2e] truncate" style={{ fontFamily: "'Mona Sans', sans-serif" }}>
                                        {repo.name.toUpperCase().replace(/-/g, " ")}
                                    </span>
                                    <span className="text-[18px] font-black text-[#1a1a2e] tabular-nums" style={{ fontFamily: "'Mona Sans', sans-serif" }}>
                                        {repo.stars > 0 ? repo.stars * 10 : 20}
                                    </span>
                                </div>
                                <p className="text-[9px] text-[#6b7280] mt-0.5 ml-7 leading-relaxed">
                                    {repo.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── DIVIDER ── */}
                    <div className="mx-4 mt-1" style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${theme.borderColor}30, transparent)` }} />

                    {/* ── WEAKNESS / RESISTANCE / RETREAT ── */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-semibold text-[#9ca3af] uppercase tracking-wider">weakness</span>
                            <span
                                className="text-[10px] font-bold px-1 py-0.5 rounded"
                                style={{ background: `${getLanguageTheme(data.leastUsedLanguage).borderColor}15`, color: getLanguageTheme(data.leastUsedLanguage).borderColor }}
                            >
                                {getLanguageTheme(data.leastUsedLanguage).emoji} ×2
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-semibold text-[#9ca3af] uppercase tracking-wider">resistance</span>
                            <span
                                className="text-[10px] font-bold px-1 py-0.5 rounded"
                                style={{ background: `${theme.borderColor}15`, color: theme.borderColor }}
                            >
                                {theme.emoji} -30
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-semibold text-[#9ca3af] uppercase tracking-wider">retreat</span>
                            <RetreatDots count={data.zeroStarRepoCount} />
                        </div>
                    </div>

                    {/* ── POKÉDEX FLAVOR TEXT ── */}
                    <div
                        className="mx-3 mb-3 px-3 py-2 rounded-md"
                        style={{
                            background: `linear-gradient(135deg, ${theme.borderColor}06, ${theme.accentColor}04)`,
                            border: `1px solid ${theme.borderColor}12`,
                        }}
                    >
                        <p className="text-[8.5px] text-[#6b7280] italic leading-relaxed text-center">
                            Pokédex: {data.bio}
                        </p>
                    </div>
                </div>

                {/* === HOLOGRAPHIC SHIMMER OVERLAY === */}
                <div
                    className="absolute inset-0 rounded-[16px] pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: isHovering ? 0.35 : 0.08,
                        background: `
                            conic-gradient(
                                from ${holoPos.x * 3.6}deg at ${holoPos.x}% ${holoPos.y}%,
                                #ff000015, #ff880015, #ffff0015, #00ff0015,
                                #0088ff15, #8800ff15, #ff00ff15, #ff000015
                            )
                        `,
                        mixBlendMode: "overlay",
                    }}
                />

                {/* === LIGHT REFLECTION === */}
                <div
                    className="absolute inset-0 rounded-[16px] pointer-events-none transition-opacity duration-500"
                    style={{
                        opacity: isHovering ? 0.25 : 0,
                        background: `radial-gradient(
                            circle at ${holoPos.x}% ${holoPos.y}%,
                            rgba(255,255,255,0.4) 0%,
                            transparent 50%
                        )`,
                    }}
                />
            </motion.div>
        </div>
    );
}
