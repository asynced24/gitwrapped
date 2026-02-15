"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, User } from "lucide-react";
import { TechCursor } from "@/components/TechCursor";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    router.push(`/dashboard/${username.trim()}`);
  };

  return (
    <>
      <TechCursor />

      {/* Header */}
      <div className="landing-header">
        <a href="https://github.com/yourusername/gitwrapped" target="_blank" rel="noopener noreferrer" className="landing-header-link">
          <Github size={14} />
          Source
        </a>
        <a href="https://github.com/asynced24" target="_blank" rel="noopener noreferrer" className="landing-header-link landing-header-link--author">
          <User size={14} />
          <span className="author-label">Built by</span>
          <span className="author-handle">@asynced24</span>
        </a>
      </div>

      <div className="landing">
        <div className="landing-content">
          <div className="landing-logo">GitWrapped</div>

          <h1>Who are you as a developer?</h1>
          <p className="landing-subtitle">
            Transform your GitHub data into a credible, shareable identity snapshot.
            No guesswork. Every insight maps to real data.
          </p>

          <div className="landing-features">
            <span className="landing-feature">Developer analytics</span>
            <span className="landing-feature">Shareable identity cards</span>
            <span className="landing-feature">Trend visualization</span>
          </div>

          <form onSubmit={handleSubmit} className="landing-form">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username"
              className="landing-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="landing-submit"
              disabled={loading || !username.trim()}
            >
              {loading ? "Loading..." : (
                <>
                  Go <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="landing-examples">
            Try:{" "}
            <a href="/dashboard/torvalds">torvalds</a>,{" "}
            <a href="/dashboard/gaearon">gaearon</a>,{" "}
            <a href="/dashboard/sindresorhus">sindresorhus</a>
          </p>
        </div>
      </div>
    </>
  );
}
