"use client";

import { useEffect, useState } from "react";

interface Props {
  onSearch: () => void;
  onNavigate: (page: string) => void;
}

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Busca global" },
  { keys: ["⌘", "1"], description: "Chat / Voz" },
  { keys: ["⌘", "2"], description: "Tarefas" },
  { keys: ["⌘", "3"], description: "Hábitos" },
  { keys: ["⌘", "4"], description: "Projetos" },
  { keys: ["⌘", "5"], description: "Lembretes" },
  { keys: ["⌘", "6"], description: "Finanças" },
  { keys: ["⌘", "7"], description: "Dashboard" },
  { keys: ["?"], description: "Mostrar atalhos" },
];

export function KeyboardShortcuts({ onSearch, onNavigate }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const pageMap: Record<string, string> = {
      "1": "chat",
      "2": "tasks",
      "3": "habits",
      "4": "projects",
      "5": "reminders",
      "6": "finance",
      "7": "dashboard",
    };

    function handleKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const tag = el?.tagName?.toLowerCase() ?? "";
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      // Cmd+K or Ctrl+K = search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearch();
        return;
      }

      // Cmd+1-7 = navigate
      if ((e.metaKey || e.ctrlKey) && pageMap[e.key]) {
        e.preventDefault();
        onNavigate(pageMap[e.key]);
        return;
      }

      // ? = show shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        setShowHelp((v) => !v);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearch, onNavigate]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowHelp(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-2xl border border-white/10 bg-[#0a0f1a]/95 backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,217,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-white/60 mb-4">Atalhos de Teclado</h3>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between gap-8">
              <span className="text-sm text-white/50">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/40"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-white/20 text-center">Pressione ? para fechar</p>
      </div>
    </div>
  );
}
