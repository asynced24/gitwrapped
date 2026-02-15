"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { PokemonCard } from "@/components/PokemonCard";
import { TechCursor } from "@/components/TechCursor";
import { PokemonCardData } from "@/lib/card";
import { Copy, Check, Download, ExternalLink, Zap, ArrowLeft } from "lucide-react";

export default function GenerateClient() {
    const [username, setUsername] = useState("");
    const [cardData, setCardData] = useState<PokemonCardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState<"markdown" | "url" | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const cardPreviewRef = useRef<HTMLDivElement>(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://gitwrapped.aryansync.com";

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;

        setLoading(true);
        setError("");
        setCardData(null);

        try {
            const res = await fetch(`/api/card/${trimmed}?format=json`);
            if (!res.ok) throw new Error("User not found");
            const data = await res.json();
            setCardData(data);
        } catch {
            setError("Could not find that GitHub user. Check the username and try again.");
        } finally {
            setLoading(false);
        }
    };

    const cardUrl = cardData ? `${origin}/api/card/${cardData.username}` : "";
    const markdownSnippet = cardData ? `![${cardData.username}'s Dev Card](${cardUrl})` : "";

    const handleCopy = async (type: "markdown" | "url") => {
        const text = type === "markdown" ? markdownSnippet : cardUrl;
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownloadPng = async () => {
        if (!cardData || !cardPreviewRef.current || isCapturing) return;
        
        try {
            setIsCapturing(true);
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

            const { width, height } = cardPreviewRef.current.getBoundingClientRect();
            const canvas = await html2canvas(cardPreviewRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                logging: false,
                width: Math.max(1, Math.round(width)),
                height: Math.max(1, Math.round(height)),
            });

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error("Failed to create PNG blob from canvas");
                    setError("Could not generate PNG. Please try again.");
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${cardData.username}-dev-card.png`;
                link.click();
                URL.revokeObjectURL(url);
            }, "image/png");
        } catch (error) {
            console.error("Failed to download PNG:", error);
            setError("Failed to download PNG. Please try again.");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="generate-page">
            <nav className="generate-nav">
                <a href="/" className="generate-nav__back">
                    <ArrowLeft size={16} />
                    <span>GitWrapped</span>
                </a>
            </nav>

            <div className="generate-hero">
                <div className="generate-hero__box">
                    <TechCursor mode="absolute" className="generate-hero__cursor" />
                    <div className="generate-hero__badge">
                        <Zap size={14} />
                        <span>Dev Pokémon Card Generator</span>
                    </div>
                    <h1 className="generate-hero__title">
                        Get Your Dev Card
                    </h1>
                    <p className="generate-hero__subtitle">
                        Transform your GitHub profile into a collectible Pokémon-style trading card.
                        Embed it in your README or share it anywhere.
                    </p>

                    <form onSubmit={handleGenerate} className="generate-form">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="GitHub username"
                            className="generate-form__input"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="generate-form__btn"
                            disabled={loading || !username.trim()}
                        >
                            {loading ? (
                                <span className="generate-spinner" />
                            ) : (
                                <>
                                    <Zap size={16} />
                                    Generate
                                </>
                            )}
                        </button>
                    </form>

                    {error && <p className="generate-error">{error}</p>}
                </div>
            </div>

            {cardData && (
                <div className="generate-results">
                    <div className="generate-results__grid">
                        {/* Interactive Preview */}
                        <div className="generate-results__preview">
                            <h3 className="generate-results__label">Interactive Preview</h3>
                            <div className="generate-results__card-wrap" ref={cardPreviewRef}>
                                <PokemonCard data={cardData} captureMode={isCapturing} />
                            </div>
                            <button onClick={handleDownloadPng} className="generate-actions__btn mt-3" disabled={isCapturing}>
                                <Download size={14} />
                                {isCapturing ? "Preparing PNG..." : "Download PNG"}
                            </button>
                        </div>

                        {/* Static SVG Preview */}
                        <div className="generate-results__preview">
                            <h3 className="generate-results__label">Static Image (for README)</h3>
                            <div className="generate-results__svg-wrap">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`/api/card/${cardData.username}`}
                                    alt={`${cardData.username}'s Dev Card`}
                                    className="generate-results__svg-img"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="generate-actions">
                        <div className="generate-actions__embed">
                            <p className="generate-actions__label">Markdown embed code:</p>
                            <pre className="generate-actions__code">{markdownSnippet}</pre>
                        </div>

                        <div className="generate-actions__buttons">
                            <button onClick={() => handleCopy("markdown")} className="generate-actions__btn">
                                {copied === "markdown" ? <Check size={14} /> : <Copy size={14} />}
                                {copied === "markdown" ? "Copied!" : "Copy Markdown"}
                            </button>
                            <button onClick={() => handleCopy("url")} className="generate-actions__btn">
                                {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
                                {copied === "url" ? "Copied!" : "Copy Image URL"}
                            </button>
                            <a
                                href={`/api/card/${cardData.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="generate-actions__btn"
                            >
                                <ExternalLink size={14} />
                                View Image
                            </a>
                        </div>
                    </div>

                    {/* Dashboard link */}
                    <div className="generate-cta">
                        <p>Want the full developer report?</p>
                        <a href={`/dashboard/${cardData.username}`} className="generate-cta__link">
                            View Full Dashboard →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
