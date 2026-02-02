"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, BookOpen, ArrowRight } from "lucide-react";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <nav className="nav">
        <div className="container nav-content">
          <div className="nav-brand">
            <BookOpen size={20} />
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
          maxWidth: 600,
        }}
      >
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          See your GitHub profile differently
        </h1>

        <p className="text-secondary" style={{ fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
          View your public GitHub stats as a clean dashboard or a story-style wrapped.
          No login required. Uses only public API data.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: 400,
            marginBottom: 32,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Github
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="GitHub username"
              className="input"
              style={{ paddingLeft: 40 }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span>View</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-muted" style={{ fontSize: 13 }}>
          <p style={{ marginBottom: 8 }}>Try these:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {["torvalds", "gaearon", "sindresorhus"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setUsername(name);
                  router.push(`/dashboard/${name}`);
                }}
                className="btn"
                style={{ fontSize: 13, padding: "4px 12px" }}
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
          padding: "16px 0",
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <div className="container">
          <p>
            Built with Next.js. Data from{" "}
            <a
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-primary)" }}
            >
              GitHub REST API
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
