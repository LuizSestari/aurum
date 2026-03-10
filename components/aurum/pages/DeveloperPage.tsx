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
}

export default function DeveloperPage() {
  const auth = useAuth();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [memStats, setMemStats] = useState(getMemoryStats());
  const [aiStats, setAiStats] = useState(getAIStats());
  const [logs, setLogs] = useState(getInteractionLogs(30));
  const [activeTab, setActiveTab] = useState<"status" | "logs" | "memory" | "debug">("status");
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if apiAccess feature is available
  const hasAPIAccess = auth.canUseFeature("apiAccess");

  // Check provider status on mount
  useEffect(() => {
    checkProviders();
    fetchEnvStatus();
  }, []);

  async function fetchEnvStatus() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setEnvVars({
        GROQ_API_KEY: data.groqKey ? `...${String(data.groqKey).slice(-6)}` : "❌ não configurada",
        ANTHROPIC_API_KEY: data.anthropicKey ? `...${String(data.anthropicKey).slice(-6)}` : "❌ não configurada",
        GEMINI_API_KEY: data.geminiKey ? `...${String(data.geminiKey).slice(-6)}` : "❌ não configurada",
      });
    } catch {
      setEnvVars({ error: "Falha ao buscar config" });
    }
  }

  async function checkProviders() {
    const results: ProviderStatus[] = [];

    // Check Groq
    results.push({ name: "Groq (llama-3.3-70b)", status: "checking" });
    setProviders([...results]);
    try {
      const start = Date.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "ping", history: [] }),
      });
      const data = await res.json();
      const latency = Date.now() - start;
      results[results.length - 1] = {
        name: `${data.provider ?? "unknown"} (${data.model ?? "?"})`,
        status: res.ok ? "online" : "error",
        model: data.model,
        latency,
        error: data.error,
      };
    } catch (e) {
      results[results.length - 1] = {
        name: "API /chat",
        status: "offline",
        error: e instanceof Error ? e.message : "Erro",
      };
    }

    // Check Ollama
    results.push({ name: "Ollama (local)", status: "checking" });
    setProviders([...results]);
    try {
      const start = Date.now();
      const res = await fetch("http://localhost:11434/api/tags");
      const data = await res.json();
      const models = data.models?.map((m: { name: string }) => m.name) ?? [];
      results[results.length - 1] = {
        name: "Ollama (local)",
        status: models.length > 0 ? "online" : "error",
        model: models.join(", ") || "sem modelos",
        latency: Date.now() - start,
      };
    } catch {
      results[results.length - 1] = {
        name: "Ollama (local)",
        status: "offline",
        error: "Não acessível",
      };
    }

    setProviders(results);
  }

  function refreshAll() {
    setMemStats(getMemoryStats());
    setAiStats(getAIStats());
    setLogs(getInteractionLogs(30));
    checkProviders();
  }

  function handleClearMemory() {
    if (confirm("Limpar toda a memória de conversas? Isso não pode ser desfeito.")) {
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
    { id: "memory" as const, label: "Memória", icon: "🧠" },
    { id: "debug" as const, label: "Debug", icon: "🔧" },
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
            onClose={() => {}}
            feature="API é um recurso Max"
            requiredPlan="max"
            onUpgrade={() => {
              console.log("Upgrade to Max plan");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">🛠</span>
          <h1 className="text-sm font-semibold text-white/90">Developer Console</h1>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">ADMIN</span>
        </div>
        <button
          onClick={refreshAll}
          className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-white/60 hover:bg-white/12 hover:text-white/80 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/6 px-4 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "rounded-t-lg px-4 py-2 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-white/8 text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/40 hover:text-white/60 hover:bg-white/4",
            ].join(" ")}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "status" && (
          <div className="space-y-6">
            {/* Provider Status */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Provedores de IA</h2>
              <div className="space-y-2">
                {providers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/4 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span>{statusIcon(p.status)}</span>
                      <div>
                        <p className="text-sm text-white/80">{p.name}</p>
                        {p.model && <p className="text-xs text-white/40">{p.model}</p>}
                        {p.error && <p className="text-xs text-red-400/80">{p.error}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${statusColor(p.status)}`}>{p.status}</p>
                      {p.latency && <p className="text-xs text-white/30">{p.latency}ms</p>}
                    </div>
                  </div>
                ))}
                {providers.length === 0 && (
                  <p className="text-xs text-white/30">Verificando provedores...</p>
                )}
              </div>
            </section>

            {/* Environment Variables */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Variáveis de Ambiente</h2>
              <div className="rounded-lg bg-white/4 p-4 font-mono text-xs">
                {Object.entries(envVars).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-cyan-400/80">{key}</span>
                    <span className="text-white/50">{val}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Stats */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Estatísticas de IA</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Requisições", value: aiStats.total, color: "text-cyan-400" },
                  { label: "Erros", value: aiStats.errors, color: "text-red-400" },
                  { label: "Cache Hit", value: aiStats.cached, color: "text-green-400" },
                  { label: "Latência Média", value: `${aiStats.avgDuration}ms`, color: "text-yellow-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white/4 p-3 text-center">
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-2">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Interaction Logs (últimos 30)</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-white/30">Nenhum log ainda</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 rounded bg-white/4 px-3 py-2 font-mono text-[11px]">
                    <span className="text-white/30">{new Date(log.timestamp).toLocaleTimeString("pt-BR")}</span>
                    <span className={log.error ? "text-red-400" : "text-green-400"}>
                      {log.error ? "ERR" : "OK"}
                    </span>
                    <span className="text-cyan-400/80">{log.provider}</span>
                    <span className="text-white/40">{log.model}</span>
                    <span className="text-white/30">{log.durationMs}ms</span>
                    <span className="text-white/20">{log.inputLength}→{log.outputLength} chars</span>
                    {log.cached && <span className="text-yellow-400/60">CACHED</span>}
                    {log.error && <span className="ml-auto text-red-400/60 truncate max-w-[200px]">{log.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "memory" && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Memory Stats</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mensagens", value: memStats.totalMessages },
                  { label: "Notas", value: memStats.totalNotes },
                  { label: "Interações", value: memStats.totalInteractions },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-white/4 p-3 text-center">
                    <p className="text-lg font-bold text-cyan-400">{s.value}</p>
                    <p className="text-[10px] text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Categorias</h2>
              <div className="flex flex-wrap gap-2">
                {memStats.categories.map((cat) => (
                  <span key={cat} className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/60">{cat}</span>
                ))}
                {memStats.categories.length === 0 && <span className="text-xs text-white/30">Nenhuma</span>}
              </div>
            </section>

            <section className="flex gap-3">
              <button
                onClick={handleExportMemory}
                className="rounded-lg bg-cyan-500/20 px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/30 transition-all"
              >
                📥 Exportar Memória (.md)
              </button>
              <button
                onClick={handleClearMemory}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑 Limpar Conversas
              </button>
            </section>
          </div>
        )}

        {activeTab === "debug" && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">AI Config (runtime)</h2>
              <pre className="rounded-lg bg-white/4 p-4 font-mono text-[11px] text-white/60 overflow-x-auto">
                {JSON.stringify(getAIConfig(), null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Local Storage</h2>
              <div className="rounded-lg bg-white/4 p-4 font-mono text-[11px] text-white/60">
                {typeof window !== "undefined" && (
                  <div className="space-y-1">
                    <p>aurum_memory: {(localStorage.getItem("aurum_memory") ?? "").length} bytes</p>
                    <p>aurum_ai_config: {(localStorage.getItem("aurum_ai_config") ?? "").length} bytes</p>
                    <p>aurum_feedback: {(localStorage.getItem("aurum_feedback") ?? "").length} bytes</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Quick Test</h2>
              <button
                onClick={async () => {
                  const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: "Responda apenas: OK, funcionando." }),
                  });
                  const data = await res.json();
                  alert(`${data.provider}: ${data.reply ?? data.error}`);
                  refreshAll();
                }}
                className="rounded-lg bg-green-500/20 px-4 py-2 text-xs text-green-400 hover:bg-green-500/30 transition-all"
              >
                🧪 Testar API /chat
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
