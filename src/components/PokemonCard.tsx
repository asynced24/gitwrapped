"use client";

import { useRef, useState, useCallback, useEffect, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
   Attack Row — intrinsic height (no flex-1)
   ───────────────────────────────────────────── */
function AttackRow({
    name,
    description,
    damage,
    energyCost,
    topLanguage,
    cleanText,
}: {
    name: string;
    description: string;
    damage: number;
    energyCost: number;
    topLanguage: string;
    cleanText: (t: string) => string;
}) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-[3px] shrink-0 h-[20px]">
                    {Array.from({ length: energyCost }).map((_, i) => (
                        <EnergyCircle key={i} type={topLanguage} />
                    ))}
                </div>
                <span
                    className="flex-1 text-[15px] font-black text-white tracking-tight leading-[1.1]"
                    style={{
                        fontFamily: "'Mona Sans', sans-serif",
                        textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)",
                    }}
                >
                    {name}
                </span>
                <span
                    className="w-[48px] text-right text-[24px] font-black text-white leading-none tabular-nums"
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
                    }}
                >
                    {damage}
                </span>
            </div>
            <p
                className="text-[11px] text-white/85 mt-1 leading-[1.35]"
                style={{
                    fontFamily: "'Mona Sans', sans-serif",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    paddingLeft: `${energyCost * 18 + 4}px`,
                    paddingRight: "8px",
                }}
            >
                {cleanText(description)}
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export function PokemonCard({ data, className = "", captureMode = false }: PokemonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });
    const [flashPlayed, setFlashPlayed] = useState(false);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 22 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 22 });

    /* Parallax: background + avatar drift opposite to tilt direction */
    const bgParallaxX = useTransform(springY, [-10, 10], [7, -7]);
    const bgParallaxY = useTransform(springX, [-10, 10], [-7, 7]);
    const avatarParallaxX = useTransform(springY, [-10, 10], [9, -9]);
    const avatarParallaxY = useTransform(springX, [-10, 10], [-9, 9]);

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
        /* Entrance wrapper — slides up + fades in; skipped entirely in captureMode */
        <motion.div
            className={`perspective-[1400px] ${className}`}
            initial={captureMode ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
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
                    animate={{ scale: showHoverEffects ? 1.01 : 1 }}
                    transition={{ scale: { duration: 0.3, ease: "easeOut" } }}
                    className={`relative w-[350px] h-[490px] rounded-[16px] select-none overflow-hidden ${captureMode ? "cursor-default" : "cursor-pointer"}`}
                    style={{
                        rotateX: springX,
                        rotateY: springY,
                        transformStyle: "preserve-3d",
                        /* Phase 2: subtle card edge bevel */
                        boxShadow: `
                            0 2px 4px rgba(0,0,0,0.12),
                            0 8px 16px rgba(0,0,0,0.16),
                            0 16px 48px rgba(0,0,0,0.22),
                            inset 0 1px 0 rgba(255,255,255,0.12),
                            inset 0 -1px 0 rgba(0,0,0,0.3)
                        `,
                    }}
                >
                    {/* ═══ FULL-ART BACKGROUND — parallax on tilt ═══ */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${cardArtPath})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            x: bgParallaxX,
                            y: bgParallaxY,
                            scale: 1.06,
                        }}
                    />

                    {/* theme-color overlay — lighter so art stays vibrant */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(145deg, ${theme.borderColor}78 0%, ${theme.accentColor}50 40%, ${theme.borderColor}78 100%)`,
                        }}
                    />

                    {/* ═══ GRAIN / NOISE TEXTURE — tactile depth ═══ */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            opacity: 0.04,
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            backgroundSize: "128px 128px",
                            mixBlendMode: "overlay",
                        }}
                    />

                    {/* silver inset border + top-edge specular */}
                    <div
                        className="absolute inset-0 rounded-[16px] pointer-events-none"
                        style={{
                            boxShadow: `inset 0 0 0 2px rgba(220,220,220,0.55), inset 0 1px 0 rgba(255,255,255,0.45)`,
                        }}
                    />

                    {/* ═══ CARD CONTENT ═══ */}
                    <div className="relative h-full flex flex-col">

                        {/* ── HEADER BAR ── */}
                        <div
                            className="relative px-[18px] py-[9px]"
                            style={{
                                background: "linear-gradient(180deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.42) 100%)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
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
                                    {/* Phase 2: metallic V treatment */}
                                    <span
                                        className="text-[19px] font-black text-white truncate tracking-tight"
                                        style={{
                                            fontFamily: "'Mona Sans', sans-serif",
                                            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        {data.username.length > 14 ? data.username.slice(0, 14) + "…" : data.username}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "22px",
                                            fontWeight: 900,
                                            background: "linear-gradient(180deg, #fff, #aaa)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                                            marginLeft: "2px",
                                            lineHeight: 1,
                                        }}
                                    >
                                        V
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
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
                                    <span className="text-[21px] drop-shadow-lg">{theme.emoji}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── AVATAR — flex-1 makes this the hero space ── */}
                        <div className="relative flex-1 flex justify-center items-center pt-3 pb-1">
                            <motion.div
                                className="relative w-[160px] h-[160px] flex items-center justify-center"
                                style={{
                                    clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                                    background: "rgba(10,12,18,0.42)",
                                    boxShadow: `
                                        0 8px 28px rgba(0,0,0,0.28),
                                        0 0 0 2px rgba(255,255,255,0.38)
                                    `,
                                    x: avatarParallaxX,
                                    y: avatarParallaxY,
                                }}
                            >
                                <div
                                    className="w-[150px] h-[150px] overflow-hidden relative"
                                    style={{
                                        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                                        background: "rgba(17,24,39,0.55)",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={data.avatarUrl}
                                        alt={data.username}
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover"
                                        style={{ filter: "contrast(1.08) saturate(1.07)" }}
                                    />
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse 62% 62% at 50% 50%, transparent 56%, rgba(0,0,0,0.45) 100%)`,
                                        }}
                                    />
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(160deg, ${theme.accentColor}1F 0%, transparent 35%, rgba(0,0,0,0.18) 100%)`,
                                            mixBlendMode: "soft-light",
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* ── INFO BAR ── */}
                        <div className="relative px-4 pb-1.5 text-center">
                            <p
                                className="text-[11px] text-white tracking-wide font-bold leading-[1.35]"
                                style={{ fontFamily: "'JetBrains Mono', monospace", textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.5)" }}
                            >
                                @{data.username}{data.location ? ` · ${data.location}` : ""} · Since{" "}
                                {new Date().getFullYear() - data.accountAgeYears}
                            </p>
                        </div>

                        {/* ── ABILITY + XP/VELOCITY (combined panel) ── */}
                        <div
                            className="relative mx-3 mb-2 px-3 py-2 rounded-lg"
                            style={{
                                /* Phase 2: themed tint + accent border */
                                background: `linear-gradient(135deg, rgba(0,0,0,0.28), ${theme.borderColor}18)`,
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderLeft: `3px solid ${theme.accentColor}60`,
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                            }}
                        >
                            <div className="flex items-start gap-2">
                                <span
                                    className="text-[11px] font-black tracking-[0.8px] px-1.5 py-[1px] rounded uppercase whitespace-nowrap mt-[1px]"
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.borderColor})`,
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
                                        className="text-[11px] text-white/90 leading-[1.35] mt-0.5 italic"
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
                                    {/* XP + Velocity merged as metadata — replaces separate pill bar */}
                                    <p
                                        className="text-[11px] text-white/65 mt-1.5 tracking-wide tabular-nums"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                    >
                                        XP {data.xp.toLocaleString()} · Velocity {data.codeVelocity}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── ATTACKS — intrinsic height, no flex-1 ── */}
                        <div
                            className="relative mx-3 mb-2 px-3 pt-2.5 pb-2.5 rounded-lg flex flex-col gap-2 overflow-hidden"
                            style={{
                                background: "rgba(0,0,0,0.25)",
                                backdropFilter: "blur(4px)",
                                WebkitBackdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.10)",
                            }}
                        >
                            <AttackRow
                                name={data.attack1.name}
                                description={data.attack1.description}
                                damage={data.attack1.damage}
                                energyCost={data.attack1.energyCost}
                                topLanguage={data.topLanguage}
                                cleanText={cleanText}
                            />

                            <div
                                style={{
                                    height: "1px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                                }}
                            />

                            <AttackRow
                                name={data.attack2.name}
                                description={data.attack2.description}
                                damage={data.attack2.damage}
                                energyCost={data.attack2.energyCost}
                                topLanguage={data.topLanguage}
                                cleanText={cleanText}
                            />
                        </div>

                        {/* ── BOTTOM STATS BAR ── */}
                        <div
                            className="relative px-4 pt-2.5 pb-4"
                            style={{
                                background: "linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.40) 100%)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                            }}
                        >
                            <div className="flex items-center text-white/90">
                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-[1px] text-white/60"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                    >
                                        Weakness
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        <EnergyCircle type={data.weakness.type} size="sm" />
                                        <span className="text-[11px] font-bold text-white">{data.weakness.modifier}</span>
                                    </div>
                                </div>

                                <div className="h-6 w-px bg-white/15" />

                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-[1px] text-white/60"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                    >
                                        Resist
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        <EnergyCircle type={data.resistance.type} size="sm" />
                                        <span className="text-[11px] font-bold text-white">{data.resistance.modifier}</span>
                                    </div>
                                </div>

                                <div className="h-6 w-px bg-white/15" />

                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-[1px] text-white/60"
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

                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10">
                                <p
                                    className="text-[11px] text-white/55 tracking-wider min-w-0 truncate mr-2"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    gitwrapped · {data.programmingLanguageCount} lang · {data.topLanguage}
                                </p>
                                <p
                                    className="text-[11px] text-white/45 tracking-wide shrink-0"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    #{data.cardNumber}
                                    <span className="ml-1.5" style={{ fontSize: "13px", opacity: data.rarity === "rare" ? 1 : 0.7 }}>
                                        {data.rarity === "rare" ? "★" : data.rarity === "uncommon" ? "◆" : "●"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ HOLOGRAPHIC FOIL — conic, the signature effect ═══ */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                            opacity: captureMode ? 0 : showHoverEffects ? 0.45 : 0.06,
                            background: `
                                conic-gradient(
                                    from ${effectiveHoloPos.x * 3.6}deg at ${effectiveHoloPos.x}% ${effectiveHoloPos.y}%,
                                    rgba(255,0,127,0.35),
                                    rgba(255,127,0,0.30),
                                    rgba(255,255,0,0.35),
                                    rgba(0,255,127,0.30),
                                    rgba(0,127,255,0.35),
                                    rgba(127,0,255,0.30),
                                    rgba(255,0,255,0.35),
                                    rgba(255,0,127,0.35)
                                )
                            `,
                            mixBlendMode: "color-dodge",
                        }}
                    />

                    {/* ═══ RAINBOW SWEEP — angle follows cursor ═══ */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                        style={{
                            opacity: captureMode ? 0 : showHoverEffects ? 0.12 : 0,
                            background: `linear-gradient(
                                ${effectiveHoloPos.x * 1.8}deg,
                                rgba(255,0,127,0.2) 0%,
                                rgba(255,127,0,0.2) 20%,
                                rgba(255,255,0,0.15) 35%,
                                rgba(0,255,127,0.2) 50%,
                                rgba(0,127,255,0.2) 65%,
                                rgba(127,0,255,0.2) 80%,
                                rgba(255,0,255,0.2) 100%
                            )`,
                            mixBlendMode: "screen",
                        }}
                    />

                    {/* ═══ SCANLINE GRID ═══ */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                            opacity: captureMode ? 0 : showHoverEffects ? 0.09 : 0,
                            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2px)`,
                            backgroundSize: "3px 100%",
                            mixBlendMode: "overlay",
                        }}
                    />

                    {/* ═══ SPECULAR LIGHT SPOT — reduced max opacity ═══ */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            transition: "opacity 0.4s",
                            opacity: captureMode ? 0 : showHoverEffects ? 0.08 : 0,
                            background: `radial-gradient(
                                ellipse 50% 40% at ${effectiveHoloPos.x}% ${effectiveHoloPos.y}%,
                                rgba(255,255,255,0.5) 0%,
                                transparent 70%
                            )`,
                        }}
                    />

                    {/* ═══ ALWAYS-ON BASE SHIMMER — halved intensity ═══ */}
                    <div
                        className={`absolute inset-0 pointer-events-none ${captureMode ? "" : "card-foil-shimmer"}`}
                        style={{
                            opacity: captureMode ? 0 : undefined,
                            background: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)`,
                            mixBlendMode: "soft-light",
                        }}
                    />

                    {/* ═══ ENTRANCE WHITE FLASH — plays once on first mount ═══ */}
                    {!captureMode && !flashPlayed && (
                        <motion.div
                            className="absolute inset-0 rounded-[16px] pointer-events-none"
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.75, ease: "easeOut" }}
                            onAnimationComplete={() => setFlashPlayed(true)}
                            style={{ background: "white", mixBlendMode: "soft-light" }}
                        />
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
