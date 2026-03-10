"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import MiniCalendar from "../shared/MiniCalendar";
import Modal from "../shared/Modal";
import {
  loadData,
  addTask,
  updateTask,
  deleteTask,
  todayISO,
  type Task,
} from "@/lib/aurum-store";

// Animation styles are defined inline with Tailwind classes

const PRIORITIES: { value: Task["priority"]; label: string; color: string }[] = [
  { value: "alta", label: "Alta", color: "#ef4444" },
  { value: "média", label: "Média", color: "#f97316" },
  { value: "baixa", label: "Baixa", color: "#22c55e" },
];

export default function TasksPage() {
  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"pendente" | "em_andamento" | "concluída" | "all">("all");
  const [sortBy, setSortBy] = useState<"prioridade" | "data">("prioridade");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fPriority, setFPriority] = useState<Task["priority"]>("média");
  const [fDueDate, setFDueDate] = useState("");
  const [fTags, setFTags] = useState("");

  const reload = useCallback(() => {
    setTasks(loadData().tasks);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const openCreate = () => {
    setEditingTask(null);
    setFTitle(""); setFDesc(""); setFPriority("média"); setFDueDate(""); setFTags("");
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setFTitle(t.title); setFDesc(t.description); setFPriority(t.priority);
    setFDueDate(t.dueDate ?? ""); setFTags(t.tags.join(", "));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!fTitle.trim()) return;
    const tags = fTags.split(",").map((s) => s.trim()).filter(Boolean);
    if (editingTask) {
      updateTask(editingTask.id, {
        title: fTitle.trim(), description: fDesc.trim(), priority: fPriority,
        dueDate: fDueDate || null, tags,
      });
    } else {
      addTask({
        title: fTitle.trim(), description: fDesc.trim(), priority: fPriority,
        status: "pendente", dueDate: fDueDate || null, tags,
      });
    }
    setShowModal(false);
    reload();
  };

  const handleToggleDone = (t: Task) => {
    updateTask(t.id, { status: t.status === "concluída" ? "pendente" : "concluída" });
    reload();
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    reload();
  };

  // Stats
  const today = todayISO();
  const total = tasks.length;
  const completedToday = tasks.filter((t) => t.completedAt?.startsWith(today)).length;
  const pending = tasks.filter((t) => t.status === "pendente").length;
  const overdue = tasks.filter((t) => t.status !== "concluída" && t.dueDate !== null && t.dueDate < today).length;

  // Filter + sort
  let displayed = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  if (sortBy === "prioridade") {
    const order: Record<string, number> = { alta: 0, média: 1, baixa: 2 };
    displayed = [...displayed].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
  } else {
    displayed = [...displayed].sort((a, b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""));
  }

  // Analysis data
  const analysis = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "concluída").length;
    const inProgress = tasks.filter((t) => t.status === "em_andamento").length;
    const byPriority = { alta: tasks.filter((t) => t.priority === "alta").length, média: tasks.filter((t) => t.priority === "média").length, baixa: tasks.filter((t) => t.priority === "baixa").length };
    const tagMap: Record<string, number> = {};
    tasks.forEach((t) => t.tags.forEach((tag) => { tagMap[tag] = (tagMap[tag] ?? 0) + 1; }));
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Last 7 days completion
    const last7: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
      const count = tasks.filter((t) => t.completedAt?.startsWith(iso)).length;
      last7.push({ day: label, count });
    }
    const maxCount = Math.max(...last7.map((d) => d.count), 1);

    return { completed, inProgress, byPriority, topTags, completionRate, last7, maxCount };
  }, [tasks, total]);

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <PageHeader icon="✅" iconBg="#3b82f6" title="Tarefas" subtitle="Organize e acompanhe suas tarefas"
        tabs={[{ id: "tasks", label: "Tarefas" }, { id: "recurring", label: "Recorrentes" }, { id: "analysis", label: "Análise" }]}
        activeTab={tab} onTabChange={setTab} />

      {/* ═══ TASKS TAB ═══ */}
      {tab === "tasks" && (
        <>
          {/* Status banner */}
          <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
            overdue > 0 ? "border-red-500/20 bg-red-500/8" : "border-emerald-500/20 bg-emerald-500/8"}`}>
            <span className="text-lg">{overdue > 0 ? "⚠️" : "⚡"}</span>
            <div>
              <div className="text-sm font-medium">{overdue > 0 ? `${overdue} tarefa(s) atrasada(s)!` : "Tudo em dia!"}</div>
              <div className="text-xs text-white/50">{overdue > 0 ? "Verifique suas tarefas pendentes" : "Nenhuma tarefa urgente no momento"}</div>
            </div>
          </div>

          <StatCards cards={[
            { icon: "📋", label: "Total", value: total, color: "#3b82f6" },
            { icon: "✅", label: "Concluídas Hoje", value: completedToday, color: "#22c55e" },
            { icon: "⏳", label: "Pendentes", value: pending, color: "#f97316" },
            { icon: "⚠️", label: "Atrasadas", value: overdue, color: "#ef4444" },
          ]} />

          {/* Filter bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/40">🏷 Filtrar:</span>
            {(["all", "pendente", "em_andamento", "concluída"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs transition-colors ${filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                {f === "all" ? "Todos" : f === "pendente" ? "Pendentes" : f === "em_andamento" ? "Em Andamento" : "Concluídas"}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-white/30">Ordenar:</span>
              <button onClick={() => setSortBy("prioridade")} className={`text-xs ${sortBy === "prioridade" ? "text-cyan-400" : "text-white/40"}`}>Prioridade</button>
              <button onClick={() => setSortBy("data")} className={`text-xs ${sortBy === "data" ? "text-cyan-400" : "text-white/40"}`}>Data</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <MiniCalendar accentColor="#3b82f6" />
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📋</span>
                  <span className="text-sm font-semibold">Lista de Tarefas</span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{displayed.length}</span>
              </div>
              {displayed.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">Progresso</span>
                    <span className="text-xs font-medium text-cyan-400">{analysis.completionRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${analysis.completionRate}%` }} />
                  </div>
                </div>
              )}
              {displayed.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/30">Nenhuma tarefa encontrada</div>
              ) : (
                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                  {displayed.map((t) => {
                    const priColor = PRIORITIES.find((p) => p.value === t.priority)?.color ?? "#fff";
                    return (
                      <div key={t.id} className="group flex items-start gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/10 hover:translate-x-1">
                        <button onClick={() => handleToggleDone(t)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${
                            t.status === "concluída" ? "scale-100 border-emerald-500 bg-emerald-500/30 text-emerald-300" : "border-white/20 hover:border-emerald-500/60 hover:scale-110"}`}>
                          {t.status === "concluída" && <span className="text-xs animate-check-pulse">✓</span>}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium ${t.status === "concluída" ? "text-white/40 line-through" : ""}`}>{t.title}</div>
                          {t.description && <div className="mt-0.5 truncate text-xs text-white/40">{t.description}</div>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex h-2 w-2 rounded-full animate-pulse" style={{ background: priColor }} />
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${priColor}20`, color: priColor }}>{t.priority}</span>
                            </div>
                            {t.dueDate && (
                              <span className={`text-[10px] ${t.dueDate < today && t.status !== "concluída" ? "text-red-400" : "text-white/30"}`}>
                                📅 {new Date(t.dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </span>
                            )}
                            {t.tags.map((tag) => (
                              <span key={tag} className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400/70">{tag}</span>
                            ))}
                            </div>
                          </div>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => openEdit(t)} className="rounded p-1 text-xs text-white/30 hover:bg-white/10 hover:text-white/60">✏️</button>
                          <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-xs text-white/30 hover:bg-red-500/20 hover:text-red-400">🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ RECURRING TAB ═══ */}
      {tab === "recurring" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/8 px-4 py-3">
            <span className="text-lg">🔄</span>
            <div>
              <div className="text-sm font-medium">Tarefas Recorrentes</div>
              <div className="text-xs text-white/50">Configure tarefas que se repetem automaticamente</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-sm font-medium text-white/60 mb-2">Tarefas Recorrentes</div>
            <div className="text-xs text-white/30 max-w-sm mx-auto mb-6">
              Em breve você poderá configurar tarefas que se repetem diariamente, semanalmente ou mensalmente.
              Use a integração n8n no Dashboard para automações avançadas.
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setTab("tasks")} className="rounded-lg bg-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/15">
                ← Voltar para Tarefas
              </button>
            </div>
          </div>

          {/* Show tasks with recurring tags as preview */}
          {tasks.filter((t) => t.tags.some((tag) => ["diário", "semanal", "mensal", "recorrente"].includes(tag.toLowerCase()))).length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs font-semibold mb-3 text-white/60">Tarefas com tags recorrentes</div>
              <div className="space-y-2">
                {tasks.filter((t) => t.tags.some((tag) => ["diário", "semanal", "mensal", "recorrente"].includes(tag.toLowerCase()))).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2">
                    <span className="text-sm">🔄</span>
                    <div className="flex-1 text-sm">{t.title}</div>
                    <div className="flex gap-1">
                      {t.tags.map((tag) => (
                        <span key={tag} className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYSIS TAB ═══ */}
      {tab === "analysis" && (
        <div className="space-y-4">
          <StatCards cards={[
            { icon: "📋", label: "Total", value: total, color: "#3b82f6" },
            { icon: "✅", label: "Concluídas", value: analysis.completed, color: "#22c55e" },
            { icon: "🔄", label: "Em Andamento", value: analysis.inProgress, color: "#f97316" },
            { icon: "📊", label: "Taxa Conclusão", value: `${analysis.completionRate}%`, color: "#a78bfa" },
          ]} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Completion chart - last 7 days */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Concluídas nos Últimos 7 Dias</div>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {analysis.last7.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-blue-500/50 transition-all" style={{ height: `${(d.count / analysis.maxCount) * 100}%`, minHeight: d.count > 0 ? 8 : 2 }} />
                    <span className="text-[9px] text-white/30">{d.day}</span>
                    <span className="text-[10px] font-medium text-white/50">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority distribution */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Distribuição por Prioridade</div>
              <div className="space-y-3">
                {(["alta", "média", "baixa"] as const).map((pri) => {
                  const count = analysis.byPriority[pri];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = { alta: "#ef4444", média: "#f97316", baixa: "#22c55e" };
                  return (
                    <div key={pri}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize" style={{ color: colors[pri] }}>{pri}</span>
                        <span className="text-xs text-white/40">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[pri] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top tags */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Top Tags</div>
              {analysis.topTags.length === 0 ? (
                <div className="py-4 text-center text-xs text-white/30">Nenhuma tag usada</div>
              ) : (
                <div className="space-y-2">
                  {analysis.topTags.map(([tag, count]) => (
                    <div key={tag} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                      <span className="text-xs text-cyan-400">#{tag}</span>
                      <span className="text-xs text-white/40">{count} tarefa(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue summary */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Tarefas Atrasadas</div>
              {overdue === 0 ? (
                <div className="py-4 text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-xs text-white/40">Nenhuma tarefa atrasada!</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.filter((t) => t.status !== "concluída" && t.dueDate !== null && t.dueDate < today).slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg bg-red-500/8 px-3 py-2">
                      <span className="text-xs">⚠️</span>
                      <span className="flex-1 text-xs">{t.title}</span>
                      <span className="text-[10px] text-red-400">{t.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={openCreate} className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-2xl text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400">+</button>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingTask ? "Editar Tarefa" : "Nova Tarefa"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título *</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-500/50" placeholder="Nome da tarefa" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Descrição</label>
            <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-500/50" placeholder="Detalhes..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Prioridade</label>
              <select value={fPriority} onChange={(e) => setFPriority(e.target.value as Task["priority"])}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Data Limite</label>
              <input type="date" value={fDueDate} onChange={(e) => setFDueDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Tags (vírgula)</label>
            <input value={fTags} onChange={(e) => setFTags(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" placeholder="trabalho, pessoal..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-400">
              {editingTask ? "Salvar" : "Criar Tarefa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
