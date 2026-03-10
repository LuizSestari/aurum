"use client";

import { useState, useEffect } from "react";
import Modal from "../shared/Modal";

const UPDATES = [
  {
    title: "Voz ultra-realista com ElevenLabs",
    tags: ["Funcionalidade", "Mais recente"],
    content: "Integração com ElevenLabs para voz Neural ultra-realista em português. Fallback automático para StreamElements e Google TTS.",
    date: "2026-03-10",
  },
  {
    title: "Orb gravitacional fullscreen",
    tags: ["Alteração", "Mais recente"],
    content: "Novo campo de partículas gravitacional que preenche toda a tela. 4000 partículas em 5 camadas reagem ao estado da conversa.",
    date: "2026-03-09",
  },
  {
    title: "Modo conversa contínua",
    tags: ["Funcionalidade"],
    content: "Ative o modo contínuo para conversar sem parar. O Aurum ouve, responde e volta a ouvir automaticamente.",
    date: "2026-03-09",
  },
  {
    title: "Busca na internet dentro do Aurum",
    tags: ["Alteração"],
    content: "Agora você pode pedir para o Aurum pesquisar na internet e trazer informações atualizadas.",
    date: "2026-03-08",
  },
  {
    title: "Novo motor de inteligência - Março 2026",
    tags: ["Alteração"],
    content: "Motor de IA atualizado com interpretação mais precisa e respostas mais detalhadas. Suporte a streaming e markdown.",
    date: "2026-03-05",
  },
  {
    title: "Interface redesenhada com todas as seções",
    tags: ["Alteração"],
    content: "Nova interface com sidebar, chat premium, e seções completas: Tarefas, Hábitos, Projetos, Lembretes, Finanças, Conhecimento. Tudo com CRUD completo.",
    date: "2026-03-01",
  },
  {
    title: "Sistema de voz integrado",
    tags: ["Funcionalidade"],
    content: "TTS e STT integrados. Pressione Space para falar. Orb animado reage ao estado da conversa.",
    date: "2026-02-28",
  },
  {
    title: "Memória persistente",
    tags: ["Funcionalidade"],
    content: "Conversas e dados salvos localmente. Seus hábitos, tarefas e transações persistem entre sessões.",
    date: "2026-02-25",
  },
];

const PREDICTIONS = [
  { title: "Integração com Spotify", tags: ["Em Estudo"], content: "Controle músicas e playlists por voz." },
  { title: "Agentes autônomos", tags: ["Planejado"], content: "Agentes que executam tarefas complexas automaticamente." },
  { title: "Integração com Google Calendar", tags: ["Planejado"], content: "Sincronize seus eventos e lembretes com Google Calendar." },
  { title: "Modo offline completo", tags: ["Planejado"], content: "Funcione sem internet usando modelos locais de IA." },
  { title: "Automação de workflows", tags: ["Em Estudo"], content: "Crie fluxos automáticos entre tarefas, lembretes e projetos." },
];

export default function UpdatesPage() {
  const [tab, setTab] = useState<"changes" | "upcoming">("changes");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const items = tab === "changes" ? UPDATES : PREDICTIONS;

  const handleSubmit = () => {
    if (!suggestion.trim()) return;
    try {
      const suggestions = JSON.parse(localStorage.getItem("aurum_suggestions") || "[]");
      suggestions.push({
        text: suggestion,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("aurum_suggestions", JSON.stringify(suggestions));
    } catch (e) {
      console.error("Failed to save suggestion:", e);
    }
    setSubmitted(true);
    setSuggestion("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div className="flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div>
          <h1 className="text-xl font-bold">Novidades & Sugestões</h1>
          <p className="text-xs text-white/50">Acompanhe as atualizações e contribua com o Aurum</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex overflow-hidden rounded-xl border border-white/10">
        <button onClick={() => setTab("changes")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === "changes" ? "bg-white/10 text-white" : "text-white/40"}`}>
          🔧 Alterações ({UPDATES.length})
        </button>
        <button onClick={() => setTab("upcoming")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === "upcoming" ? "bg-white/10 text-white" : "text-white/40"}`}>
          📈 Previsões ({PREDICTIONS.length})
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Changes list */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span>{tab === "changes" ? "🔧" : "📈"}</span> {tab === "changes" ? "Mudanças Implementadas" : "Próximas Funcionalidades"}
          </h2>
          {items.map((u, i) => (
            <div key={i} className="rounded-xl border-l-2 border-l-purple-500 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]" style={{ animation: `slideInLeft 0.4s ease-out ${i * 0.08}s both` }}>
              <div className="font-medium">{u.title}</div>
              <div className="mt-1 flex gap-2">
                {u.tags.map((t) => (
                  <span key={t} className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">{t}</span>
                ))}
              </div>
              <p className="mt-2 text-sm text-white/60">{u.content}</p>
              {"date" in u && <div className="mt-2 text-[10px] text-white/30">📅 {new Date((u as { date: string }).date + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
            </div>
          ))}
        </div>

        {/* Contribute */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-lg font-semibold text-purple-300">Envie suas Sugestões</div>
            <p className="mt-2 text-xs text-white/40">Sua opinião é muito importante! Ajude-nos a melhorar o Aurum.</p>
            <button onClick={() => setShowSuggestion(true)}
              className="mt-4 w-full rounded-xl bg-purple-500/20 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-500/30 transition-colors">
              📝 Abrir Formulário
            </button>
            {submitted && <div className="mt-2 text-xs text-emerald-400">✓ Sugestão enviada! Obrigado!</div>}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold">Como contribuir?</div>
            <ul className="mt-2 space-y-1 text-xs text-white/50">
              <li>• Relate bugs encontrados</li>
              <li>• Sugira novas funcionalidades</li>
              <li>• Compartilhe melhorias de UX</li>
              <li>• Proponha integrações</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold">Versão Atual</div>
            <div className="mt-2 text-xs text-white/50">
              <div>Aurum v2.1.0</div>
              <div className="mt-1 text-white/30">Next.js 16 · React 19 · TypeScript</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Modal */}
      <Modal open={showSuggestion} onClose={() => setShowSuggestion(false)} title="Enviar Sugestão">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Sua sugestão ou feedback</label>
            <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={5}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
              placeholder="Descreva sua sugestão, bug ou melhoria..." autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowSuggestion(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={() => { handleSubmit(); setShowSuggestion(false); }}
              className="rounded-lg bg-purple-500 px-4 py-2 text-xs font-medium text-white hover:bg-purple-400">Enviar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
