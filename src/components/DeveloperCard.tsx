import React from 'react';
import Image from 'next/image';

interface DeveloperCardProps {
    imageSrc: string;
    name: string;
    className?: string;
    width?: number;
    height?: number;
}

export function DeveloperCard({
    imageSrc,
    name,
    className = '',
    width = 300,
    height = 450
}: DeveloperCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-2xl ${className}`}
            style={{ width, height }}
        >
            {/* 
        Image Container 
        We use a relative container to ensure the image fills the card and can be styled.
      */}
            <div className="relative w-full h-full group">
                <Image
                    src={imageSrc}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Holographic overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />

                {/* Anti-AI-Watermark Overlay / Card Frame Bottom */}
                {/* This gradient bar at the bottom produces a premium card look while obscuring the bottom ~20px where watermarks usually reside */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

                {/* Optional: A specific corner blocker if the gradient isn't enough - keeping it subtle */}
                <div className="absolute bottom-0 right-0 w-24 h-8 bg-black/0 z-20 flex items-end justify-end p-1">
                    {/* We can put a game stats badge here or just leave the gradient to cover it */}
                    <div className="text-[10px] text-white/30 font-mono hidden">ID: {name.split(' ')[0].toUpperCase()}</div>
                </div>
            </div>

            {/* Card Label Overlay (Optional, if we want text on the card) */}
            <div className="absolute bottom-4 left-4 z-20">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{name}</h3>
            </div>
        </div>
    );
}
