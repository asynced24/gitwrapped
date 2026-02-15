"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { PokemonCardData, getCardArtPath, getLanguageTheme } from "@/lib/card";

interface PokemonCardProps {
    data: PokemonCardData;
    className?: string;
}

/* ─────────────────────────────────────────────
   Energy Circle — type-colored gradient dot
   ───────────────────────────────────────────── */
function EnergyCircle({ type }: { type: string }) {
    const theme = getLanguageTheme(type);
    return (
        <span
            className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
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
export function PokemonCard({ data, className = "" }: PokemonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 22 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 22 });

    const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });

    const theme = getLanguageTheme(data.topLanguage);
    const cardArtPath = getCardArtPath(data.topLanguage);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            rotateX.set((y - 0.5) * -20);
            rotateY.set((x - 0.5) * 20);
            setHoloPos({ x: x * 100, y: y * 100 });
        },
        [rotateX, rotateY]
    );

    const handleMouseLeave = useCallback(() => {
        rotateX.set(0);
        rotateY.set(0);
        setIsHovering(false);
    }, [rotateX, rotateY]);

    const handleMouseEnter = useCallback(() => setIsHovering(true), []);

    return (
        <div className={`perspective-[1400px] ${className}`}>
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                animate={{
                    y: isHovering ? 0 : [0, -8, 0],
                    scale: isHovering ? 1.04 : 1,
                }}
                transition={{
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.3, ease: "easeOut" },
                }}
                className="relative w-[350px] h-[490px] rounded-[16px] cursor-pointer select-none overflow-hidden"
                style={{
                    rotateX: springX,
                    rotateY: springY,
                    transformStyle: "preserve-3d",
                    boxShadow: `
                        0 2px 4px rgba(0,0,0,0.12),
                        0 8px 16px rgba(0,0,0,0.16),
                        0 16px 48px rgba(0,0,0,0.20),
                        0 0 0 2px rgba(180,180,180,0.4),
                        0 0 100px ${theme.borderColor}25
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
                        background: `linear-gradient(145deg, ${theme.borderColor}CC 0%, ${theme.accentColor}B3 40%, ${theme.borderColor}CC 100%)`,
                    }}
                />

                {/* ═══ GEOMETRIC PATTERN OVERLAY ═══ */}
                <div
                    className="absolute inset-0 opacity-[0.20]"
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
                        className="relative px-4 py-2.5"
                        style={{
                            background: "linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.35) 100%)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Evolution badge */}
                                <span
                                    className="text-[9px] font-bold tracking-wider px-2 py-[3px] rounded-full uppercase whitespace-nowrap"
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
                                    className="text-[18px] font-black text-white truncate tracking-tight drop-shadow-md"
                                    style={{ fontFamily: "'Mona Sans', sans-serif", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                                >
                                    {data.username.length > 14 ? data.username.slice(0, 14) + "…" : data.username} V
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* HP */}
                                <span className="text-[10px] font-semibold text-white/70 tracking-wide">HP</span>
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
                                <span className="text-[20px] drop-shadow-lg">{theme.emoji}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── AVATAR SECTION ── */}
                    <div className="relative flex-shrink-0 flex justify-center items-center py-2">
                        {/* Hexagonal frame */}
                        <div
                            className="relative w-[160px] h-[160px] flex items-center justify-center"
                            style={{
                                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                                background: "rgba(255,255,255,0.15)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                boxShadow: `
                                    0 8px 32px rgba(0,0,0,0.25),
                                    0 0 0 3px rgba(255,255,255,0.3),
                                    inset 0 0 20px rgba(255,255,255,0.1)
                                `,
                            }}
                        >
                            <div
                                className="w-[150px] h-[150px] overflow-hidden"
                                style={{
                                    clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
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

                    {/* ── INFO BAR ── */}
                    {data.location && (
                        <div className="relative px-4 pb-1.5 text-center">
                            <p
                                className="text-[9px] text-white/70 tracking-wide font-medium drop-shadow-md"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                @{data.username} · {data.location} · Since{" "}
                                {new Date().getFullYear() - data.accountAgeYears}
                            </p>
                        </div>
                    )}

                    {/* ── ABILITY SECTION ── */}
                    <div
                        className="relative mx-3 mb-2 px-3 py-2 rounded-lg"
                        style={{
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <span
                                className="text-[8px] font-black tracking-wider px-1.5 py-[2px] rounded uppercase whitespace-nowrap"
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
                                    className="text-[11px] font-bold text-white leading-tight"
                                    style={{ fontFamily: "'Mona Sans', sans-serif" }}
                                >
                                    {data.ability.name}
                                </h3>
                                <p
                                    className="text-[8.5px] text-white/80 leading-snug mt-0.5 italic"
                                    style={{ fontFamily: "'Mona Sans', sans-serif" }}
                                >
                                    {data.ability.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── ATTACKS SECTION ── */}
                    <div className="relative flex-1 px-4 py-3 flex flex-col justify-evenly gap-1">
                        {/* Attack 1 */}
                        <div>
                            <div className="flex items-center gap-2.5">
                                {/* Energy cost */}
                                <div className="flex items-center gap-[3px] shrink-0">
                                    {Array.from({ length: data.attack1.energyCost }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} />
                                    ))}
                                </div>
                                {/* Attack name */}
                                <span
                                    className="flex-1 text-[14px] font-extrabold text-white tracking-tight drop-shadow-md"
                                    style={{ fontFamily: "'Mona Sans', sans-serif" }}
                                >
                                    {data.attack1.name}
                                </span>
                                {/* Damage */}
                                <span
                                    className="text-[28px] font-black text-white leading-none tabular-nums drop-shadow-lg"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                                    }}
                                >
                                    {data.attack1.damage}
                                </span>
                            </div>
                            <p
                                className="text-[8.5px] text-white/80 mt-1 leading-relaxed ml-[42px]"
                                style={{ fontFamily: "'Mona Sans', sans-serif" }}
                            >
                                {data.attack1.description}
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
                        <div>
                            <div className="flex items-center gap-2.5">
                                {/* Energy cost */}
                                <div className="flex items-center gap-[3px] shrink-0">
                                    {Array.from({ length: data.attack2.energyCost }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} />
                                    ))}
                                </div>
                                {/* Attack name */}
                                <span
                                    className="flex-1 text-[14px] font-extrabold text-white tracking-tight drop-shadow-md"
                                    style={{ fontFamily: "'Mona Sans', sans-serif" }}
                                >
                                    {data.attack2.name}
                                </span>
                                {/* Damage */}
                                <span
                                    className="text-[28px] font-black text-white leading-none tabular-nums drop-shadow-lg"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                                    }}
                                >
                                    {data.attack2.damage}
                                </span>
                            </div>
                            <p
                                className="text-[8.5px] text-white/80 mt-1 leading-relaxed ml-[42px]"
                                style={{ fontFamily: "'Mona Sans', sans-serif" }}
                            >
                                {data.attack2.description}
                            </p>
                        </div>
                    </div>

                    {/* ── BOTTOM STATS BAR ── */}
                    <div
                        className="relative px-4 py-2.5"
                        style={{
                            background: "linear-gradient(0deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.35) 100%)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        <div className="flex items-center justify-between text-white/90">
                            {/* Weakness */}
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[7px] font-bold uppercase tracking-wider"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Weakness
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <EnergyCircle type={data.weakness.type} />
                                    <span className="text-[10px] font-bold">{data.weakness.modifier}</span>
                                </div>
                            </div>

                            {/* Resistance */}
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[7px] font-bold uppercase tracking-wider"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Resistance
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <EnergyCircle type={data.resistance.type} />
                                    <span className="text-[10px] font-bold">{data.resistance.modifier}</span>
                                </div>
                            </div>

                            {/* Retreat */}
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[7px] font-bold uppercase tracking-wider"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    Retreat
                                </span>
                                <div className="flex items-center gap-[2px]">
                                    {Array.from({ length: Math.min(data.retreatCost, 4) }).map((_, i) => (
                                        <EnergyCircle key={i} type={data.topLanguage} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer branding */}
                        <div className="text-center mt-1.5 pt-1.5 border-t border-white/10">
                            <p
                                className="text-[7px] text-white/60 tracking-wider"
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
                        opacity: isHovering ? 0.55 : 0.08,
                        background: `
                            conic-gradient(
                                from ${holoPos.x * 3.6}deg at ${holoPos.x}% ${holoPos.y}%,
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
                        opacity: isHovering ? 0.12 : 0,
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2px)`,
                        backgroundSize: "3px 100%",
                        mixBlendMode: "overlay",
                    }}
                />

                {/* ═══ LIGHT SPOT ═══ */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-400"
                    style={{
                        opacity: isHovering ? 0.25 : 0,
                        background: `radial-gradient(
                            ellipse 50% 40% at ${holoPos.x}% ${holoPos.y}%,
                            rgba(255,255,255,0.4) 0%,
                            transparent 70%
                        )`,
                    }}
                />
            </motion.div>
        </div>
    );
}

