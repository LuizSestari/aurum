"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrbState } from "@/lib/aurum-voice";
import { getMemoryStats, getRecentContext, exportToMarkdown } from "@/lib/aurum-memory";
import { getAIStats, getAIConfig, setAIConfig, type AIProvider } from "@/lib/aurum-ai";
import { getVoiceConfig, setVoiceConfig, getSupportedLanguages } from "@/lib/aurum-voice";
import {
  getAutomationLogs,
  getAutomationConfig,
  setAutomationConfig,
  checkN8nHealth,
  listWorkflows,
  getAurumWorkflowTemplates,
  installWorkflowTemplate,
  activateWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  generateReport,
  type N8nWorkflow,
} from "@/lib/aurum-automation";
import { loadData, todayISO, type Reminder, type Habit } from "@/lib/aurum-store";
import AurumOrb from "../shared/AurumOrb";

interface Props {
  orbState: OrbState;
  userName?: string;
}

const TIPS = [
  "Defina suas 3 prioridades do dia logo pela manhã.",
  "Use a técnica Pomodoro: 25min foco + 5min pausa.",
  "Revise seus hábitos semanalmente para manter o ritmo.",
  "Automatize tarefas repetitivas com os workflows n8n.",
  "Mantenha seu brain dump atualizado para não perder ideias.",
  "Celebre pequenas vitórias — cada hábito completado conta!",
  "Use o modo contínuo de voz para brainstorming rápido.",
];

