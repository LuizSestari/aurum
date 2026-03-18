"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadData } from "@/lib/aurum-store";

interface SearchResult {
  type: "task" | "habit" | "project" | "reminder" | "transaction" | "page";
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pages for quick navigation
  const pages: SearchResult[] = [
    { type: "page", title: "Chat / Voz", subtitle: "Fale com Aurum", icon: "🎙️", action: () => onNavigate("chat") },
    { type: "page", title: "Tarefas", subtitle: "Gerenciar tarefas", icon: "✅", action: () => onNavigate("tasks") },
    { type: "page", title: "Hábitos", subtitle: "Acompanhar hábitos", icon: "🔄", action: () => onNavigate("habits") },
    { type: "page", title: "Projetos", subtitle: "Seus projetos", icon: "📁", action: () => onNavigate("projects") },
    { type: "page", title: "Lembretes", subtitle: "Próximos lembretes", icon: "⏰", action: () => onNavigate("reminders") },
    { type: "page", title: "Finanças", subtitle: "Controle financeiro", icon: "💰", action: () => onNavigate("finance") },
    { type: "page", title: "Conhecimento", subtitle: "Base de conhecimento", icon: "🧠", action: () => onNavigate("knowledge") },
    { type: "page", title: "Dashboard", subtitle: "Painel de controle", icon: "📊", action: () => onNavigate("dashboard") },
    { type: "page", title: "Visão", subtitle: "Vision board", icon: "🎯", action: () => onNavigate("vision") },
  ];

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults(pages);
      setSelectedIndex(0);
      return;
    }

    const lower = q.toLowerCase();
    const data = loadData();
    const found: SearchResult[] = [];

    // Search pages
    pages.forEach((p) => {
      if (p.title.toLowerCase().includes(lower) || p.subtitle?.toLowerCase().includes(lower)) {
        found.push(p);
      }
    });

    // Search tasks
    (data.tasks || []).forEach((t: any) => {
      if (t.title?.toLowerCase().includes(lower) || t.description?.toLowerCase().includes(lower)) {
        found.push({
          type: "task",
          title: t.title,
          subtitle: `${t.status} · ${t.priority}`,
          icon: t.status === "concluída" ? "✅" : "📋",
          action: () => onNavigate("tasks"),
        });
      }
    });

    // Search habits
    (data.habits || []).forEach((h: any) => {
      if (h.name?.toLowerCase().includes(lower)) {
        found.push({
          type: "habit",
          title: h.name,
          subtitle: `Streak: ${h.streak || 0} dias`,
          icon: h.icon || "🔄",
          action: () => onNavigate("habits"),
        });
      }
    });

    // Search projects
    (data.projects || []).forEach((p: any) => {
      if (p.title?.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)) {
        found.push({
          type: "project",
          title: p.title,
          subtitle: `${p.status} · ${p.progress || 0}%`,
          icon: "📁",
          action: () => onNavigate("projects"),
        });
      }
    });

    // Search reminders
    (data.reminders || []).forEach((r: any) => {
      if (r.title?.toLowerCase().includes(lower)) {
        found.push({
          type: "reminder",
          title: r.title,
          subtitle: r.dateTime ? new Date(r.dateTime).toLocaleDateString("pt-BR") : "",
          icon: "⏰",
          action: () => onNavigate("reminders"),
        });
      }
    });

    // Search transactions
    (data.transactions || []).forEach((t: any) => {
      if (t.title?.toLowerCase().includes(lower) || t.category?.toLowerCase().includes(lower)) {
        found.push({
          type: "transaction",
          title: t.title,
          subtitle: `R$ ${t.amount?.toFixed(2)} · ${t.category}`,
          icon: t.type === "receita" ? "💚" : "💸",
          action: () => onNavigate("finance"),
        });
      }
    });

    setResults(found.slice(0, 12));
    setSelectedIndex(0);
  }, [onNavigate]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      search("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, search]);

  useEffect(() => {
    search(query);
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      results[selectedIndex].action();
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1a]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,217,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/25"
            placeholder="Buscar tarefas, hábitos, projetos, páginas..."
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/25">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/25">
              Nenhum resultado encontrado
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.type}-${result.title}-${i}`}
                onClick={() => { result.action(); onClose(); }}
                className={[
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === selectedIndex ? "bg-amber-500/10" : "hover:bg-white/5",
                ].join(" ")}
              >
                <span className="text-base">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 truncate">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-white/30 truncate">{result.subtitle}</p>
                  )}
                </div>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/20 capitalize">
                  {result.type === "page" ? "ir" : result.type}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/6 px-4 py-2 flex items-center gap-4 text-[10px] text-white/20">
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
          <span>esc fechar</span>
        </div>
      </div>
    </div>
  );
}
