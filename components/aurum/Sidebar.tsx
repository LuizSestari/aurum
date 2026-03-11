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
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat",      icon: "💬", label: "Chat",          color: "#22d3ee" },
  { id: "vision",    icon: "👁", label: "Visão",         color: "#a78bfa" },
  { id: "voice",     icon: "🎤", label: "Voz",           color: "#f472b6" },
  { id: "tasks",     icon: "✅", label: "Tarefas",       color: "#60a5fa" },
  { id: "habits",    icon: "🎯", label: "Hábitos",       color: "#34d399" },
  { id: "projects",  icon: "📁", label: "Projetos",      color: "#f97316" },
  { id: "reminders", icon: "🔔", label: "Lembretes",     color: "#facc15" },
  { id: "finance",   icon: "💲", label: "Finanças",      color: "#22c55e" },
  { id: "knowledge", icon: "📚", label: "Conhecimento",  color: "#22d3ee" },
  { id: "news",      icon: "📰", label: "Notícias",      color: "#fb923c" },
  { id: "updates",   icon: "✨", label: "Novidades",     color: "#c084fc" },
  { id: "dashboard", icon: "📊", label: "Dashboard",     color: "#06b6d4" },
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
  const sidebarRef = useRef<HTMLDivElement>(null);

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
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glowIndicator {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .settings-dropdown-enter {
          animation: slideUpSettings 0.25s ease forwards;
        }

        .glow-indicator {
          animation: glowIndicator 2s ease-in-out infinite;
        }
      `}</style>

      <nav
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: sidebarWidth,
          transition: "width 0.3s ease",
        }}
        className="flex h-full flex-col items-center border-r border-white/6 bg-gradient-to-b from-[#0a0e17] to-[#111827] py-4"
      >
        {/* Logo Section */}
        <div className="mb-6 flex items-center justify-center">
          {isHovered ? (
            <div className="flex items-center gap-2 text-lg font-bold tracking-wide">
              <span className="text-cyan-400">A</span>
              <span className="text-white/90">urum</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-cyan-500/30">
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
                {/* Animated glow indicator on left */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full glow-indicator"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}80`,
                    }}
                  />
                )}

                <button
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  style={{
                    width: isHovered ? "160px" : "40px",
                    transition: "all 0.3s ease",
                    ...(isActive ? { color: item.color } : {}),
                  }}
                  className={`flex items-center h-10 rounded-xl text-sm font-medium gap-3 px-3 transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                      : "text-white/40 hover:bg-gradient-to-r hover:from-white/8 hover:to-transparent hover:text-white/70"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {isHovered && (
                    <span className="truncate text-white/90">{item.label}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: isHovered ? "140px" : "24px",
            transition: "width 0.3s ease",
          }}
          className="my-2 h-px bg-gradient-to-r from-white/10 to-transparent"
        />

        {/* Settings */}
        <div className="relative w-full px-2" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Configurações"
            style={{
              width: isHovered ? "160px" : "40px",
              transition: "all 0.3s ease",
            }}
            className={`flex items-center h-10 rounded-xl text-sm font-medium gap-3 px-3 w-full transition-all ${
              settingsOpen
                ? "bg-gradient-to-r from-white/15 to-transparent text-white"
                : "text-white/40 hover:bg-gradient-to-r hover:from-white/8 hover:to-transparent hover:text-white/70"
            }`}
          >
            <span className="text-base shrink-0">⚙️</span>
            {isHovered && (
              <span className="truncate text-white/90">Configurações</span>
            )}
          </button>

          {settingsOpen && (
            <div
              className="absolute bottom-14 left-2 z-50 w-48 rounded-xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#0f1419] py-2 shadow-2xl settings-dropdown-enter"
              style={{
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.1)",
              }}
            >
              <button
                onClick={() => {
                  onNavigate("dashboard");
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:text-white transition-all"
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => {
                  onNavigate("settings");
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:text-white transition-all"
              >
                👤 Meu Perfil
              </button>
              {onNavigatePricing && (
                <button
                  onClick={() => {
                    onNavigatePricing();
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-transparent hover:text-amber-300 transition-all"
                >
                  💎 Planos
                </button>
              )}
              <button
                onClick={() => {
                  window.open("mailto:luizsestari2004@gmail.com?subject=Aurum%20Suporte", "_blank");
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:text-white transition-all"
              >
                💡 Suporte
              </button>
              <div className="my-2 h-px bg-gradient-to-r from-white/10 to-transparent" />
              <button
                onClick={() => {
                  onNavigate("developer");
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400/70 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent hover:text-red-400 transition-all"
              >
                🛠 Dev Console
              </button>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400/80 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent hover:text-red-400 transition-all"
                >
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
