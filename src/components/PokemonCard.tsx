"use client";

import { useRef, useState, useCallback, useEffect, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { PokemonCardData, getCardArtPath, getLanguageTheme } from "@/lib/card";

interface PokemonCardProps {
    data: PokemonCardData;
    className?: string;
    captureMode?: boolean;
}

/* ─────────────────────────────────────────────
   Energy Circle — type-colored gradient dot
   ───────────────────────────────────────────── */
function EnergyCircle({ type, size = "md" }: { type: string; size?: "md" | "sm" }) {
    const theme = getLanguageTheme(type);
    const dimensions = size === "sm" ? "w-[16px] h-[16px]" : "w-[18px] h-[18px]";
    return (
        <span
            className={`inline-flex items-center justify-center ${dimensions} rounded-full shrink-0`}
            style={{
                background: `radial-gradient(circle at 35% 35%, ${theme.accentColor}, ${theme.borderColor})`,
                boxShadow: `0 1px 3px rgba(0,0,0,0.25), inset 0 0.5px 1px rgba(255,255,255,0.5)`,
                border: `1px solid rgba(255,255,255,0.3)`,
            }}
        />
    );
}

/* ─────────────────────────────────────────────
   Main Component — Modern V Card
   ───────────────────────────────────────────── */
export function PokemonCard({ data, className = "", captureMode = false }: PokemonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 22 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 22 });

    const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });

    const theme = getLanguageTheme(data.topLanguage);
    const cardArtPath = getCardArtPath(data.topLanguage);
    const cleanText = (text: string) => text.replace(/[—–]/g, "-");
    const effectiveHoloPos = captureMode ? { x: 50, y: 50 } : holoPos;
    const showHoverEffects = !captureMode && isHovering;

    useEffect(() => {
        if (!captureMode) return;
        rotateX.set(0);
        rotateY.set(0);
    }, [captureMode, rotateX, rotateY]);

    const supportAttacks = [
        {
            name: "Velocity Pulse",
            description: `Maintains ${data.codeVelocity}% active repo momentum`,
            damage: Math.max(16, Math.min(90, Math.round(data.codeVelocity * 1.2))),
            energyCost: 1,
        },
        {
            name: "XP Burst",
            description: `Channels ${data.xp.toLocaleString()} XP into focused output`,
            damage: Math.max(24, Math.min(120, Math.round(data.xp / 120))),
            energyCost: 2,
        },
    ];

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (captureMode) return;
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            rotateX.set((y - 0.5) * -20);
            rotateY.set((x - 0.5) * 20);
            setHoloPos({ x: x * 100, y: y * 100 });
        },
        [captureMode, rotateX, rotateY]
    );

    const handleMouseLeave = useCallback(() => {
        if (captureMode) return;
        rotateX.set(0);
        rotateY.set(0);
        setIsHovering(false);
    }, [captureMode, rotateX, rotateY]);

    const handleMouseEnter = useCallback(() => {
        if (captureMode) return;
        setIsHovering(true);
    }, [captureMode]);

    return (
        <div className={`perspective-[1400px] ${className}`}>
            {/* ═══ GRADIENT BORDER FRAME ═══ */}
            <div
                className={`rounded-[20px] ${captureMode ? "" : "card-border-glow"}`}
                style={{
                    padding: "4px",
                    background: `linear-gradient(145deg, ${theme.borderColor}, ${theme.accentColor})`,
                    ["--glow-1" as string]: `${theme.borderColor}60`,
                    ["--glow-2" as string]: `${theme.accentColor}30`,
                    boxShadow: `
                        0 0 20px ${theme.borderColor}60,
                        0 0 60px ${theme.accentColor}30,
                        0 4px 16px rgba(0,0,0,0.3)
                    `,
                } as CSSProperties}
            >
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                animate={{
                    y: 0,
                    scale: showHoverEffects ? 1.01 : 1,
                }}
                transition={{
                    scale: { duration: 0.3, ease: "easeOut" },
                }}
                className={`relative w-[350px] h-[490px] rounded-[16px] select-none overflow-hidden ${captureMode ? "cursor-default" : "cursor-pointer"}`}
                style={{
                    rotateX: springX,
                    rotateY: springY,
                    transformStyle: "preserve-3d",
                    boxShadow: `
                        0 2px 4px rgba(0,0,0,0.12),
                        0 8px 16px rgba(0,0,0,0.16),
                        0 16px 48px rgba(0,0,0,0.20)
                    `,
                }}
            >
                {/* ═══ FULL-ART BACKGROUND ═══ */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${cardArtPath})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                />

                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(145deg, ${theme.borderColor}B8 0%, ${theme.accentColor}96 40%, ${theme.borderColor}B8 100%)`,
                    }}
                />

                {/* ═══ GEOMETRIC PATTERN OVERLAY ═══ */}
                <div
                    className="absolute inset-0 opacity-[0.14]"
                    style={{
                        backgroundImage: `
                            repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(255,255,255,0.25) 12px, rgba(255,255,255,0.25) 13px)
                        `,
                    }}
                />

                {/* ═══ RADIAL GLOW BEHIND AVATAR ═══ */}
                <div
                    className="absolute"
                    style={{
                        top: "120px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "240px",
                        height: "240px",
                        background: `radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)`,
                        filter: "blur(40px)",
                    }}
                />

                {/* ═══ SILVER BORDER ═══ */}
                <div
                    className="absolute inset-0 rounded-[16px] pointer-events-none"
                    style={{
                        boxShadow: `inset 0 0 0 2px rgba(220,220,220,0.6)`,
                    }}
                />

                {/* ═══ CONTENT ═══ */}
                <div className="relative h-full flex flex-col">
                    {/* ── HEADER BAR ── */}
                    <div
                        className="relative px-[18px] py-[9px]"
                        style={{
                            background: "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.54) 100%)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Evolution badge */}
                                <span
                                    className="text-[11px] font-bold tracking-[1px] px-2.5 py-[3px] rounded-full uppercase whitespace-nowrap"
                                    style={{
                                        background:
                                            data.evolutionStage === "STAGE 2"
                                                ? "linear-gradient(135deg, #FFD700, #FFA500)"
                                                : data.evolutionStage === "STAGE 1"
                                                ? "linear-gradient(135deg, #E8E8E8, #B0B0B0)"
                                                : "linear-gradient(135deg, #E6B87D, #C4926E)",
                                        color: "#1a1a1a",
                                        fontWeight: 800,
                                        textShadow: "0 0.5px 1px rgba(255,255,255,0.5)",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    {data.evolutionStage}
                                </span>
                                {/* Username V */}
                                <span
                                    className="text-[19px] font-black text-white truncate tracking-tight drop-shadow-md"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                                >
                                    {data.username.length > 14 ? data.username.slice(0, 14) + "…" : data.username} V
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* HP */}
                                <span className="text-[11px] font-semibold text-white/90 tracking-[1.2px]">HP</span>
                                <span
                                    className="text-[30px] font-black text-white leading-none"
                                    style={{
                                        fontFamily: "'Mona Sans', sans-serif",
                                        textShadow: "0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(255,255,255,0.2)",
                                    }}
                                >
                                    {data.hp}
                                </span>
                                {/* Type emoji */}
                                <span className="text-[21px] drop-shadow-lg">{theme.emoji}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── AVATAR SECTION ── */}
                    <div className="relative flex-shrink-0 flex justify-center items-center pt-2 pb-2">
                        {/* Hexagonal frame */}
                        <div
                            className="relative w-[160px] h-[160px] flex items-center justify-center"
                            style={{
                                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                                background: "rgba(10,12,18,0.68)",
                                backdropFilter: "blur(4px)",
                                WebkitBackdropFilter: "blur(4px)",
                                boxShadow: `
                                    0 10px 34px rgba(0,0,0,0.34),
                                    0 0 0 3px rgba(255,255,255,0.42),
                                    inset 0 0 24px rgba(0,0,0,0.38)
                                `,
                            }}
                        >
                            <div
                                className="w-[150px] h-[150px] overflow-hidden relative"
                                style={{
                                    clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                                    background: "rgba(17,24,39,0.86)",
                                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={data.avatarUrl}
                                    alt={data.username}
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover"
                                    style={{
                                        filter: "contrast(1.08) saturate(1.07)",
                                    }}
                                />
                                {/* Soft vignette fade */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(ellipse 62% 62% at 50% 50%, transparent 56%, rgba(0,0,0,0.6) 100%)`,
                                    }}
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(160deg, ${theme.accentColor}1F 0%, transparent 35%, rgba(0,0,0,0.28) 100%)`,
                                        mixBlendMode: "soft-light",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── INFO BAR ── */}
                    {data.location && (
                        <div className="relative px-4 pb-2 text-center">
                            <p
                                className="text-[11px] text-white/90 tracking-wide font-semibold drop-shadow-md leading-[1.35]"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                @{data.username} · {data.location} · Since{" "}
                                {new Date().getFullYear() - data.accountAgeYears}
                            </p>
                        </div>
                    )}

                    {/* ── ABILITY SECTION ── */}
                    <div
                        className="relative mx-3 mb-1.5 px-3 py-2 rounded-lg"
                        style={{
                            background: "rgba(0,0,0,0.48)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <span
                                className="text-[10px] font-black tracking-[0.8px] px-1.5 py-[1px] rounded uppercase whitespace-nowrap mt-[1px]"
                                style={{
                                    background: "linear-gradient(135deg, #FF4444, #CC0000)",
                                    color: "white",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                }}
                            >
                                Ability
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3
                                    className="text-[13px] font-bold text-white leading-tight"
                                    style={{ fontFamily: "'Mona Sans', sans-serif" }}
                                >
                                    {data.ability.name}
                                </h3>
                                <p
                                    className="text-[10px] text-white/95 leading-[1.35] mt-0.5 italic"
                                    style={{
                                        fontFamily: "'Mona Sans', sans-serif",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {cleanText(data.ability.description)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── POWER STATS ── */}
                    <div className="relative mx-3 mb-3 flex gap-2">
                        <div
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md"
                            style={{
                                background: "rgba(0,0,0,0.42)",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.10)",
                            }}
                        >
                                <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>XP</span>
                                <span className="text-[14px] font-black text-white tabular-nums"
                                  style={{ fontFamily: "'JetBrains Mono', monospace", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                                {data.xp.toLocaleString()}
                            </span>
                        </div>
                        <div
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md"
                            style={{
                                background: "rgba(0,0,0,0.42)",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.10)",
                            }}
                        >
                                <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>Velocity</span>
                                <span className="text-[14px] font-black text-white tabular-nums"
                                  style={{ fontFamily: "'JetBrains Mono', monospace", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                                {data.codeVelocity}%
                            </span>
                        </div>
                    </div>

                    {/* ── ATTACKS SECTION ── */}
                    <div
                        className="relative flex-1 mx-3 px-3 pt-2 pb-1.5 rounded-lg flex flex-col gap-1.5"
                        style={{
                            background: "rgba(0,0,0,0.38)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)",
                            border: "1px solid rgba(255,255,255,0.10)",
                        }}
                    >
                        {/* Attack 1 */}
                        <div className="pb-1">
                            <div className="flex items-center gap-2">
                                {/* Energy cost */}
                                <div className="flex items-center gap-[3px] shrink-0 h-[20px]">
                                    {Array.from({ length: data.attack1.energyCost }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} />
                                    ))}
                                </div>
                                {/* Attack name */}
                                <span
                                    className="flex-1 text-[15px] font-black text-white tracking-tight leading-[1.1]"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)" }}
                                >
                                    {data.attack1.name}
                                </span>
                                {/* Damage */}
                                <span
                                    className="w-[48px] text-right text-[24px] font-black text-white leading-none tabular-nums"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {data.attack1.damage}
                                </span>
                            </div>
                            <p
                                className="text-[10px] text-white/95 mt-1 leading-[1.35] ml-[42px]"
                                style={{
                                    fontFamily: "'Mona Sans', sans-serif",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: "250px",
                                }}
                            >
                                {cleanText(data.attack1.description)}
                            </p>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                            }}
                        />

                        {/* Attack 2 */}
                        <div className="pt-0.5">
                            <div className="flex items-center gap-2">
                                {/* Energy cost */}
                                <div className="flex items-center gap-[3px] shrink-0 h-[20px]">
                                    {Array.from({ length: data.attack2.energyCost }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} />
                                    ))}
                                </div>
                                {/* Attack name */}
                                <span
                                    className="flex-1 text-[15px] font-black text-white tracking-tight leading-[1.1]"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)" }}
                                >
                                    {data.attack2.name}
                                </span>
                                {/* Damage */}
                                <span
                                    className="w-[48px] text-right text-[24px] font-black text-white leading-none tabular-nums"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {data.attack2.damage}
                                </span>
                            </div>
                            <p
                                className="text-[10px] text-white/95 mt-1 leading-[1.35] ml-[42px]"
                                style={{
                                    fontFamily: "'Mona Sans', sans-serif",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: "250px",
                                }}
                            >
                                {cleanText(data.attack2.description)}
                            </p>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                            }}
                        />

                        {/* Support Attack 1 */}
                        <div className="pt-0.5">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-[3px] shrink-0 h-[20px]">
                                    {Array.from({ length: supportAttacks[0].energyCost }).map((_, i) => (
                                        <EnergyCircle key={`s1-${i}`} type={data.topLanguage} />
                                    ))}
                                </div>
                                <span
                                    className="flex-1 text-[15px] font-black text-white tracking-tight leading-[1.1]"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)" }}
                                >
                                    {supportAttacks[0].name}
                                </span>
                                <span
                                    className="w-[48px] text-right text-[24px] font-black text-white leading-none tabular-nums"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {supportAttacks[0].damage}
                                </span>
                            </div>
                            <p
                                className="text-[10px] text-white/95 mt-1 leading-[1.35] ml-[42px]"
                                style={{
                                    fontFamily: "'Mona Sans', sans-serif",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: "250px",
                                }}
                            >
                                {cleanText(supportAttacks[0].description)}
                            </p>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                            }}
                        />

                        {/* Support Attack 2 */}
                        <div className="pt-0.5">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-[3px] shrink-0 h-[20px]">
                                    {Array.from({ length: supportAttacks[1].energyCost }).map((_, i) => (
                                        <EnergyCircle key={`s2-${i}`} type={data.topLanguage} />
                                    ))}
                                </div>
                                <span
                                    className="flex-1 text-[15px] font-black text-white tracking-tight leading-[1.1]"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)" }}
                                >
                                    {supportAttacks[1].name}
                                </span>
                                <span
                                    className="w-[48px] text-right text-[24px] font-black text-white leading-none tabular-nums"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {supportAttacks[1].damage}
                                </span>
                            </div>
                            <p
                                className="text-[10px] text-white/95 mt-1 leading-[1.35] ml-[42px]"
                                style={{
                                    fontFamily: "'Mona Sans', sans-serif",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: "250px",
                                }}
                            >
                                {cleanText(supportAttacks[1].description)}
                            </p>
                        </div>
                    </div>

                    {/* ── BOTTOM STATS BAR ── */}
                    <div
                        className="relative px-5 py-2.5"
                        style={{
                            background: "linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.52) 100%)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        <div className="flex items-center text-white/90">
                            {/* Weakness */}
                            <div className="flex-1 flex items-center gap-1.5 pr-2">
                                <span
                                    className="text-[8px] font-bold uppercase tracking-[1.1px] text-white/85"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Weakness
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <EnergyCircle type={data.weakness.type} size="sm" />
                                    <span className="text-[11px] font-bold text-white">{data.weakness.modifier}</span>
                                </div>
                            </div>

                            <div className="h-5 w-px bg-white/15" />

                            {/* Resistance */}
                            <div className="flex-1 flex items-center gap-1.5 px-2 justify-center">
                                <span
                                    className="text-[8px] font-bold uppercase tracking-[1.1px] text-white/85"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Resistance
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <EnergyCircle type={data.resistance.type} size="sm" />
                                    <span className="text-[11px] font-bold text-white">{data.resistance.modifier}</span>
                                </div>
                            </div>

                            <div className="h-5 w-px bg-white/15" />

                            {/* Retreat */}
                            <div className="flex-1 flex items-center gap-1.5 pl-2 justify-end">
                                <span
                                    className="text-[8px] font-bold uppercase tracking-[1.1px] text-white/85"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Retreat
                                </span>
                                <div className="flex items-center gap-[2px]">
                                    {Array.from({ length: Math.min(data.retreatCost, 4) }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} size="sm" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer branding */}
                        <div className="text-center mt-1.5 pt-1.5 border-t border-white/10">
                            <p
                                className="text-[9px] text-white/78 tracking-wider"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                gitwrapped · {data.programmingLanguageCount} lang · {data.topLanguage}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ HOLOGRAPHIC OVERLAY ═══ */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: captureMode ? 0 : showHoverEffects ? 0.2 : 0.01,
                        background: `
                            conic-gradient(
                                from ${effectiveHoloPos.x * 3.6}deg at ${effectiveHoloPos.x}% ${effectiveHoloPos.y}%,
                                rgba(255,0,127,0.15),
                                rgba(255,127,0,0.12),
                                rgba(255,255,0,0.15),
                                rgba(0,255,127,0.12),
                                rgba(0,127,255,0.15),
                                rgba(127,0,255,0.12),
                                rgba(255,0,255,0.15),
                                rgba(255,0,127,0.15)
                            )
                        `,
                        mixBlendMode: "color-dodge",
                    }}
                />

                {/* ═══ VERTICAL HOLO LINES ═══ */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: captureMode ? 0 : showHoverEffects ? 0.06 : 0,
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2px)`,
                        backgroundSize: "3px 100%",
                        mixBlendMode: "overlay",
                    }}
                />

                {/* ═══ LIGHT SPOT ═══ */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-400"
                    style={{
                        opacity: captureMode ? 0 : showHoverEffects ? 0.1 : 0,
                        background: `radial-gradient(
                            ellipse 50% 40% at ${effectiveHoloPos.x}% ${effectiveHoloPos.y}%,
                            rgba(255,255,255,0.4) 0%,
                            transparent 70%
                        )`,
                    }}
                />
            </motion.div>
            </div>
        </div>
    );
}

