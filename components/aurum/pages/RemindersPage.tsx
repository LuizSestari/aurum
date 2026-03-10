"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import MiniCalendar from "../shared/MiniCalendar";
import Modal from "../shared/Modal";
import { loadData, addReminder, updateReminder, deleteReminder, type Reminder } from "@/lib/aurum-store";

export default function RemindersPage() {
  const [tab, setTab] = useState("reminders");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editRem, setEditRem] = useState<Reminder | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDate, setFDate] = useState("");
  const [fTime, setFTime] = useState("09:00");
  const [fPriority, setFPriority] = useState<Reminder["priority"]>("média");
  const [fRecurring, setFRecurring] = useState<Reminder["recurring"]>("nunca");

  const reload = useCallback(() => { setReminders(loadData().reminders); }, []);
  useEffect(() => { reload(); }, [reload]);

  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);

  const openCreate = () => {
    setEditRem(null); setFTitle(""); setFDesc(""); setFDate(todayStr); setFTime("09:00"); setFPriority("média"); setFRecurring("nunca"); setShowModal(true);
  };
  const openEdit = (r: Reminder) => {
    setEditRem(r); setFTitle(r.title); setFDesc(r.description);
    setFDate(r.dateTime.slice(0, 10)); setFTime(r.dateTime.slice(11, 16));
    setFPriority(r.priority); setFRecurring(r.recurring); setShowModal(true);
  };
  const handleSave = () => {
    if (!fTitle.trim()) return;
    const dateTime = `${fDate}T${fTime}:00`;
    if (editRem) {
      updateReminder(editRem.id, { title: fTitle.trim(), description: fDesc.trim(), dateTime, priority: fPriority, recurring: fRecurring });
    } else {
      addReminder({ title: fTitle.trim(), description: fDesc.trim(), dateTime, priority: fPriority, recurring: fRecurring });
    }
    setShowModal(false); reload();
  };
  const handleToggle = (r: Reminder) => { updateReminder(r.id, { done: !r.done }); reload(); };
  const handleDelete = (id: string) => { deleteReminder(id); reload(); };

  const upcoming = reminders.filter((r) => !r.done && r.dateTime >= now).length;
  const todayCount = reminders.filter((r) => r.dateTime.startsWith(todayStr)).length;
  const expired = reminders.filter((r) => !r.done && r.dateTime < now).length;
  const history = reminders.filter((r) => r.done).length;

  const active = reminders.filter((r) => !r.done).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const done = reminders.filter((r) => r.done);
  const displayed = tab === "reminders" ? active : done;

  // Upcoming reminders within 24h
  const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const upcomingInDay = reminders.filter((r) => !r.done && r.dateTime >= now && r.dateTime <= nextDay).sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const priorityColor = (p: string) => p === "alta" ? "#ef4444" : p === "média" ? "#f97316" : "#22c55e";
  const getDateStatus = (dateTime: string) => {
    const isOverdue = dateTime < now;
    const isToday = dateTime.startsWith(todayStr);
    return { isOverdue, isToday };
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <PageHeader icon="🔔" iconBg="#eab308" title="Lembretes" subtitle="Nunca esqueça de nada importante"
        tabs={[{ id: "reminders", label: "Lembretes" }, { id: "done", label: "Concluídos" }, { id: "recurring", label: "Recorrentes" }]}
        activeTab={tab} onTabChange={setTab} />

      <StatCards cards={[
        { icon: "🔔", label: "Próximos", value: upcoming, color: "#eab308" },
        { icon: "📅", label: "Hoje", value: todayCount, color: "#3b82f6" },
        { icon: "❌", label: "Expirados", value: expired, color: "#ef4444" },
        { icon: "📜", label: "Histórico", value: history, color: "#6b7280" },
      ]} />

      {upcomingInDay.length > 0 && (
        <div className="mt-6 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-semibold text-white">Próximos Lembretes (próximas 24h)</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-yellow-500/30 text-yellow-300">{upcomingInDay.length}</span>
          </div>
          <div className="space-y-2">
            {upcomingInDay.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-lg border border-yellow-500/15 bg-yellow-500/5 px-3 py-2 hover:bg-yellow-500/10 transition-colors">
                <span className="text-lg">🔔</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{r.title}</div>
                  <div className="text-[10px] text-yellow-300/80">
                    {new Date(r.dateTime).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {r.recurring !== "nunca" && <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">🔄 {r.recurring}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <MiniCalendar accentColor="#eab308" />
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span>🔔</span>
            <span className="text-sm font-semibold">{tab === "done" ? "Concluídos" : "Lembretes"}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{displayed.length}</span>
          </div>
          {displayed.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">Nenhum lembrete{tab === "done" ? " concluído" : ""}.</div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {displayed.map((r) => {
                const { isOverdue, isToday } = getDateStatus(r.dateTime);
                const bgColor = !r.done && isOverdue ? "bg-red-500/10 border-red-500/20" : !r.done && isToday ? "bg-yellow-500/10 border-yellow-500/20" : "bg-white/[0.02] border-white/6";
                const dateColor = !r.done && isOverdue ? "text-red-400" : !r.done && isToday ? "text-yellow-400" : "text-white/30";
                return (
                  <div key={r.id} className={`group flex items-start gap-3 rounded-lg border ${bgColor} px-3 py-2.5 transition-all hover:bg-white/[0.08]`}>
                    <button onClick={() => handleToggle(r)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        r.done ? "border-emerald-500 bg-emerald-500/30 text-emerald-300" : "border-white/20 hover:border-white/40"}`}>
                      {r.done && <span className="text-xs">✓</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${r.done ? "text-white/40 line-through" : ""}`}>{r.title}</div>
                      {r.description && <div className="mt-0.5 truncate text-xs text-white/40">{r.description}</div>}
                      <div className="mt-1 flex items-center gap-2 text-[10px] flex-wrap">
                        <span className={dateColor}>
                          🕐 {new Date(r.dateTime).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="rounded px-1.5 py-0.5 font-medium" style={{ background: `${priorityColor(r.priority)}25`, color: priorityColor(r.priority) }}>{r.priority}</span>
                        {r.recurring !== "nunca" && <span className="rounded-md px-2 py-0.5 font-semibold text-xs" style={{ background: `${priorityColor(r.priority)}15`, color: priorityColor(r.priority) }}>🔄 {r.recurring}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-xs text-white/30 hover:text-white/60">✏️</button>
                      <button onClick={() => handleDelete(r.id)} className="rounded p-1 text-xs text-white/30 hover:text-red-400">🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button onClick={openCreate} className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-2xl text-white shadow-lg shadow-yellow-500/20 hover:bg-yellow-400">+</button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editRem ? "Editar Lembrete" : "Novo Lembrete"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título *</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-yellow-500/50" placeholder="Ex: Reunião com cliente" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Descrição</label>
            <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" placeholder="Detalhes..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Data</label>
              <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Hora</label>
              <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Prioridade</label>
              <select value={fPriority} onChange={(e) => setFPriority(e.target.value as Reminder["priority"])}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                <option value="alta">Alta</option><option value="média">Média</option><option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Recorrência</label>
              <select value={fRecurring} onChange={(e) => setFRecurring(e.target.value as Reminder["recurring"])}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                <option value="nunca">Nunca</option><option value="diário">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-medium text-white hover:bg-yellow-400">{editRem ? "Salvar" : "Criar Lembrete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
