"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import Modal from "../shared/Modal";
import { loadData, addHabit, toggleHabitDay, deleteHabit, todayISO, type Habit } from "@/lib/aurum-store";

// Animation styles are defined inline with Tailwind classes

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#a78bfa", "#eab308", "#22d3ee", "#ec4899"];
const ICONS = ["🎯", "💪", "📖", "🧘", "🏃", "💧", "🍎", "😴", "✍️", "🎵"];

export default function HabitsPage() {
  const [tab, setTab] = useState("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [fName, setFName] = useState("");
  const [fIcon, setFIcon] = useState("🎯");
  const [fColor, setFColor] = useState("#22c55e");
  const [fFreq, setFFreq] = useState<Habit["frequency"]>("diário");

  const reload = useCallback(() => { setHabits(loadData().habits); }, []);
  useEffect(() => { reload(); }, [reload]);

  const today = todayISO();

  const handleCreate = () => {
    if (!fName.trim()) return;
    addHabit({ name: fName.trim(), icon: fIcon, color: fColor, frequency: fFreq });
    setShowModal(false); setFName(""); reload();
  };

  const handleToggle = (id: string) => { toggleHabitDay(id, today); reload(); };
  const handleDelete = (id: string) => { deleteHabit(id); reload(); };

  const totalHabits = habits.length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const prevBestStreak = habits.reduce((max, h) => h.bestStreak === bestStreak ? Math.max(max, h.streak) : max, 0);
  const justBeatRecord = habits.some(h => h.bestStreak === h.streak && h.streak > 0 && h.completedDates.includes(today));
  const doneToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const monthRate = totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

  // Motivational message based on streak
  const getMotivationalMessage = () => {
    if (bestStreak === 0) return "🌱 Comece agora, o sucesso vem do primeiro passo!";
    if (bestStreak < 7) return "🚀 Você está começando! Continue assim!";
    if (bestStreak < 30) return "🔥 Incrível! Seu hábito está se consolidando!";
    if (bestStreak < 100) return "💪 Parabéns! Você é uma máquina de hábitos!";
    return "👑 Lendário! Você conquistou uma sequência impressionante!";
  };

  const last7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last7.push(d.toISOString().slice(0, 10));
  }

  // Analysis data
  const analysisData = useMemo(() => {
    const last30: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      last30.push(d.toISOString().slice(0, 10));
    }

    // Per-habit completion rates
    const habitStats = habits.map((h) => {
      const completedIn30 = last30.filter((d) => h.completedDates.includes(d)).length;
      const rate = Math.round((completedIn30 / 30) * 100);
      return { ...h, completedIn30, rate };
    });

    // Daily completion rates for chart
    const dailyRates = last7.map((d) => {
      const date = new Date(d + "T12:00:00");
      const completed = habits.filter((h) => h.completedDates.includes(d)).length;
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
      return { day: date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3), rate, completed };
    });

    // Overall stats
    const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
    const avgStreak = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) : 0;

    return { habitStats, dailyRates, totalCompletions, avgStreak };
  }, [habits, last7, totalHabits]);

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <style>{`
        @keyframes celebrate {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.2) rotate(0deg); opacity: 0; }
        }
        .animate-celebrate {
          animation: celebrate 0.8s ease-out;
        }
      `}</style>
      <PageHeader icon="🎯" iconBg="#22c55e" title="Hábitos" subtitle="Construa hábitos saudáveis e acompanhe seu progresso diário"
        tabs={[{ id: "habits", label: "Hábitos" }, { id: "analysis", label: "Análise" }]} activeTab={tab} onTabChange={setTab} />

      <StatCards cards={[
        { icon: "🎯", label: "Total de Hábitos", value: totalHabits, color: "#22c55e" },
        { icon: "🔥", label: "Maior Sequência", value: `${bestStreak} dias`, color: "#f97316" },
        { icon: "✅", label: "Completos Hoje", value: `${doneToday}/${totalHabits}`, color: "#22c55e" },
        { icon: "📈", label: "Taxa do Dia", value: `${monthRate}%`, color: "#a78bfa" },
      ]} />

      {justBeatRecord && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-4xl animate-celebrate">🎉</span>
          </div>
          <div className="text-sm font-bold text-amber-300">Novo Recorde! Parabéns pela sequência!</div>
          <div className="text-xs text-amber-200/70">Você ultrapassou seu melhor desempenho anterior!</div>
        </div>
      )}

      {bestStreak > 0 && !justBeatRecord && (
        <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/8 px-4 py-3">
          <div className="text-sm font-medium">{getMotivationalMessage()}</div>
        </div>
      )}

      {/* ═══ HABITS TAB ═══ */}
      {tab === "habits" && (
        <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Meus Hábitos</div>
            <div className="text-xs text-white/40">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
          </div>

          {habits.length > 0 && (
            <div className="mb-2 grid items-center gap-2" style={{ gridTemplateColumns: "1fr repeat(7, 36px) 36px" }}>
              <div />
              {last7.map((d) => {
                const date = new Date(d + "T12:00:00");
                return (
                  <div key={d} className={`text-center text-[10px] ${d === today ? "font-medium text-amber-400" : "text-white/30"}`}>
                    {date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}
                  </div>
                );
              })}
              <div />
            </div>
          )}

          {habits.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">Nenhum hábito cadastrado. Clique no + para criar.</div>
          ) : (
            <div className="space-y-2">
              {habits.map((h) => (
                <div key={h.id} className="group grid items-center gap-2 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/10" style={{ gridTemplateColumns: "1fr repeat(7, 36px) 36px" }}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-lg">{h.icon}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{h.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40"><span className={h.streak > 0 ? "animate-pulse" : ""}>{h.streak > 0 ? "🔥" : "⭐"} {h.streak}</span><span>{h.frequency}</span></div>
                    </div>
                  </div>
                  {last7.map((d) => {
                    const done = h.completedDates.includes(d);
                    const isToday = d === today;
                    const heatIntensity = done ? 0.6 : 0.15;
                    return (
                      <button key={d} onClick={() => { if (isToday) handleToggle(h.id); }} disabled={!isToday}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all duration-300 ${
                          done ? "scale-100 text-white shadow-lg animate-check-complete" : isToday ? "border-2 border-dashed border-white/30 hover:border-white/60 hover:scale-105 hover:bg-white/5" : "border border-white/10 opacity-60"}`}
                        style={done ? { background: `${h.color}${Math.round(heatIntensity * 255).toString(16).padStart(2, '0')}`, color: h.color, boxShadow: `0 0 12px ${h.color}60` } : { background: `${h.color}${Math.round(0.08 * 255).toString(16).padStart(2, '0')}` }}>{done ? "✓" : ""}</button>
                    );
                  })}
                  <button onClick={() => handleDelete(h.id)}
                    className="mx-auto rounded p-1 text-xs text-white/20 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100">🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYSIS TAB ═══ */}
      {tab === "analysis" && (
        <div className="mt-6 space-y-4">
          {habits.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-sm text-white/40">Crie hábitos para ver análises aqui</div>
            </div>
          ) : (
            <>
              {/* Weekly chart */}
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold mb-4">Taxa de Conclusão — Últimos 7 Dias</div>
                <div className="flex items-end gap-3" style={{ height: 120 }}>
                  {analysisData.dailyRates.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-emerald-400">{d.rate}%</span>
                      <div className="w-full rounded-t bg-emerald-500/40 transition-all" style={{ height: `${d.rate}%`, minHeight: 2 }} />
                      <span className="text-[9px] text-white/30">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-habit stats */}
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold mb-4">Desempenho por Hábito (30 dias)</div>
                <div className="space-y-3">
                  {analysisData.habitStats.map((h) => (
                    <div key={h.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{h.icon}</span>
                          <span className="text-xs font-medium">{h.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/30">{h.completedIn30}/30</span>
                          <span style={{ color: h.color }}>{h.rate}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${h.rate}%`, background: h.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{analysisData.totalCompletions}</div>
                  <div className="text-[10px] text-white/40 mt-1">Total de Conclusões</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">{analysisData.avgStreak}</div>
                  <div className="text-[10px] text-white/40 mt-1">Sequência Média (dias)</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button onClick={() => { setFName(""); setFIcon("🎯"); setFColor("#22c55e"); setFFreq("diário"); setShowModal(true); }}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg shadow-green-500/20 hover:bg-green-400">+</button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Hábito">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Nome *</label>
            <input value={fName} onChange={(e) => setFName(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-green-500/50" placeholder="Ex: Meditar 10 minutos" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => setFIcon(ic)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${fIcon === ic ? "bg-white/15 ring-1 ring-white/30" : "bg-white/5 hover:bg-white/10"}`}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setFColor(c)}
                  className={`h-7 w-7 rounded-full transition-all ${fColor === c ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0d1117]" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Frequência</label>
            <select value={fFreq} onChange={(e) => setFFreq(e.target.value as Habit["frequency"])}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              <option value="diário">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleCreate} className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white hover:bg-green-400">Criar Hábito</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
