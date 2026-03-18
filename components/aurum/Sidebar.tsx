"use client";

import { useState, useRef, useEffect } from "react";

export type PageId =
  | "chat"
  | "vision"
  | "voice"
  | "tasks"
  | "habits"
  | "projects"
  | "reminders"
  | "finance"
  | "knowledge"
  | "news"
  | "updates"
  | "dashboard"
  | "settings"
  | "developer";

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat",      icon: "💬", label: "Chat" },
  { id: "vision",    icon: "👁", label: "Visão" },
  { id: "voice",     icon: "🎤", label: "Voz" },
  { id: "tasks",     icon: "✅", label: "Tarefas" },
  { id: "habits",    icon: "🎯", label: "Hábitos" },
  { id: "projects",  icon: "📁", label: "Projetos" },
  { id: "reminders", icon: "🔔", label: "Lembretes" },
  { id: "finance",   icon: "💲", label: "Finanças" },
  { id: "knowledge", icon: "📚", label: "Conhecimento" },
  { id: "news",      icon: "📰", label: "Notícias" },
  { id: "updates",   icon: "✨", label: "Novidades" },
  { id: "dashboard", icon: "📊", label: "Dashboard" },
];

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onSignOut?: () => void;
  onNavigatePricing?: () => void;
}

export default function Sidebar({ activePage, onNavigate, onSignOut, onNavigatePricing }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sidebarWidth = isHovered ? "180px" : "60px";

  return (
    <>
      <style>{`
        @keyframes slideUpSettings {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes goldPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .settings-dropdown-enter { animation: slideUpSettings 0.25s ease forwards; }
        .gold-indicator { animation: goldPulse 2s ease-in-out infinite; }
      `}</style>

      <nav
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: sidebarWidth,
          transition: "width 0.3s ease",
        }}
        className="flex h-full flex-col items-center border-r border-amber-500/[0.08] bg-gradient-to-b from-[#110F0C] to-[#0C0A09] py-4"
      >
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-lg font-bold tracking-wide">
              <span className="text-amber-400">A</span>
              <span className="text-white/80">urum</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-sm font-bold text-black shadow-lg shadow-amber-500/20">
              A
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto w-full px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <div key={item.id} className="relative w-full group">
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gold-indicator bg-amber-400"
                    style={{ boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)" }}
                  />
                )}

                <button
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  style={{
                    width: isHovered ? "160px" : "40px",
                    transition: "all 0.3s ease",
                  }}
                  className={`flex items-center h-10 rounded-xl text-sm font-medium gap-3 px-3 transition-all ${
                    isActive
                      ? "bg-amber-500/[0.12] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                      : "text-white/35 hover:bg-white/[0.05] hover:text-white/65"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {isHovered && (
                    <span className={`truncate ${isActive ? "text-amber-200/90" : "text-white/70"}`}>{item.label}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{ width: isHovered ? "140px" : "24px", transition: "width 0.3s ease" }}
          className="my-2 h-px bg-gradient-to-r from-amber-500/15 to-transparent"
        />

        {/* Settings */}
        <div className="relative w-full px-2" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Configurações"
            style={{ width: isHovered ? "160px" : "40px", transition: "all 0.3s ease" }}
            className={`flex items-center h-10 rounded-xl text-sm font-medium gap-3 px-3 w-full transition-all ${
              settingsOpen
                ? "bg-white/[0.08] text-white"
                : "text-white/35 hover:bg-white/[0.05] hover:text-white/65"
            }`}
          >
            <span className="text-base shrink-0">⚙️</span>
            {isHovered && <span className="truncate text-white/70">Configurações</span>}
          </button>

          {settingsOpen && (
            <div
              className="absolute bottom-14 left-2 z-50 w-48 rounded-xl border border-amber-500/10 bg-[#15120F] py-2 shadow-2xl settings-dropdown-enter"
              style={{ boxShadow: "0 20px 25px -5px rgba(0,0,0,0.6), 0 0 15px rgba(245,158,11,0.06)" }}
            >
              <button onClick={() => { onNavigate("dashboard"); setSettingsOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/60 hover:bg-amber-500/[0.08] hover:text-white/90 transition-all">
                📊 Dashboard
              </button>
              <button onClick={() => { onNavigate("settings"); setSettingsOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/60 hover:bg-amber-500/[0.08] hover:text-white/90 transition-all">
                👤 Meu Perfil
              </button>
              {onNavigatePricing && (
                <button onClick={() => { onNavigatePricing(); setSettingsOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/60 hover:bg-amber-500/[0.08] hover:text-amber-300 transition-all">
                  💎 Planos
                </button>
              )}
              <button onClick={() => { window.open("mailto:luizsestari2004@gmail.com?subject=Aurum%20Suporte", "_blank"); setSettingsOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/60 hover:bg-amber-500/[0.08] hover:text-white/90 transition-all">
                💡 Suporte
              </button>
              <div className="my-2 h-px bg-gradient-to-r from-white/8 to-transparent" />
              <button onClick={() => { onNavigate("developer"); setSettingsOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400/60 hover:bg-red-500/[0.08] hover:text-red-400 transition-all">
                🛠 Dev Console
              </button>
              {onSignOut && (
                <button onClick={onSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400/60 hover:bg-red-500/[0.08] hover:text-red-400 transition-all">
                  🚪 Sair
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
