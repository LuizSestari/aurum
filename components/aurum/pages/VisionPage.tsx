"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PageHeader from "../shared/PageHeader";
import { loadData, type Task, type Reminder, type Transaction } from "@/lib/aurum-store";
import { useAuth } from "@/lib/aurum-auth";
import { UpgradeModal } from "../UpgradeModal";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const QUOTES = [
  { text: "O segredo de ir em frente é começar.", author: "Mark Twain" },
  { text: "Disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Pequenos passos todo dia levam a grandes resultados.", author: "Anônimo" },
  { text: "Foco é dizer não a centenas de boas ideias.", author: "Steve Jobs" },
  { text: "A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor é agora.", author: "Provérbio chinês" },
];

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export default function VisionPage() {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState("calendar");
  const [filter, setFilter] = useState("agenda");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Vision AI Image Analysis State
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionQuestion, setVisionQuestion] = useState("");
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Check if visionAI feature is available
  const hasVisionBoardAccess = auth.canUseFeature("visionAI");

  // Vision AI handlers
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setVisionError("Por favor, selecione um arquivo de imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setVisionImage(base64);
      setVisionError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const executeActions = (text: string) => {
    const actionRegex = /:::action\s*\n([\s\S]*?)\n:::/g;
    const actions: Array<{ title: string; description: string }> = [];
    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      const lines = match[1].split("\n").filter((l) => l.trim());
      if (lines.length >= 2) {
        actions.push({
          title: lines[0].replace(/^[-*]\s*/, "").trim(),
          description: lines.slice(1).join(" ").trim(),
        });
      }
    }
    return { cleanText: text.replace(actionRegex, "").trim(), actions };
  };

  const handleVisionAnalysis = async () => {
    if (!visionImage) {
      setVisionError("Por favor, selecione uma imagem");
      return;
    }

    setVisionLoading(true);
    setVisionError(null);
    setVisionAnalysis(null);

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: visionImage,
          question: visionQuestion || "Analise esta imagem e descreva o que você vê. Sugira ações ou insights relevantes.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.statusText}`);
      }

      const data = await response.json();
      setVisionAnalysis(data.analysis || data.message || "Sem resposta");
    } catch (err) {
      setVisionError(err instanceof Error ? err.message : "Erro ao analisar imagem");
    } finally {
      setVisionLoading(false);
    }
  };

  const reload = useCallback(() => {
    const d = loadData();
    setTasks(d.tasks); setReminders(d.reminders); setTransactions(d.transactions);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Calculate daily quote based on day of year
  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  };
  const dailyQuote = QUOTES[getDayOfYear(today) % QUOTES.length];

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Events per day
  const dayEvents = useMemo(() => {
    const map: Record<number, { type: string; label: string; color: string }[]> = {};
    const addEvent = (day: number, type: string, label: string, color: string) => {
      if (!map[day]) map[day] = [];
      map[day].push({ type, label, color });
    };
    if (filter === "agenda" || filter === "all") {
      tasks.forEach((t) => {
        if (t.dueDate?.startsWith(monthStr)) {
          const d = parseInt(t.dueDate.slice(8, 10));
          addEvent(d, "task", t.title, t.status === "concluída" ? "#22c55e" : "#3b82f6");
        }
      });
      reminders.forEach((r) => {
        if (r.dateTime.startsWith(monthStr)) {
          const d = parseInt(r.dateTime.slice(8, 10));
          addEvent(d, "reminder", r.title, r.done ? "#6b7280" : "#eab308");
        }
      });
    }
    if (filter === "finance" || filter === "all") {
      transactions.forEach((t) => {
        if (t.date.startsWith(monthStr)) {
          const d = parseInt(t.date.slice(8, 10));
          addEvent(d, "finance", t.title, t.type === "receita" ? "#22c55e" : "#ef4444");
        }
      });
    }
    return map;
  }, [tasks, reminders, transactions, monthStr, filter]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const monthLabel = new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // ─── Timeline data ───
  const timelineEvents = useMemo(() => {
    const events: { time: string; title: string; type: string; color: string; done: boolean }[] = [];
    tasks.filter((t) => t.dueDate === todayISO).forEach((t) => {
      events.push({ time: "08:00", title: t.title, type: "Tarefa", color: "#3b82f6", done: t.status === "concluída" });
    });
    reminders.filter((r) => r.dateTime.startsWith(todayISO)).forEach((r) => {
      const time = r.dateTime.includes("T") ? r.dateTime.split("T")[1]?.slice(0, 5) ?? "09:00" : "09:00";
      events.push({ time, title: r.title, type: "Lembrete", color: "#eab308", done: r.done });
    });
    transactions.filter((t) => t.date === todayISO).forEach((t) => {
      events.push({ time: "12:00", title: t.title, type: t.type === "receita" ? "Receita" : "Despesa", color: t.type === "receita" ? "#22c55e" : "#ef4444", done: false });
    });
    return events.sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, reminders, transactions, todayISO]);

  // ─── Focus data ───
  const focusTasks = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== "concluída");
    const order: Record<string, number> = { alta: 0, média: 1, baixa: 2 };
    return [...pending].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1)).slice(0, 5);
  }, [tasks]);

  const upcomingReminders = useMemo(() => {
    return reminders.filter((r) => !r.done && r.dateTime >= todayISO).sort((a, b) => a.dateTime.localeCompare(b.dateTime)).slice(0, 5);
  }, [reminders, todayISO]);

  // ─── Kanban data ───
  const kanbanCols = useMemo(() => {
    const cols = [
      { id: "pendente", label: "Pendente", color: "#f97316", items: [] as Task[] },
      { id: "em_andamento", label: "Em Andamento", color: "#3b82f6", items: [] as Task[] },
      { id: "concluída", label: "Concluída", color: "#22c55e", items: [] as Task[] },
    ];
    tasks.forEach((t) => {
      const col = cols.find((c) => c.id === t.status);
      if (col) col.items.push(t);
    });
    return cols;
  }, [tasks]);

  // Show upgrade modal if feature is not available
  if (!hasVisionBoardAccess) {
    return (
      <div className="relative h-full w-full">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-md opacity-50 overflow-hidden pointer-events-none">
          <div className="h-full overflow-y-auto px-6 pb-10">
            <div className="mb-6 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-5 py-4">
              <div className="text-sm italic text-white/90">"Conteúdo bloqueado"</div>
              <div className="mt-2 text-xs text-white/50">— Faça upgrade para acessar</div>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <UpgradeModal
            isOpen={true}
            onClose={() => { window.history.back(); }}
            feature="Vision Board é um recurso Pro"
            requiredPlan="pro"
            onUpgrade={() => {
              console.log("Upgrade to Pro or Max plan");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-10">
      <div className="mb-6 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-5 py-4">
        <div className="text-sm italic text-white/90">"{dailyQuote.text}"</div>
        <div className="mt-2 text-xs text-white/50">— {dailyQuote.author}</div>
      </div>

      {/* ═══ VISION AI IMAGE ANALYSIS SECTION ═══ */}
      <div className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-blue-500/5 to-transparent p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="text-lg font-bold text-white">Vision AI Analysis</h2>
        </div>

        <div className="space-y-4">
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-amber-400 bg-amber-500/20"
                : "border-amber-500/30 bg-white/[0.02] hover:border-amber-400/50 hover:bg-amber-500/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />

            {visionImage ? (
              <div className="p-4">
                <div className="relative mb-4 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  <img
                    src={visionImage}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
                  >
                    Trocar Imagem
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVisionImage(null);
                      setVisionAnalysis(null);
                      setVisionQuestion("");
                      setVisionError(null);
                    }}
                    className="flex-1 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="text-3xl mb-3">📸</div>
                <div className="text-sm font-medium text-white/80 mb-1">
                  Solte a imagem aqui ou clique para selecionar
                </div>
                <div className="text-xs text-white/40">
                  Suporta PNG, JPG, GIF, WebP
                </div>
              </div>
            )}
          </div>

          {/* Question Input */}
          {visionImage && (
            <textarea
              value={visionQuestion}
              onChange={(e) => setVisionQuestion(e.target.value)}
              placeholder="Pergunta opcional sobre a imagem (deixe em branco para análise geral)..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors hover:border-white/20 focus:border-amber-400/50 focus:bg-white/[0.05]"
              rows={3}
            />
          )}

          {/* Error Message */}
          {visionError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {visionError}
            </div>
          )}

          {/* Analysis Result */}
          {visionAnalysis && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h3 className="text-sm font-semibold text-emerald-300">Análise Concluída</h3>
              </div>
              <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                {executeActions(visionAnalysis).cleanText}
              </div>
              {executeActions(visionAnalysis).actions.length > 0 && (
                <div className="mt-4 space-y-2 pt-4 border-t border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-300">Ações Sugeridas:</div>
                  {executeActions(visionAnalysis).actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const actionText = `${action.title}: ${action.description}`;
                        navigator.clipboard.writeText(actionText);
                      }}
                      className="block w-full text-left rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs hover:bg-emerald-500/20 transition-colors text-emerald-200"
                    >
                      <div className="font-medium">{action.title}</div>
                      <div className="mt-1 text-white/60">{action.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Button */}
          {visionImage && (
            <button
              onClick={handleVisionAnalysis}
              disabled={visionLoading}
              className={`w-full rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
                visionLoading
                  ? "bg-amber-500/20 text-amber-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500/30 to-blue-500/20 text-amber-200 hover:from-amber-500/40 hover:to-blue-500/30 hover:shadow-lg hover:shadow-amber-500/20"
              }`}
            >
              {visionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                  Analisando...
                </span>
              ) : (
                "Analisar Imagem com IA 🚀"
              )}
            </button>
          )}
        </div>
      </div>

      <PageHeader icon="👁" iconBg="#7c3aed" title="Visão Aurum" subtitle="Panorama completo da sua vida em um só lugar"
        tabs={[
          { id: "calendar", label: "📅 Calendário" }, { id: "timeline", label: "⏰ Timeline" },
          { id: "focus", label: "🎯 Foco" }, { id: "kanban", label: "📋 Kanban" },
        ]}
        activeTab={view} onTabChange={setView} />

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold capitalize">{monthLabel}</span>
              {(["agenda", "finance", "projections", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                  {f === "agenda" ? "📅 Agenda" : f === "finance" ? "💲 Finanças" : f === "projections" ? "📊 Projeções" : "🔗 Todos"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">‹</button>
              <button onClick={goToday} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">Hoje</button>
              <button onClick={nextMonth} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">›</button>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-white/6">
              {DAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-xs font-medium text-white/40">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((day, i) => {
                const isToday = isCurrentMonth && day === todayDate;
                const events = day ? dayEvents[day] ?? [] : [];
                return (
                  <div key={i} className={`min-h-[90px] border-b border-r border-white/[0.04] p-1.5 transition-colors ${day ? "hover:bg-white/[0.03]" : "bg-white/[0.01]"}`}>
                    {day && (
                      <>
                        <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday ? "bg-purple-500 font-bold text-white" : "text-white/60"}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev, j) => (
                            <div key={j} className="truncate rounded px-1 py-0.5 text-[9px] leading-tight" style={{ background: `${ev.color}15`, color: ev.color }}>
                              {ev.label}
                            </div>
                          ))}
                          {events.length > 3 && (
                            <div className="text-[9px] text-white/30">+{events.length - 3} mais</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ TIMELINE VIEW ═══ */}
      {view === "timeline" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">📅</span>
            <span className="font-semibold">Hoje — {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
              <div className="text-3xl mb-3">🌤️</div>
              <div className="text-sm text-white/40">Nenhum evento para hoje</div>
              <div className="text-xs text-white/25 mt-1">Adicione tarefas ou lembretes para vê-los aqui</div>
            </div>
          ) : (
            <div className="relative ml-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
              {timelineEvents.map((ev, i) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                  <div className={`absolute left-0 top-1 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-[#0d1117] ${ev.done ? "bg-emerald-500" : ""}`}
                    style={!ev.done ? { background: ev.color } : {}} />
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white/50">{ev.time}</span>
                      <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: `${ev.color}20`, color: ev.color }}>{ev.type}</span>
                    </div>
                    <div className={`text-sm font-medium ${ev.done ? "text-white/40 line-through" : ""}`}>{ev.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ FOCUS VIEW ═══ */}
      {view === "focus" && (
        <div className="space-y-6">
          {/* Priority tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold">Tarefas Prioritárias</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{focusTasks.length}</span>
            </div>
            {focusTasks.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] py-10 text-center text-xs text-white/30">
                Nenhuma tarefa pendente — parabéns! 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {focusTasks.map((t, i) => {
                  const priColors: Record<string, string> = { alta: "#ef4444", média: "#f97316", baixa: "#22c55e" };
                  const priColor = priColors[t.priority] ?? "#6b7280";
                  return (
                    <div key={t.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `${priColor}20`, color: priColor }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span className="rounded px-1 py-0.5" style={{ background: `${priColor}15`, color: priColor }}>{t.priority}</span>
                          {t.dueDate && <span>📅 {new Date(t.dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming reminders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⏰</span>
              <span className="text-sm font-semibold">Próximos Lembretes</span>
            </div>
            {upcomingReminders.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] py-8 text-center text-xs text-white/30">Nenhum lembrete pendente</div>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 hover:bg-white/[0.05] transition-colors">
                    <span className="text-lg">🔔</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-[10px] text-white/40">
                        {new Date(r.dateTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{tasks.filter((t) => t.status !== "concluída").length}</div>
              <div className="text-[10px] text-white/40 mt-1">Tarefas Pendentes</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{reminders.filter((r) => !r.done).length}</div>
              <div className="text-[10px] text-white/40 mt-1">Lembretes Ativos</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{tasks.filter((t) => t.status === "concluída").length}</div>
              <div className="text-[10px] text-white/40 mt-1">Concluídas</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {view === "kanban" && (
        <div className="grid grid-cols-3 gap-4">
          {kanbanCols.map((col) => (
            <div key={col.id} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden flex flex-col h-[600px]">
              <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: `3px solid ${col.color}`, background: `${col.color}08` }}>
                <span className="text-sm font-bold" style={{ color: col.color }}>{col.label}</span>
                <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${col.color}30`, color: col.color }}>{col.items.length}</span>
              </div>
              <div className="space-y-2 p-3 flex-1 overflow-y-auto">
                {col.items.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-white/20">Vazio</div>
                ) : (
                  col.items.map((t) => {
                    const priColors: Record<string, string> = { alta: "#ef4444", média: "#f97316", baixa: "#22c55e" };
                    const priColor = priColors[t.priority] ?? "#6b7280";
                    return (
                      <div key={t.id} className="rounded-lg border border-white/8 bg-white/[0.05] p-3 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-black/20">
                        <div className="text-xs font-medium mb-2">{t.title}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md px-2 py-0.5 text-[9px] font-medium" style={{ background: `${priColor}25`, color: priColor }}>{t.priority}</span>
                          {t.dueDate && (
                            <span className="text-[9px] text-white/40">
                              📅 {new Date(t.dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
