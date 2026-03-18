"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import Modal from "../shared/Modal";
import { loadData, addNotebook, updateNotebook, deleteNotebook, todayISO, type Notebook } from "@/lib/aurum-store";

const AREAS = ["Geral", "Trabalho", "Pessoal", "Estudos", "Projetos", "Ideias"];

const BRAIN_DUMP_KEY = "aurum_braindump";

function loadBrainDump(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRAIN_DUMP_KEY) ?? "";
}
function saveBrainDump(text: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRAIN_DUMP_KEY, text);
}

export default function KnowledgePage() {
  const [tab, setTab] = useState("notebooks");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editNb, setEditNb] = useState<Notebook | null>(null);
  const [selectedNb, setSelectedNb] = useState<Notebook | null>(null);
  const [search, setSearch] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fArea, setFArea] = useState("Geral");
  const [editorContent, setEditorContent] = useState("");

  // Diary state
  const [diaryContent, setDiaryContent] = useState("");
  const [diaryDate, setDiaryDate] = useState(() => todayISO());
  const [diarySaved, setDiarySaved] = useState(false);

  // Brain dump state
  const [brainDump, setBrainDump] = useState("");
  const [bdSaved, setBdSaved] = useState(false);

  const reload = useCallback(() => { setNotebooks(loadData().notebooks); }, []);
  useEffect(() => { reload(); }, [reload]);

  // Load brain dump
  useEffect(() => { setBrainDump(loadBrainDump()); }, []);

  // Load diary entry for selected date
  useEffect(() => {
    const diaryNb = notebooks.find((nb) => nb.area === "Diário" && nb.title === `Diário — ${diaryDate}`);
    setDiaryContent(diaryNb?.content ?? "");
    setDiarySaved(false);
  }, [diaryDate, notebooks]);

  const openCreate = () => {
    setEditNb(null); setFTitle(""); setFArea("Geral"); setShowModal(true);
  };
  const handleSave = () => {
    if (!fTitle.trim()) return;
    if (editNb) {
      updateNotebook(editNb.id, { title: fTitle.trim(), area: fArea });
    } else {
      addNotebook({ title: fTitle.trim(), area: fArea, content: "", favorite: false });
    }
    setShowModal(false); reload();
  };
  const handleDelete = (id: string) => {
    deleteNotebook(id);
    if (selectedNb?.id === id) setSelectedNb(null);
    reload();
  };
  const handleFavorite = (nb: Notebook) => {
    updateNotebook(nb.id, { favorite: !nb.favorite }); reload();
  };
  const handleSaveContent = () => {
    if (selectedNb) {
      updateNotebook(selectedNb.id, { content: editorContent });
      reload();
    }
  };
  const selectNotebook = (nb: Notebook) => {
    setSelectedNb(nb); setEditorContent(nb.content);
  };

  // Diary save
  const handleSaveDiary = () => {
    const title = `Diário — ${diaryDate}`;
    const existing = notebooks.find((nb) => nb.area === "Diário" && nb.title === title);
    if (existing) {
      updateNotebook(existing.id, { content: diaryContent });
    } else {
      addNotebook({ title, area: "Diário", content: diaryContent, favorite: false });
    }
    setDiarySaved(true);
    reload();
    setTimeout(() => setDiarySaved(false), 2000);
  };

  // Brain dump save
  const handleSaveBrainDump = () => {
    saveBrainDump(brainDump);
    setBdSaved(true);
    setTimeout(() => setBdSaved(false), 2000);
  };

  const filtered = notebooks.filter((nb) =>
    nb.title.toLowerCase().includes(search.toLowerCase()) || nb.area.toLowerCase().includes(search.toLowerCase())
  );
  const areas = [...new Set(notebooks.map((n) => n.area))];
  const totalNbs = notebooks.length;
  const totalAreas = areas.length;
  const favorites = notebooks.filter((n) => n.favorite).length;

  // Diary entries count
  const diaryEntries = useMemo(() => notebooks.filter((n) => n.area === "Diário").length, [notebooks]);

  // Prev/next day
  const prevDay = () => {
    const d = new Date(diaryDate + "T12:00:00"); d.setDate(d.getDate() - 1);
    setDiaryDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(diaryDate + "T12:00:00"); d.setDate(d.getDate() + 1);
    setDiaryDate(d.toISOString().slice(0, 10));
  };
  const goToday = () => setDiaryDate(todayISO());

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <PageHeader icon="📚" iconBg="#06b6d4" title="Conhecimento" subtitle="Cadernos, diário e pensamentos organizados"
        tabs={[{ id: "notebooks", label: "Cadernos" }, { id: "diary", label: "Diário" }, { id: "braindump", label: "Brain Dump" }]}
        activeTab={tab} onTabChange={setTab} />

      <StatCards cards={[
        { icon: "📖", label: "Cadernos", value: totalNbs, color: "#06b6d4" },
        { icon: "📂", label: "Áreas", value: totalAreas, color: "#a78bfa" },
        { icon: "⭐", label: "Favoritos", value: favorites, color: "#eab308" },
        { icon: "📝", label: "Diários", value: diaryEntries, color: "#22c55e" },
      ]} />

      {/* ═══ NOTEBOOKS TAB ═══ */}
      {tab === "notebooks" && (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/30">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Buscar cadernos..." />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              {areas.length === 0 && filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/30">Nenhum caderno. Clique no + para criar.</div>
              ) : (
                <div className="space-y-3">
                  {(areas.length > 0 ? areas : ["Geral"]).map((area) => {
                    const areaNbs = filtered.filter((n) => n.area === area);
                    if (areaNbs.length === 0 && search) return null;
                    return (
                      <div key={area}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📂</span>
                            <span className="text-xs font-medium text-white/70">{area}</span>
                            <span className="text-[10px] text-white/30">({areaNbs.length})</span>
                          </div>
                        </div>
                        <div className="ml-4 mt-1 space-y-0.5">
                          {areaNbs.map((nb) => (
                            <button key={nb.id} onClick={() => selectNotebook(nb)}
                              className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                                selectedNb?.id === nb.id ? "bg-amber-500/15 text-amber-300" : "text-white/60 hover:bg-white/5"}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span>{nb.favorite ? "⭐" : "📄"}</span>
                                <span className="truncate">{nb.title}</span>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                                <span onClick={(e) => { e.stopPropagation(); handleFavorite(nb); }} className="cursor-pointer hover:text-yellow-400">{nb.favorite ? "★" : "☆"}</span>
                                <span onClick={(e) => { e.stopPropagation(); handleDelete(nb.id); }} className="cursor-pointer hover:text-red-400">✕</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              {selectedNb ? (
                <div className="flex h-full flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{selectedNb.title}</div>
                      <div className="text-[10px] text-white/30">{selectedNb.area} · Atualizado {new Date(selectedNb.updatedAt).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <button onClick={handleSaveContent}
                      className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30">💾 Salvar</button>
                  </div>
                  <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)}
                    className="min-h-[300px] flex-1 resize-none rounded-lg border border-white/8 bg-white/[0.02] p-4 text-sm leading-relaxed outline-none placeholder:text-white/20"
                    placeholder="Escreva suas notas aqui... (suporta texto livre)" />
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-xs text-white/30">
                  Selecione um caderno ou crie um novo
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ DIARY TAB ═══ */}
      {tab === "diary" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={prevDay} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">‹</button>
              <button onClick={goToday} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">Hoje</button>
              <button onClick={nextDay} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">›</button>
            </div>
            <span className="text-sm font-medium capitalize">
              {new Date(diaryDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span className="text-sm font-semibold">Entrada do Diário</span>
              </div>
              <button onClick={handleSaveDiary}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${diarySaved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"}`}>
                {diarySaved ? "✓ Salvo!" : "💾 Salvar"}
              </button>
            </div>
            <textarea value={diaryContent} onChange={(e) => setDiaryContent(e.target.value)}
              className="min-h-[350px] w-full resize-none rounded-lg border border-white/8 bg-white/[0.02] p-4 text-sm leading-relaxed outline-none placeholder:text-white/20"
              placeholder="Como foi o seu dia? O que você aprendeu? O que sentiu?..." />
          </div>

          {/* Recent diary entries */}
          {diaryEntries > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs font-semibold text-white/60 mb-3">Entradas Recentes</div>
              <div className="space-y-1.5">
                {notebooks.filter((n) => n.area === "Diário").sort((a, b) => b.title.localeCompare(a.title)).slice(0, 7).map((nb) => (
                  <button key={nb.id} onClick={() => {
                    const dateMatch = nb.title.match(/(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) setDiaryDate(dateMatch[1]);
                  }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      nb.title.includes(diaryDate) ? "bg-amber-500/15 text-amber-300" : "text-white/50 hover:bg-white/5"}`}>
                    <span>{nb.title.replace("Diário — ", "📅 ")}</span>
                    <span className="text-[10px] text-white/25">{nb.content.length > 0 ? `${nb.content.slice(0, 40)}...` : "vazio"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BRAIN DUMP TAB ═══ */}
      {tab === "braindump" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/8 px-4 py-3">
            <span className="text-lg">🧠</span>
            <div>
              <div className="text-sm font-medium">Brain Dump</div>
              <div className="text-xs text-white/50">Jogue aqui todos os seus pensamentos sem filtro. Organize depois.</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Área de Descarga Mental</span>
                <span className="text-[10px] text-white/30">{brainDump.length} caracteres</span>
              </div>
              <button onClick={handleSaveBrainDump}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${bdSaved ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"}`}>
                {bdSaved ? "✓ Salvo!" : "💾 Salvar"}
              </button>
            </div>
            <textarea value={brainDump} onChange={(e) => setBrainDump(e.target.value)}
              className="min-h-[400px] w-full resize-none rounded-lg border border-white/8 bg-white/[0.02] p-4 text-sm leading-relaxed outline-none placeholder:text-white/20"
              placeholder="Despeje todos os seus pensamentos aqui...&#10;&#10;• Ideias soltas&#10;• Coisas que quer lembrar&#10;• Preocupações&#10;• Insights&#10;• Qualquer coisa que esteja na sua mente&#10;&#10;Não se preocupe com organização — é para isso que os Cadernos existem!" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setBrainDump(""); }} className="rounded-lg bg-white/5 px-4 py-2 text-xs text-white/40 hover:bg-white/10 hover:text-white/60">
              🗑 Limpar Tudo
            </button>
            <button onClick={() => {
              if (brainDump.trim()) {
                addNotebook({ title: `Brain Dump — ${todayISO()}`, area: "Ideias", content: brainDump, favorite: false });
                reload();
                setBrainDump(""); saveBrainDump("");
              }
            }} className="rounded-lg bg-amber-500/20 px-4 py-2 text-xs text-amber-300 hover:bg-amber-500/30">
              📓 Salvar como Caderno
            </button>
          </div>
        </div>
      )}

      <button onClick={openCreate} className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400">+</button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Caderno">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título *</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-500/50" placeholder="Nome do caderno" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Área</label>
            <select value={fArea} onChange={(e) => setFArea(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-400">Criar Caderno</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
