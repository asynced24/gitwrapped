"use client";
import React, { useEffect, useRef } from "react";

interface TechImage {
    name: string;
    src: string;
    image: HTMLImageElement;
}

interface Particle {
    x: number;
    y: number;
    alpha: number;
    image: HTMLImageElement;
    size: number;
    update: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
}

interface TechCursorProps {
    mode?: "fixed" | "absolute";
    className?: string;
}

const icons: { name: string; src: string }[] = [
    {
        name: "JavaScript",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012752/js_nocitj.png",
    },
    {
        name: "TypeScript",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012632/ts_elsqw8.png",
    },
    {
        name: "React",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012941/react_ogt6ny.svg",
    },
    {
        name: "Next.js",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012973/next_hrodnb.svg",
    },
    {
        name: "HTML",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012812/html_xbcdkj.png",
    },
    {
        name: "CSS",
        src: "https://res.cloudinary.com/dz1fy2tof/image/upload/v1755012862/css_1_irojyc.png",
    },
];

export function TechCursor({ mode = "fixed", className = "" }: TechCursorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const techImagesRef = useRef<TechImage[]>([]);

    useEffect(() => {
        // Preload images
        const loadImages = async () => {
            techImagesRef.current = await Promise.all(
                icons.map(({ name, src }) => {
                    return new Promise<TechImage>((resolve) => {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => resolve({ name, src, image: img });
                    });
                }),
            );
        };

        loadImages().then(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const updateSize = () => {
                if (mode === "absolute" && canvas.parentElement) {
                    canvas.width = canvas.parentElement.clientWidth;
                    canvas.height = canvas.parentElement.clientHeight;
                    return;
                }
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };

            updateSize();

            const particles = particlesRef.current;

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.update();
                    p.draw(ctx);
                    if (p.alpha <= 0) {
                        particles.splice(i, 1);
                    }
                }
                requestAnimationFrame(animate);
            };

            animate();

            const onMove = (e: MouseEvent) => {
                const rect = canvas.getBoundingClientRect();
                const x = mode === "absolute" ? e.clientX - rect.left : e.clientX;
                const y = mode === "absolute" ? e.clientY - rect.top : e.clientY;

                if (mode === "absolute" && (x < 0 || y < 0 || x > rect.width || y > rect.height)) {
                    return;
                }

                const randomIcon =
                    techImagesRef.current[
                    Math.floor(Math.random() * techImagesRef.current.length)
                    ];

                const size = 22 + Math.random() * 8;

                const particle: Particle = {
                    x,
                    y,
                    alpha: 1,
                    image: randomIcon.image,
                    size,
                    update() {
                        this.y -= 0.4;
                        this.alpha -= 0.02;
                    },
                    draw(ctx: CanvasRenderingContext2D) {
                        ctx.globalAlpha = this.alpha;
                        ctx.drawImage(
                            this.image,
                            this.x - this.size / 2,
                            this.y - this.size / 2,
                            this.size,
                            this.size,
                        );
                        ctx.globalAlpha = 1;
                    },
                };

                particles.push(particle);
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("resize", updateSize);
            return () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("resize", updateSize);
            };
        });
    }, [mode]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                position: mode === "absolute" ? "absolute" : "fixed",
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1,
            }}
        />
    );
}
