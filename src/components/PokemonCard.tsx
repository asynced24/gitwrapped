"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { PokemonCardData } from "@/lib/card";
import { LAYOUT, cardImageUrls, renderCardSVG } from "@/lib/card-svg";

interface PokemonCardProps {
    data: PokemonCardData;
    className?: string;
    /** Freeze interactive effects so a PNG export looks like the README card. */
    captureMode?: boolean;
}

/**
 * The in-app card is the exact SVG the README card uses (one layout, so the
 * two can never drift apart), with tilt and holographic hover on top.
 */
export function PokemonCard({ data, className = "", captureMode = false }: PokemonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 22 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 22 });

    // useId gives ":r1:"-style ids; SVG ids must be plain names.
    const idPrefix = `gw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const svg = useMemo(() => renderCardSVG(data, cardImageUrls(data), { idPrefix }), [data, idPrefix]);

    const showHoverEffects = !captureMode && isHovering;

    useEffect(() => {
        if (!captureMode) return;
        rotateX.set(0);
        rotateY.set(0);
    }, [captureMode, rotateX, rotateY]);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (captureMode || !cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            rotateX.set((y - 0.5) * -16);
            rotateY.set((x - 0.5) * 16);
            setHoloPos({ x: x * 100, y: y * 100 });
        },
        [captureMode, rotateX, rotateY]
    );

    const handleMouseLeave = useCallback(() => {
        rotateX.set(0);
        rotateY.set(0);
        setIsHovering(false);
    }, [rotateX, rotateY]);

    const { width, height, radius } = LAYOUT.frame;

    return (
        <motion.div
            className={`perspective-[1400px] ${className}`}
            initial={captureMode ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => !captureMode && setIsHovering(true)}
                onMouseLeave={handleMouseLeave}
                className={`relative select-none overflow-hidden ${captureMode ? "" : "cursor-pointer"}`}
                style={{
                    width,
                    height,
                    borderRadius: radius,
                    rotateX: springX,
                    rotateY: springY,
                    transformStyle: "preserve-3d",
                    boxShadow: captureMode ? "none" : "0 10px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)",
                }}
                role="img"
                aria-label={`${data.username}'s dev card: ${data.art.species}, HP ${data.hp}, ${data.rarity}`}
            >
                <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />

                {/* Holographic foil that follows the cursor */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: showHoverEffects ? 0.35 : 0,
                        background: `conic-gradient(from ${holoPos.x * 3.6}deg at ${holoPos.x}% ${holoPos.y}%,
                            rgba(255,0,127,0.35), rgba(255,200,0,0.3), rgba(0,255,160,0.3),
                            rgba(0,140,255,0.35), rgba(160,0,255,0.3), rgba(255,0,127,0.35))`,
                        mixBlendMode: "color-dodge",
                    }}
                />
                {/* Specular highlight */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: showHoverEffects ? 0.14 : 0,
                        background: `radial-gradient(ellipse 50% 40% at ${holoPos.x}% ${holoPos.y}%, rgba(255,255,255,0.8), transparent 70%)`,
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