export default function DashboardPage({ orbState, userName }: Props) {
  const [activeSection, setActiveSection] = useState<"overview" | "ai" | "voice" | "memory" | "automations">("overview");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"task" | "habit" | "reminder">("task");

  // Get time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Get random tip
  const getRandomTip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

  // AI config state
  const [aiProvider, setAiProvider] = useState<AIProvider>("local");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");

  // Voice config state
  const [voiceLang, setVoiceLang] = useState("pt-BR");
  const [voiceRate, setVoiceRate] = useState(1.0);

  // n8n state
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nKey, setN8nKey] = useState("");
  const [n8nConnected, setN8nConnected] = useState(false);
  const [n8nChecking, setN8nChecking] = useState(false);
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([]);
  const [n8nWorkflowCount, setN8nWorkflowCount] = useState(0);

  // Stats
  const [memStats, setMemStats] = useState({ totalMessages: 0, totalNotes: 0, totalInteractions: 0, firstUse: 0, lastUse: 0, categories: [] as string[] });
  const [aiStats, setAiStats] = useState({ total: 0, errors: 0, cached: 0, avgDuration: 0 });
  const [storeStats, setStoreStats] = useState({ tasks: 0, habits: 0, projects: 0, reminders: 0, transactions: 0, notebooks: 0 });

  const reload = useCallback(() => {
    setMemStats(getMemoryStats());
    setAiStats(getAIStats());
    const data = loadData();
    setStoreStats({
      tasks: data.tasks.length, habits: data.habits.length, projects: data.projects.length,
      reminders: data.reminders.length, transactions: data.transactions.length, notebooks: data.notebooks.length,
    });
    const cfg = getAIConfig();
    setAiProvider(cfg.provider);
    setAiApiKey(cfg.apiKey ?? "");
    setAiModel(cfg.model ?? "");
    const vc = getVoiceConfig();
    setVoiceLang(vc.language);
    setVoiceRate(vc.ttsRate);
    // n8n config — default to localhost if not set
    const ac = getAutomationConfig();
    setN8nUrl(ac.n8nBaseUrl || "http://localhost:5678");
    setN8nKey(ac.n8nApiKey || "");
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Check n8n connection on load — try even with just URL (no API key)
  useEffect(() => {
    const ac = getAutomationConfig();
    const url = ac.n8nBaseUrl || "http://localhost:5678";
    // Always try to connect if we have a URL
    if (url) {
      // Ensure config has the default URL if not set
      if (!ac.n8nBaseUrl) {
        setAutomationConfig({ n8nBaseUrl: url });
      }
      setN8nChecking(true);
      checkN8nHealth().then((h) => {
        setN8nConnected(h.connected);
        setN8nWorkflowCount(h.workflows ?? 0);
        setN8nChecking(false);
        if (h.connected) {
          listWorkflows().then(setN8nWorkflows);
        }
      });
    }
  }, []);

  const handleSaveAI = () => {
    setAIConfig({ provider: aiProvider, apiKey: aiApiKey || undefined, model: aiModel || undefined });
  };

  const handleSaveVoice = () => {
    setVoiceConfig({ language: voiceLang, ttsRate: voiceRate });
  };

  const handleSaveN8n = async () => {
    setAutomationConfig({ n8nBaseUrl: n8nUrl, n8nApiKey: n8nKey });
    setN8nChecking(true);
    const health = await checkN8nHealth();
    setN8nConnected(health.connected);
    setN8nWorkflowCount(health.workflows ?? 0);
    setN8nChecking(false);
    if (health.connected) {
      const wfs = await listWorkflows();
      setN8nWorkflows(wfs);
    }
  };

  const handleInstallTemplate = async (idx: number) => {
    const wf = await installWorkflowTemplate(idx);
    if (wf) {
      const wfs = await listWorkflows();
      setN8nWorkflows(wfs);
      setN8nWorkflowCount(wfs.length);
    }
  };

  const handleToggleWorkflow = async (wf: N8nWorkflow) => {
    if (wf.active) {
      await deactivateWorkflow(wf.id);
    } else {
      await activateWorkflow(wf.id);
    }
    const wfs = await listWorkflows();
    setN8nWorkflows(wfs);
  };

  const handleDeleteWorkflow = async (id: string) => {
    await deleteWorkflow(id);
    const wfs = await listWorkflows();
    setN8nWorkflows(wfs);
    setN8nWorkflowCount(wfs.length);
  };

  const handleExportMemory = () => {
    const md = exportToMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aurum-memory-${new Date().toISOString().slice(0, 10)}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    const md = await generateReport("daily");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aurum-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const sections = [
    { id: "overview" as const, label: "📊 Visão Geral" },
    { id: "ai" as const, label: "🤖 IA" },
    { id: "voice" as const, label: "🎙 Voz" },
    { id: "memory" as const, label: "🧠 Memória" },
    { id: "automations" as const, label: "⚡ Automações" },
  ];

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes countup {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-countup {
          animation: countup 0.6s ease-out;
        }
      `}</style>
      <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      {/* Welcome Banner */}
      <div className="mb-6 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full"><AurumOrb state={orbState} size={60} /></div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{getGreeting()}, {userName || "Usuário"}! 👋</div>
            <p className="text-sm text-white/60">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* Section tabs - Sticky */}
      <div className="sticky top-0 z-10 mb-6 -mx-6 -mt-6 flex gap-2 overflow-x-auto border-b border-white/10 bg-black/50 px-6 py-3 backdrop-blur-sm">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeSection === s.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Dica do dia */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-purple-300">Dica do dia</div>
                <p className="mt-1 text-sm text-white/70">{getRandomTip()}</p>
              </div>
            </div>
          </div>

          {/* n8n connection banner */}
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${
            n8nConnected ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
          }`}>
            <div className={`h-3 w-3 rounded-full animate-pulse-dot ${n8nConnected ? "bg-green-400" : "bg-yellow-400"}`} />
            <div className="flex-1">
              <div className="text-xs font-medium">{n8nConnected ? `n8n Conectado • ${n8nWorkflowCount} workflows` : "n8n Não Conectado"}</div>
              <div className="text-[10px] text-white/40">{n8nConnected ? n8nUrl : "Configure na aba Automações"}</div>
            </div>
            {!n8nConnected && (
              <button onClick={() => setActiveSection("automations")} className="rounded-lg bg-yellow-500/20 px-3 py-1 text-[10px] font-medium text-yellow-300">
                Configurar
              </button>
            )}
          </div>

          {/* Upcoming reminders in next 24h */}
          {(() => {
            const data = loadData();
            const now = new Date().toISOString();
            const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const upcoming = data.reminders.filter((r: Reminder) => !r.done && r.dateTime >= now && r.dateTime <= nextDay).slice(0, 3);
            if (upcoming.length === 0) return null;
            return (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔔</span>
                  <span className="text-sm font-semibold">Próximos Lembretes (24h)</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-300 ml-auto">{upcoming.length}</span>
                </div>
                <div className="space-y-2">
                  {upcoming.map((r: Reminder) => (
                    <div key={r.id} className="flex items-start gap-2 text-sm">
                      <span>📌</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white/80 truncate">{r.title}</div>
                        <div className="text-[10px] text-white/50">{new Date(r.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Today's habit completion progress */}
          {(() => {
            const data = loadData();
            const today = todayISO();
            const completedToday = data.habits.filter((h: Habit) => h.completedDates.includes(today)).length;
            const totalHabits = data.habits.length;
            const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
            if (totalHabits === 0) return null;
            return (
              <div className="rounded-xl border border-green-500/20 bg-green-500/8 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span className="text-sm font-semibold">Hábitos de Hoje</span>
                  </div>
                  <span className="text-sm font-bold text-green-400">{completedToday}/{totalHabits}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="text-xs text-white/50 mt-2">{completionRate}% concluído</div>
              </div>
            );
          })()}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Conversas", value: memStats.totalMessages, icon: "💬", color: "#22d3ee", gradientFrom: "from-cyan-500/15", gradientTo: "to-blue-500/5" },
              { label: "Interações", value: memStats.totalInteractions, icon: "🔄", color: "#a78bfa", gradientFrom: "from-purple-500/15", gradientTo: "to-pink-500/5" },
              { label: "Tarefas", value: storeStats.tasks, icon: "✅", color: "#3b82f6", gradientFrom: "from-blue-500/15", gradientTo: "to-cyan-500/5" },
              { label: "Hábitos", value: storeStats.habits, icon: "🎯", color: "#22c55e", gradientFrom: "from-green-500/15", gradientTo: "to-emerald-500/5" },
              { label: "Projetos", value: storeStats.projects, icon: "📁", color: "#f97316", gradientFrom: "from-orange-500/15", gradientTo: "to-red-500/5" },
              { label: "Lembretes", value: storeStats.reminders, icon: "🔔", color: "#eab308", gradientFrom: "from-yellow-500/15", gradientTo: "to-amber-500/5" },
              { label: "Transações", value: storeStats.transactions, icon: "💲", color: "#22c55e", gradientFrom: "from-green-500/15", gradientTo: "to-teal-500/5" },
              { label: "Cadernos", value: storeStats.notebooks, icon: "📚", color: "#06b6d4", gradientFrom: "from-cyan-500/15", gradientTo: "to-teal-500/5" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border border-white/8 bg-gradient-to-br ${s.gradientFrom} ${s.gradientTo} p-4`}>
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span className="text-xs text-white/50">{s.label}</span>
                </div>
                <div className="mt-2 animate-countup text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Orb status */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold">Status do Orb</div>
            <div className="flex items-center gap-4">
              <div className="relative h-[100px] w-[100px] overflow-hidden rounded-full"><AurumOrb state={orbState} size={100} /></div>
              <div className="space-y-2 text-xs">
                <div>Estado: <span className="font-medium text-cyan-400">{orbState}</span></div>
                <div>Provedor IA: <span className="font-medium">{aiProvider}</span></div>
                <div>Modelo: <span className="font-medium">{aiModel || "padrão"}</span></div>
                <div>Idioma: <span className="font-medium">{voiceLang}</span></div>
              </div>
            </div>
          </div>

          {/* Recent conversations */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold">Conversas Recentes</div>
            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {getRecentContext(10).length === 0 ? (
                <div className="text-xs text-white/30">Nenhuma conversa ainda.</div>
              ) : (
                getRecentContext(10).map((m, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className={m.role === "user" ? "text-cyan-400" : "text-purple-400"}>{m.role === "user" ? "Você:" : "Aurum:"}</span>
                    <span className="truncate text-white/60">{m.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Config */}
      {activeSection === "ai" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-4 text-sm font-semibold">Configuração de IA</div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-white/50">Provedor</label>
                <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                  <option value="local">Local (Demo)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">API Key</label>
                <input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  placeholder={aiProvider === "openai" ? "sk-..." : aiProvider === "anthropic" ? "sk-ant-..." : "Não necessário"} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Modelo</label>
                <input value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  placeholder={aiProvider === "openai" ? "gpt-4o-mini" : aiProvider === "anthropic" ? "claude-sonnet-4-20250514" : "local"} />
              </div>
              <button onClick={handleSaveAI} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-400">Salvar Configuração</button>
            </div>
          </div>

          {/* AI Stats */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold">Estatísticas de IA</div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center"><div className="text-lg font-bold text-cyan-400">{aiStats.total}</div><div className="text-[10px] text-white/40">Requisições</div></div>
              <div className="text-center"><div className="text-lg font-bold text-red-400">{aiStats.errors}</div><div className="text-[10px] text-white/40">Erros</div></div>
              <div className="text-center"><div className="text-lg font-bold text-green-400">{aiStats.cached}</div><div className="text-[10px] text-white/40">Cache Hit</div></div>
              <div className="text-center"><div className="text-lg font-bold text-purple-400">{aiStats.avgDuration}ms</div><div className="text-[10px] text-white/40">Latência Média</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Config */}
      {activeSection === "voice" && (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
          <div className="mb-4 text-sm font-semibold">Configuração de Voz</div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-white/50">Idioma</label>
              <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                {getSupportedLanguages().map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Velocidade da Fala: {voiceRate}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={voiceRate} onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full" />
            </div>
            <button onClick={handleSaveVoice} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-400">Salvar</button>
          </div>
        </div>
      )}

      {/* Memory */}
      {activeSection === "memory" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold">Memória do Aurum</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center"><div className="text-lg font-bold text-cyan-400">{memStats.totalMessages}</div><div className="text-[10px] text-white/40">Mensagens</div></div>
              <div className="text-center"><div className="text-lg font-bold text-purple-400">{memStats.totalNotes}</div><div className="text-[10px] text-white/40">Notas</div></div>
              <div className="text-center"><div className="text-lg font-bold text-green-400">{memStats.categories.length}</div><div className="text-[10px] text-white/40">Categorias</div></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportMemory} className="rounded-lg bg-purple-500/20 px-4 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/30">📤 Exportar Markdown</button>
          </div>
        </div>
      )}

      {/* Automations - Full n8n integration */}
      {activeSection === "automations" && (
        <div className="space-y-6">
          {/* n8n Connection Config */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-1 flex items-center gap-3">
              <div className="text-sm font-semibold">Conexão n8n</div>
              <div className={`h-2 w-2 rounded-full ${n8nConnected ? "bg-green-400" : n8nChecking ? "animate-pulse bg-yellow-400" : "bg-red-400"}`} />
              <span className="text-[10px] text-white/40">{n8nConnected ? "Conectado" : n8nChecking ? "Verificando..." : "Desconectado"}</span>
            </div>
            <p className="mb-4 text-[10px] text-white/30">Configure a URL e API Key do seu servidor n8n local</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/50">URL do n8n</label>
                <input value={n8nUrl} onChange={(e) => setN8nUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  placeholder="http://localhost:5678" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">API Key</label>
                <input type="password" value={n8nKey} onChange={(e) => setN8nKey(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  placeholder="eyJ..." />
              </div>
              <button onClick={handleSaveN8n}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-400 disabled:opacity-50"
                disabled={n8nChecking}>
                {n8nChecking ? "Verificando..." : "Conectar"}
              </button>
            </div>
          </div>

          {/* Workflows */}
          {n8nConnected && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Workflows ({n8nWorkflows.length})</div>
                <button onClick={() => listWorkflows().then(setN8nWorkflows)}
                  className="rounded-lg bg-white/5 px-3 py-1 text-[10px] text-white/50 hover:bg-white/10">
                  Atualizar
                </button>
              </div>
              {n8nWorkflows.length === 0 ? (
                <div className="py-4 text-center text-xs text-white/30">Nenhum workflow. Instale um template abaixo.</div>
              ) : (
                <div className="space-y-2">
                  {n8nWorkflows.map((wf) => (
                    <div key={wf.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className={`h-2 w-2 rounded-full ${wf.active ? "bg-green-400" : "bg-white/20"}`} />
                      <div className="flex-1">
                        <div className="text-xs font-medium">{wf.name}</div>
                        <div className="text-[10px] text-white/30">ID: {wf.id} • Atualizado: {new Date(wf.updatedAt).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <button onClick={() => handleToggleWorkflow(wf)}
                        className={`rounded px-2 py-1 text-[10px] font-medium ${wf.active ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}>
                        {wf.active ? "Pausar" : "Ativar"}
                      </button>
                      <button onClick={() => handleDeleteWorkflow(wf.id)}
                        className="rounded px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workflow Templates */}
          {n8nConnected && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold">Templates Aurum</div>
              <p className="mb-3 text-[10px] text-white/30">Workflows pré-prontos para automações do Aurum</p>
              <div className="space-y-2">
                {getAurumWorkflowTemplates().map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{t.name}</div>
                      <div className="text-[10px] text-white/30">{t.description}</div>
                    </div>
                    <button onClick={() => handleInstallTemplate(i)}
                      className="rounded-lg bg-cyan-500/20 px-3 py-1 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/30">
                      Instalar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleGenerateReport}
              className="rounded-lg bg-purple-500/20 px-4 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/30">
              📊 Gerar Relatório
            </button>
            {n8nConnected && (
              <a href={n8nUrl.replace("/api/v1", "") || "http://localhost:5678"} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-orange-500/20 px-4 py-2 text-xs font-medium text-orange-300 hover:bg-orange-500/30">
                🔗 Abrir n8n
              </a>
            )}
          </div>

          {/* Logs */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold">Logs de Automação</div>
            {getAutomationLogs(20).length === 0 ? (
              <div className="py-4 text-center text-xs text-white/30">Nenhuma automação executada ainda.</div>
            ) : (
              <div className="space-y-2">
                {getAutomationLogs(20).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <span className={log.status === "success" ? "text-green-400" : log.status === "error" ? "text-red-400" : "text-yellow-400"}>●</span>
                    <span className="text-white/40">[{log.action}]</span>
                    <span className="flex-1 text-white/60">{log.message}</span>
                    {log.duration && <span className="text-white/20">{log.duration}ms</span>}
                    <span className="text-white/20">{new Date(log.timestamp).toLocaleTimeString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Quick Add Floating Button */}
      {activeSection === "overview" && (
        <>
          <button onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-2xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
            +
          </button>

          {/* Quick Add Menu */}
          {showQuickAdd && (
            <div className="fixed bottom-24 right-6 z-20 flex flex-col gap-2">
              <button onClick={() => { setQuickAddType("task"); setShowQuickAdd(false); }}
                className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-xs text-blue-300 hover:bg-blue-500/30 transition-colors">
                <span>✅</span> Nova Tarefa
              </button>
              <button onClick={() => { setQuickAddType("habit"); setShowQuickAdd(false); }}
                className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-xs text-green-300 hover:bg-green-500/30 transition-colors">
                <span>🎯</span> Novo Hábito
              </button>
              <button onClick={() => { setQuickAddType("reminder"); setShowQuickAdd(false); }}
                className="flex items-center gap-2 rounded-lg bg-yellow-500/20 px-4 py-2 text-xs text-yellow-300 hover:bg-yellow-500/30 transition-colors">
                <span>🔔</span> Novo Lembrete
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
