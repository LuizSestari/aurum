"use client";

import { useState, useEffect } from "react";
import { getAIConfig, getAIStats, getInteractionLogs } from "@/lib/aurum-ai";
import { getMemoryStats, loadMemory, clearConversations, exportToMarkdown } from "@/lib/aurum-memory";
import { useAuth } from "@/lib/aurum-auth";
import { UpgradeModal } from "../UpgradeModal";

interface ProviderStatus {
  name: string;
  status: "checking" | "online" | "offline" | "error";
  model?: string;
  latency?: number;
  error?: string;
  details?: string;
}

interface LatencyRecord {
  timestamp: number;
  endpoint: string;
  latency: number;
  status: "success" | "error";
}

interface APITestResult {
  endpoint: string;
  provider?: string;
  latency: number;
  status: number | "error";
  responseTime: string;
  responseBody: Record<string, unknown>;
  error?: string;
}

type TabId = "status" | "logs" | "memory" | "debug" | "api-playground" | "vision-test";

export default function DeveloperPage() {
  const auth = useAuth();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [memStats, setMemStats] = useState(getMemoryStats());
  const [aiStats, setAiStats] = useState(getAIStats());
  const [logs, setLogs] = useState(getInteractionLogs(30));
  const [activeTab, setActiveTab] = useState<TabId>("status");
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [latencyHistory, setLatencyHistory] = useState<LatencyRecord[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // API Playground state
  const [chatTestMessage, setChatTestMessage] = useState("Hello, how are you?");
  const [chatTestLoading, setChatTestLoading] = useState(false);
  const [chatTestResult, setChatTestResult] = useState<APITestResult | null>(null);

  const [ttsTestText, setTtsTestText] = useState("Hello, this is a test of text-to-speech.");
  const [ttsTestLoading, setTtsTestLoading] = useState(false);
  const [ttsTestResult, setTtsTestResult] = useState<APITestResult | null>(null);

  const [visionTestImage, setVisionTestImage] = useState<string | null>(null);
  const [visionTestPrompt, setVisionTestPrompt] = useState("Describe what you see in this image.");
  const [visionTestLoading, setVisionTestLoading] = useState(false);
  const [visionTestResult, setVisionTestResult] = useState<APITestResult | null>(null);

  // Debug state
  const [storageStats, setStorageStats] = useState<Record<string, number>>({});
  const [browserInfo, setBrowserInfo] = useState<Record<string, string>>({});

  // Check if apiAccess feature is available
  const hasAPIAccess = auth.canUseFeature("apiAccess");

  // Check provider status and initialize on mount
  useEffect(() => {
    checkProviders();
    fetchEnvStatus();
    updateStorageStats();
    updateBrowserInfo();
  }, []);

  function updateStorageStats() {
    if (typeof window === "undefined") return;
    const stats: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) ?? "";
        stats[key] = new Blob([value]).size;
      }
    }
    setStorageStats(stats);
  }

  function updateBrowserInfo() {
    if (typeof window === "undefined") return;
    setBrowserInfo({
      "User Agent": navigator.userAgent.substring(0, 50) + "...",
      "Language": navigator.language,
      "Platform": navigator.platform,
      "Memory (MB)": ((navigator as any).deviceMemory || "N/A").toString(),
      "Hardware Concurrency": (navigator.hardwareConcurrency || "N/A").toString(),
      "Online": navigator.onLine ? "Yes" : "No",
      "PWA": "serviceWorker" in navigator ? "Supported" : "Not supported",
    });
  }

  async function fetchEnvStatus() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setEnvVars({
        GROQ_API_KEY: data.groqKey ? `...${String(data.groqKey).slice(-6)}` : "❌ Not configured",
        ANTHROPIC_API_KEY: data.anthropicKey ? `...${String(data.anthropicKey).slice(-6)}` : "❌ Not configured",
        GEMINI_API_KEY: data.geminiKey ? `...${String(data.geminiKey).slice(-6)}` : "❌ Not configured",
        ELEVENLABS_API_KEY: data.elevenLabsKey ? `...${String(data.elevenLabsKey).slice(-6)}` : "❌ Not configured",
      });
    } catch {
      setEnvVars({ error: "Failed to fetch config" });
    }
  }

  async function checkServiceStatus(name: string, endpoint: string, method: string = "GET", body?: Record<string, unknown>): Promise<ProviderStatus> {
    try {
      const start = Date.now();
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const latency = Date.now() - start;
      const data = await res.json();

      return {
        name,
        status: res.ok ? "online" as const : "error" as const,
        latency,
        details: data.provider || data.model || data.message || "OK",
        error: data.error,
      };
    } catch (e) {
      return {
        name,
        status: "offline" as const,
        latency: Date.now(),
        error: e instanceof Error ? e.message : "Connection failed",
      };
    }
  }

  async function checkProviders() {
    const results: ProviderStatus[] = [];

    // Check /api/chat
    results.push({ name: "Chat API (/api/chat)", status: "checking" });
    setProviders([...results]);
    const chatStatus = await checkServiceStatus("Chat API", "/api/chat", "POST", { message: "ping", history: [] });
    results[results.length - 1] = chatStatus;
    setProviders([...results]);

    // Check /api/tts
    results.push({ name: "TTS (ElevenLabs)", status: "checking" });
    setProviders([...results]);
    const ttsStatus = await checkServiceStatus("TTS", "/api/tts", "POST", { text: "test" });
    results[results.length - 1] = ttsStatus;
    setProviders([...results]);

    // Check /api/vision
    results.push({ name: "Vision (Gemini)", status: "checking" });
    setProviders([...results]);
    const visionStatus = await checkServiceStatus("Vision", "/api/vision", "POST", { imageUrl: "https://via.placeholder.com/100", prompt: "test" });
    results[results.length - 1] = visionStatus;
    setProviders([...results]);

    // Check Ollama local
    results.push({ name: "Ollama (Local)", status: "checking" });
    setProviders([...results]);
    try {
      const start = Date.now();
      const res = await fetch("http://localhost:11434/api/tags");
      const data = await res.json();
      const models = data.models?.map((m: { name: string }) => m.name) ?? [];
      results[results.length - 1] = {
        name: "Ollama (Local)",
        status: models.length > 0 ? "online" : "error",
        latency: Date.now() - start,
        details: models.join(", ") || "No models",
      };
    } catch {
      results[results.length - 1] = {
        name: "Ollama (Local)",
        status: "offline",
        error: "Not accessible",
      };
    }

    setProviders(results);
  }

  async function testChatAPI() {
    setChatTestLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatTestMessage, history: [] }),
      });
      const data = await res.json();
      const latency = Date.now() - start;

      setChatTestResult({
        endpoint: "/api/chat",
        provider: data.provider,
        latency,
        status: res.status,
        responseTime: `${latency}ms`,
        responseBody: data,
      });

      // Add to latency history
      setLatencyHistory(prev => [...prev.slice(-9), { timestamp: Date.now(), endpoint: "/api/chat", latency, status: res.ok ? "success" : "error" }]);
    } catch (e) {
      setChatTestResult({
        endpoint: "/api/chat",
        latency: Date.now() - start,
        status: "error",
        responseTime: `${Date.now() - start}ms`,
        responseBody: {},
        error: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setChatTestLoading(false);
    }
  }

  async function testTTSAPI() {
    setTtsTestLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsTestText }),
      });
      const data = await res.json();
      const latency = Date.now() - start;

      setTtsTestResult({
        endpoint: "/api/tts",
        provider: data.provider,
        latency,
        status: res.status,
        responseTime: `${latency}ms`,
        responseBody: data,
      });

      setLatencyHistory(prev => [...prev.slice(-9), { timestamp: Date.now(), endpoint: "/api/tts", latency, status: res.ok ? "success" : "error" }]);
    } catch (e) {
      setTtsTestResult({
        endpoint: "/api/tts",
        latency: Date.now() - start,
        status: "error",
        responseTime: `${Date.now() - start}ms`,
        responseBody: {},
        error: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setTtsTestLoading(false);
    }
  }

  async function testVisionAPI() {
    if (!visionTestImage) {
      alert("Please upload an image first");
      return;
    }

    setVisionTestLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: visionTestImage, prompt: visionTestPrompt }),
      });
      const data = await res.json();
      const latency = Date.now() - start;

      setVisionTestResult({
        endpoint: "/api/vision",
        provider: data.provider,
        latency,
        status: res.status,
        responseTime: `${latency}ms`,
        responseBody: data,
      });

      setLatencyHistory(prev => [...prev.slice(-9), { timestamp: Date.now(), endpoint: "/api/vision", latency, status: res.ok ? "success" : "error" }]);
    } catch (e) {
      setVisionTestResult({
        endpoint: "/api/vision",
        latency: Date.now() - start,
        status: "error",
        responseTime: `${Date.now() - start}ms`,
        responseBody: {},
        error: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setVisionTestLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setVisionTestImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function clearStorageKey(key: string) {
    if (confirm(`Clear "${key}"?`)) {
      localStorage.removeItem(key);
      updateStorageStats();
    }
  }

  function refreshAll() {
    setMemStats(getMemoryStats());
    setAiStats(getAIStats());
    setLogs(getInteractionLogs(30));
    checkProviders();
    updateStorageStats();
  }

  function handleClearMemory() {
    if (confirm("Clear all conversation memory? This cannot be undone.")) {
      clearConversations();
      setMemStats(getMemoryStats());
    }
  }

  function handleExportMemory() {
    const md = exportToMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurum-memory-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor = (s: ProviderStatus["status"]) =>
    s === "online" ? "text-green-400" : s === "offline" ? "text-red-400" : s === "checking" ? "text-yellow-400" : "text-orange-400";

  const statusIcon = (s: ProviderStatus["status"]) =>
    s === "online" ? "🟢" : s === "offline" ? "🔴" : s === "checking" ? "🟡" : "🟠";

  const tabs = [
    { id: "status" as const, label: "Status", icon: "📡" },
    { id: "logs" as const, label: "Logs", icon: "📋" },
    { id: "memory" as const, label: "Memory", icon: "🧠" },
    { id: "debug" as const, label: "Debug", icon: "🔧" },
    { id: "api-playground" as const, label: "API Playground", icon: "⚙️" },
    { id: "vision-test" as const, label: "Vision Test", icon: "👁️" },
  ];

  // Show upgrade modal if feature is not available
  if (!hasAPIAccess) {
    return (
      <div className="relative h-full w-full">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-md opacity-50 overflow-hidden pointer-events-none">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🛠</span>
                <h1 className="text-sm font-semibold text-white/90">Developer Console</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <UpgradeModal
            isOpen={true}
            onClose={() => { window.history.back(); }}
            feature="Developer Console is a Max feature"
            requiredPlan="max"
            onUpgrade={() => {
              console.log("Upgrade to Max plan");
            }}
          />
        </div>
      </div>
    );
  }

  // Helper function for latency chart
  const maxLatency = latencyHistory.length > 0 ? Math.max(...latencyHistory.map(l => l.latency)) : 100;
  const chartHeight = 40;

  return (
    <div className="flex h-full flex-col bg-[#0C0A09]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-4 backdrop-blur-xl bg-white/5">
        <div className="flex items-center gap-3">
          <span className="text-lg">🛠️</span>
          <h1 className="text-sm font-semibold text-white/90">Developer Console</h1>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">ADMIN</span>
        </div>
        <button
          onClick={refreshAll}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/30 hover:border-amber-500/50"
        >
          🔄 Refresh All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8 px-4 pt-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-medium transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? "bg-white/8 text-amber-400 border-b-amber-400"
                : "text-white/40 border-b-transparent hover:text-white/60 hover:bg-white/4"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "status" && (
          <div className="space-y-6">
            {/* Service Health */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Service Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.map((p, i) => (
                  <div key={i} className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-3 hover:bg-white/8 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusIcon(p.status)}</span>
                        <div>
                          <p className="text-sm font-medium text-white/90">{p.name}</p>
                          <p className={`text-xs font-semibold ${statusColor(p.status)}`}>{p.status.toUpperCase()}</p>
                        </div>
                      </div>
                      {p.latency && <span className="text-xs font-mono text-amber-400/80">{p.latency}ms</span>}
                    </div>
                    {p.details && <p className="text-xs text-white/40">{p.details}</p>}
                    {p.error && <p className="text-xs text-red-400/80">{p.error}</p>}
                  </div>
                ))}
              </div>
              {providers.length === 0 && <p className="text-xs text-white/30">Checking providers...</p>}
            </section>

            {/* Latency Chart */}
            {latencyHistory.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Recent Latency (Last 10)</h2>
                <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <div className="flex items-end gap-1 h-16 justify-between">
                    {latencyHistory.map((record, i) => {
                      const heightPercent = (record.latency / maxLatency) * 100;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-all ${
                            record.status === "success" ? "bg-amber-500/60 hover:bg-amber-500/80" : "bg-red-500/60 hover:bg-red-500/80"
                          }`}
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                          title={`${record.endpoint} - ${record.latency}ms`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-white/40 mt-2 font-mono">Max: {maxLatency}ms</p>
                </div>
              </section>
            )}

            {/* Environment Variables */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">API Keys Status</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4 space-y-2">
                {Object.entries(envVars).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                    <span className="text-xs text-white/60 font-mono">{key}</span>
                    <span className={`text-xs font-mono ${val.includes("...") ? "text-green-400/80" : "text-red-400/80"}`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Stats */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">AI Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Requests", value: aiStats.total, color: "from-amber-500/20 to-amber-600/10" },
                  { label: "Errors", value: aiStats.errors, color: "from-red-500/20 to-red-600/10" },
                  { label: "Cache Hits", value: aiStats.cached, color: "from-green-500/20 to-green-600/10" },
                  { label: "Avg Latency", value: `${aiStats.avgDuration}ms`, color: "from-yellow-500/20 to-yellow-600/10" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-lg bg-gradient-to-br ${stat.color} border border-white/10 backdrop-blur-xl p-4 text-center`}>
                    <p className="text-lg font-bold text-white/90">{stat.value}</p>
                    <p className="text-[10px] text-white/40 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Interaction Logs (Last 30)</h2>
              {logs.length === 0 ? (
                <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-8 text-center">
                  <p className="text-sm text-white/30">No logs yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-3 hover:bg-white/8 transition-all">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-mono text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${log.error ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                          {log.error ? "ERROR" : "SUCCESS"}
                        </span>
                        <span className="text-xs text-amber-400/80 font-mono">{log.provider}</span>
                        <span className="text-xs text-white/40">{log.model}</span>
                        <span className="text-xs text-indigo-400/80 font-mono">{log.durationMs}ms</span>
                        {log.cached && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">CACHED</span>}
                      </div>
                      <div className="text-xs text-white/30 font-mono">
                        {log.inputLength} → {log.outputLength} chars
                      </div>
                      {log.error && <p className="text-xs text-red-400/70 mt-2 truncate">{log.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "memory" && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Memory Statistics</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Messages", value: memStats.totalMessages, icon: "💬" },
                  { label: "Notes", value: memStats.totalNotes, icon: "📝" },
                  { label: "Interactions", value: memStats.totalInteractions, icon: "🔄" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 backdrop-blur-xl p-4 text-center">
                    <p className="text-2xl mb-2">{s.icon}</p>
                    <p className="text-xl font-bold text-white/90">{s.value}</p>
                    <p className="text-[10px] text-white/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Categories</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {memStats.categories.length > 0 ? (
                    memStats.categories.map((cat) => (
                      <span key={cat} className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs text-amber-400">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-white/30">No categories</span>
                  )}
                </div>
              </div>
            </section>

            <section className="flex gap-3 flex-wrap">
              <button
                onClick={handleExportMemory}
                className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-all"
              >
                📥 Export Memory (.md)
              </button>
              <button
                onClick={handleClearMemory}
                className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️ Clear Conversations
              </button>
            </section>
          </div>
        )}

        {activeTab === "debug" && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">AI Configuration</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4 overflow-x-auto">
                <pre className="font-mono text-[10px] text-white/60">{JSON.stringify(getAIConfig(), null, 2)}</pre>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Browser Information</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4 grid grid-cols-2 gap-3">
                {Object.entries(browserInfo).map(([key, val]) => (
                  <div key={key} className="border-b border-white/5 pb-2 last:border-b-0">
                    <p className="text-xs text-white/40 font-mono">{key}</p>
                    <p className="text-xs text-white/60 truncate">{val}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Local Storage</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-4 space-y-2">
                {Object.entries(storageStats).length > 0 ? (
                  Object.entries(storageStats).map(([key, bytes]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-xs text-white/60 font-mono">{key}</p>
                        <p className="text-[10px] text-white/30">{(bytes / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        onClick={() => clearStorageKey(key)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/30">No stored data</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Quick Actions</h2>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    updateStorageStats();
                    updateBrowserInfo();
                  }}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-all"
                >
                  🔄 Refresh Info
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "api-playground" && (
          <div className="space-y-8">
            {/* Chat API Test */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Test /api/chat</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Message</label>
                  <textarea
                    value={chatTestMessage}
                    onChange={(e) => setChatTestMessage(e.target.value)}
                    className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/10"
                    rows={3}
                  />
                </div>
                <button
                  onClick={testChatAPI}
                  disabled={chatTestLoading}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                >
                  {chatTestLoading ? "Testing..." : "🚀 Send Request"}
                </button>

                {chatTestResult && (
                  <div className="rounded-lg bg-white/8 border border-white/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white/60">Endpoint: {chatTestResult.endpoint}</span>
                      <span className="text-xs font-mono text-white/60">{chatTestResult.responseTime}</span>
                    </div>
                    {chatTestResult.provider && <p className="text-xs text-amber-400/80">Provider: {chatTestResult.provider}</p>}
                    {chatTestResult.error && <p className="text-xs text-red-400/80">Error: {chatTestResult.error}</p>}
                    <pre className="font-mono text-[10px] text-white/50 overflow-x-auto bg-black/30 p-3 rounded">
                      {JSON.stringify(chatTestResult.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </section>

            {/* TTS API Test */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Test /api/tts</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Text to Convert</label>
                  <textarea
                    value={ttsTestText}
                    onChange={(e) => setTtsTestText(e.target.value)}
                    className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/10"
                    rows={3}
                  />
                </div>
                <button
                  onClick={testTTSAPI}
                  disabled={ttsTestLoading}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                >
                  {ttsTestLoading ? "Testing..." : "🎵 Send Request"}
                </button>

                {ttsTestResult && (
                  <div className="rounded-lg bg-white/8 border border-white/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white/60">Endpoint: {ttsTestResult.endpoint}</span>
                      <span className="text-xs font-mono text-white/60">{ttsTestResult.responseTime}</span>
                    </div>
                    {ttsTestResult.provider && <p className="text-xs text-amber-400/80">Provider: {ttsTestResult.provider}</p>}
                    {ttsTestResult.error && <p className="text-xs text-red-400/80">Error: {ttsTestResult.error}</p>}
                    <pre className="font-mono text-[10px] text-white/50 overflow-x-auto bg-black/30 p-3 rounded">
                      {JSON.stringify(ttsTestResult.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "vision-test" && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Test /api/vision</h2>
              <div className="rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-3">Upload Image</label>
                  <div className="rounded-lg border-2 border-dashed border-white/20 p-6 text-center hover:border-amber-500/50 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="vision-image-input"
                    />
                    <label
                      htmlFor="vision-image-input"
                      className="cursor-pointer text-xs text-white/40 hover:text-white/60"
                    >
                      {visionTestImage ? "✓ Image loaded" : "📸 Click to upload or drag image"}
                    </label>
                  </div>
                  {visionTestImage && (
                    <div className="mt-4 relative">
                      <img src={visionTestImage} alt="Preview" className="max-h-64 rounded-lg mx-auto" />
                      <button
                        onClick={() => setVisionTestImage(null)}
                        className="mt-2 text-xs text-red-400/60 hover:text-red-400"
                      >
                        Clear Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Analysis Prompt</label>
                  <textarea
                    value={visionTestPrompt}
                    onChange={(e) => setVisionTestPrompt(e.target.value)}
                    className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/10"
                    rows={3}
                  />
                </div>

                <button
                  onClick={testVisionAPI}
                  disabled={visionTestLoading || !visionTestImage}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-all w-full"
                >
                  {visionTestLoading ? "Analyzing..." : "👁️ Analyze Image"}
                </button>

                {visionTestResult && (
                  <div className="rounded-lg bg-white/8 border border-white/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white/60">Endpoint: {visionTestResult.endpoint}</span>
                      <span className="text-xs font-mono text-white/60">{visionTestResult.responseTime}</span>
                    </div>
                    {visionTestResult.provider && <p className="text-xs text-amber-400/80">Provider: {visionTestResult.provider}</p>}
                    {visionTestResult.error && <p className="text-xs text-red-400/80">Error: {visionTestResult.error}</p>}
                    <pre className="font-mono text-[10px] text-white/50 overflow-x-auto bg-black/30 p-3 rounded max-h-64">
                      {JSON.stringify(visionTestResult.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
