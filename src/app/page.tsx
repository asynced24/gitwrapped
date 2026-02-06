"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Sparkles, ArrowRight, Code2, Share2 } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    router.push(`/dashboard/${username.trim()}`);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Navigation */}
      <nav className="nav">
        <div className="container nav-content">
          <div className="nav-brand">
            <Sparkles size={20} style={{ color: "var(--accent-primary)" }} />
            <span>GitWrapped</span>
          </div>
          <a
            href="https://github.com/asynced24/gitwrapped"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <Github size={16} />
            <span>Source</span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main
        className="container"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "64px 24px",
          maxWidth: 640,
        }}
      >
        {/* Hero badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-xl)",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 24,
            border: "1px solid var(--border-default)"
          }}
        >
          <Code2 size={14} style={{ color: "var(--accent-primary)" }} />
          Your developer identity, visualized
        </div>

        <h1 style={{ fontSize: 40, marginBottom: 16, fontWeight: 700, lineHeight: 1.2 }}>
          See your GitHub profile<br />
          <span style={{
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            differently
          </span>
        </h1>

        <p className="text-secondary" style={{ fontSize: 17, marginBottom: 40, lineHeight: 1.7, maxWidth: 480 }}>
          Generate a shareable profile card with your language diversity,
          stats, and coding journey. Add it to your portfolio or README.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: 420,
            marginBottom: 32,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Github
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username"
              className="input"
              style={{ paddingLeft: 44, height: 48, fontSize: 15, borderRadius: "var(--radius-md)" }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 48,
              paddingLeft: 20,
              paddingRight: 20,
              fontSize: 15,
              borderRadius: "var(--radius-md)"
            }}
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span>Generate</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Features */}
        <div style={{
          display: "flex",
          gap: 24,
          marginBottom: 40,
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {[
            { icon: <Code2 size={16} />, label: "Language diversity" },
            { icon: <Share2 size={16} />, label: "Shareable cards" },
            { icon: <Sparkles size={16} />, label: "No login required" },
          ].map((feature) => (
            <div
              key={feature.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--text-muted)",
                fontSize: 14
              }}
            >
              <span style={{ color: "var(--accent-primary)" }}>{feature.icon}</span>
              {feature.label}
            </div>
          ))}
        </div>

        {/* Try these */}
        <div className="text-muted" style={{ fontSize: 13 }}>
          <p style={{ marginBottom: 10 }}>Try these profiles:</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {["torvalds", "gaearon", "sindresorhus"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setUsername(name);
                  router.push(`/dashboard/${name}`);
                }}
                className="btn"
                style={{ fontSize: 13, padding: "6px 14px" }}
              >
                @{name}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-default)",
          padding: "20px 0",
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <div className="container">
          <p>
            Built with Next.js • Data from{" "}
            <a
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-primary)" }}
            >
              GitHub REST API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
