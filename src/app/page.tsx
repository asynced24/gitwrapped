"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Github,
  Sparkles,
  BarChart3,
  Zap,
  Share2,
  ArrowRight,
  Star,
  GitFork,
  Activity,
} from "lucide-react";

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

  const features = [
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description: "Get comprehensive insights into your coding patterns, language usage, and contribution history.",
      color: "#8b5cf6",
    },
    {
      icon: Zap,
      title: "Real-time Stats",
      description: "See your GitHub activity come alive with beautiful visualizations and dynamic charts.",
      color: "#06b6d4",
    },
    {
      icon: Share2,
      title: "Shareable Cards",
      description: "Generate stunning wrapped cards to share your GitHub journey with the world.",
      color: "#f472b6",
    },
  ];

  const stats = [
    { value: "50K+", label: "Developers" },
    { value: "1M+", label: "Repos Analyzed" },
    { value: "100%", label: "Free Forever" },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">GitWrapped</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <Github size={18} />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16 pb-12 px-4">
        <div className="container max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-white/70">Now with 2024 Wrapped cards!</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Your GitHub Story,{" "}
            <span className="gradient-text">Beautifully Wrapped</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-white/60 mb-10 max-w-2xl mx-auto"
          >
            Discover insights about your coding journey. Visualize your contributions,
            analyze your languages, and share your achievements with the world.
          </motion.p>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-12"
          >
            <div className="relative flex-1">
              <Github
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub username"
                className="input-glass pl-12 pr-4 w-full"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Get Wrapped</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.form>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-8 flex-wrap"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">understand your code</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Powerful analytics and beautiful visualizations to help you understand
              your GitHub activity like never before.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ background: `${feature.color}20` }}
                >
                  <feature.icon size={28} style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Insights that{" "}
                  <span className="gradient-text">tell your story</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: Activity, text: "Track your contribution streaks and patterns" },
                    { icon: Star, text: "See your most starred and forked repositories" },
                    { icon: GitFork, text: "Analyze language trends over time" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon size={20} className="text-purple-400" />
                      </div>
                      <span className="text-white/80">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mock Dashboard Preview */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-purple-400">1,247</div>
                    <div className="text-sm text-white/50">Total Commits</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-cyan-400">42</div>
                    <div className="text-sm text-white/50">Repositories</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-pink-400">89</div>
                    <div className="text-sm text-white/50">Day Streak</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-green-400">328</div>
                    <div className="text-sm text-white/50">Stars Earned</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to see your{" "}
              <span className="gradient-text">GitHub Wrapped</span>?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Enter your username and discover the story your code tells.
              It only takes a few seconds.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="btn-primary text-lg px-8 py-4"
            >
              Get Started Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-sm text-white/60">GitWrapped © 2024</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
