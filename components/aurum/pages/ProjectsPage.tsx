"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import Modal from "../shared/Modal";
import { loadData, addProject, updateProject, deleteProject, todayISO, type Project } from "@/lib/aurum-store";

const STATUSES: { value: Project["status"]; label: string; color: string }[] = [
  { value: "planejamento", label: "Planejamento", color: "#a78bfa" },
  { value: "ativo", label: "Ativo", color: "#22c55e" },
  { value: "em_andamento", label: "Em Andamento", color: "#3b82f6" },
  { value: "pausado", label: "Pausado", color: "#f97316" },
  { value: "concluído", label: "Concluído", color: "#6b7280" },
];

export default function ProjectsPage() {
  const [tab, setTab] = useState("kanban");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProj, setEditProj] = useState<Project | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fStatus, setFStatus] = useState<Project["status"]>("planejamento");
  const [fColor, setFColor] = useState("#3b82f6");
  const [fDue, setFDue] = useState("");

  const reload = useCallback(() => { setProjects(loadData().projects); }, []);
  useEffect(() => { reload(); }, [reload]);

  const openCreate = () => {
    setEditProj(null); setFTitle(""); setFDesc(""); setFStatus("planejamento"); setFColor("#3b82f6"); setFDue(""); setShowModal(true);
  };
  const openEdit = (p: Project) => {
    setEditProj(p); setFTitle(p.title); setFDesc(p.description); setFStatus(p.status); setFColor(p.color); setFDue(p.dueDate ?? ""); setShowModal(true);
  };
  const handleSave = () => {
    if (!fTitle.trim()) return;
    if (editProj) {
      updateProject(editProj.id, { title: fTitle.trim(), description: fDesc.trim(), status: fStatus, color: fColor, dueDate: fDue || null });
    } else {
      addProject({ title: fTitle.trim(), description: fDesc.trim(), status: fStatus, color: fColor, progress: 0, dueDate: fDue || null });
    }
    setShowModal(false); reload();
  };
  const handleStatusChange = (id: string, status: Project["status"]) => { updateProject(id, { status }); reload(); };
  const handleDelete = (id: string) => { deleteProject(id); reload(); };

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "em_andamento" || p.status === "ativo").length;
  const completed = projects.filter((p) => p.status === "concluído").length;
  const atRisk = projects.filter((p) => p.status === "pausado").length;

  const today = todayISO();

  // Timeline data — sorted by due date
  const timelineProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.status !== "concluído")
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  }, [projects]);

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <PageHeader icon="📁" iconBg="#f97316" title="Projetos" subtitle="Gerencie seus projetos com etapas, prazos e templates"
        tabs={[{ id: "projects", label: "Projetos" }, { id: "kanban", label: "Kanban" }, { id: "timeline", label: "Timeline" }]}
        activeTab={tab} onTabChange={setTab} />

      <StatCards cards={[
        { icon: "📁", label: "Total", value: total, color: "#f97316" },
        { icon: "🔄", label: "Em Andamento", value: inProgress, color: "#3b82f6" },
        { icon: "✅", label: "Concluídos", value: completed, color: "#22c55e" },
        { icon: "⚠️", label: "Pausados", value: atRisk, color: "#ef4444" },
      ]} />

      {/* ═══ PROJECTS LIST TAB ═══ */}
      {tab === "projects" && (
        <div className="mt-6 space-y-2">
          {projects.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center text-xs text-white/30">Nenhum projeto. Clique no + para criar.</div>
          ) : projects.map((p) => {
            const st = STATUSES.find((s) => s.value === p.status);
            return (
              <div key={p.id} className="group flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                <div className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.title}</div>
                  {p.description && <div className="truncate text-xs text-white/40">{p.description}</div>}
                </div>
                {p.dueDate && (
                  <span className={`text-[10px] ${p.dueDate < today && p.status !== "concluído" ? "text-red-400" : "text-white/30"}`}>
                    📅 {new Date(p.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
                <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: `${st?.color}20`, color: st?.color }}>{st?.label}</span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(p)} className="text-xs text-white/30 hover:text-white/60">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-white/30 hover:text-red-400">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ KANBAN TAB ═══ */}
      {tab === "kanban" && (
        <div className="mt-6 grid grid-cols-5 gap-3">
          {STATUSES.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.value);
            return (
              <div key={col.value} className="rounded-lg border border-white/8 bg-white/[0.02]">
                <div className="flex items-center justify-between rounded-t-lg px-3 py-2" style={{ borderBottom: `2px solid ${col.color}` }}>
                  <span className="text-xs font-medium">{col.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{colProjects.length}</span>
                </div>
                <div className="space-y-2 p-2">
                  {colProjects.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-white/20">Sem projetos</div>
                  ) : (
                    colProjects.map((p) => (
                      <div key={p.id} className="group rounded-lg border border-white/6 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-xs font-medium">{p.title}</span>
                          </div>
                          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => openEdit(p)} className="rounded p-0.5 text-[10px] text-white/30 hover:text-white/60">✏️</button>
                            <button onClick={() => handleDelete(p.id)} className="rounded p-0.5 text-[10px] text-white/30 hover:text-red-400">🗑</button>
                          </div>
                        </div>
                        {p.description && <div className="mt-1 text-[11px] text-white/40 line-clamp-2">{p.description}</div>}
                        {p.dueDate && <div className="mt-2 text-[10px] text-white/30">📅 {new Date(p.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
                        <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {STATUSES.filter((s) => s.value !== p.status).slice(0, 2).map((s) => (
                            <button key={s.value} onClick={() => handleStatusChange(p.id, s.value)}
                              className="rounded px-1.5 py-0.5 text-[9px] transition-colors hover:bg-white/10" style={{ color: s.color }}>
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TIMELINE TAB ═══ */}
      {tab === "timeline" && (
        <div className="mt-6 space-y-4">
          {timelineProjects.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
              <div className="text-4xl mb-4">📅</div>
              <div className="text-sm text-white/40">Nenhum projeto ativo com prazo definido</div>
              <div className="text-xs text-white/25 mt-1">Crie projetos com prazos para visualizar a timeline</div>
            </div>
          ) : (
            <div className="relative ml-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
              {timelineProjects.map((p) => {
                const st = STATUSES.find((s) => s.value === p.status);
                const isOverdue = p.dueDate ? p.dueDate < today : false;
                return (
                  <div key={p.id} className="relative pl-8 pb-6 last:pb-0">
                    <div className="absolute left-0 top-2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-[#0d1117]"
                      style={{ background: st?.color ?? "#6b7280" }} />
                    <div className="group rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-sm font-medium">{p.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: `${st?.color}20`, color: st?.color }}>{st?.label}</span>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => openEdit(p)} className="text-xs text-white/30 hover:text-white/60">✏️</button>
                            <button onClick={() => handleDelete(p.id)} className="text-xs text-white/30 hover:text-red-400">🗑</button>
                          </div>
                        </div>
                      </div>
                      {p.description && <div className="text-xs text-white/40 mb-2">{p.description}</div>}
                      {p.dueDate ? (
                        <div className={`text-[10px] ${isOverdue ? "text-red-400 font-medium" : "text-white/30"}`}>
                          {isOverdue ? "⚠️ Atrasado — " : "📅 "}{new Date(p.dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-white/20">Sem prazo definido</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button onClick={openCreate} className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-2xl text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400">+</button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProj ? "Editar Projeto" : "Novo Projeto"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título *</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500/50" placeholder="Nome do projeto" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Descrição</label>
            <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" placeholder="Detalhes..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Status</label>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value as Project["status"])}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Prazo</label>
              <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-400">{editProj ? "Salvar" : "Criar Projeto"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
