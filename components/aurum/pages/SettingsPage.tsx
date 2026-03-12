"use client";

import { useState } from "react";
import { setVoiceConfig } from "@/lib/aurum-voice";

interface Props {
  userName?: string;
  currentPlan?: string;
  onNavigatePricing?: () => void;
}

export default function SettingsPage({ userName, currentPlan, onNavigatePricing }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "data">("profile");
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("aurum_voice_enabled") !== "false";
  });
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "pt-BR";
    return localStorage.getItem("aurum_language") || "pt-BR";
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("aurum_theme") || "dark";
  });
  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    if (typeof window === "undefined") return 1.0;
    return parseFloat(localStorage.getItem("aurum_voice_speed") || "1.0");
  });
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const tabs = [
    { id: "profile" as const, label: "Perfil", icon: "👤" },
    { id: "preferences" as const, label: "Preferências", icon: "⚙️" },
    { id: "data" as const, label: "Dados", icon: "💾" },
  ];

  const savePref = (key: string, value: string) => {
    localStorage.setItem(key, value);
    setSavedFeedback(key);
    setTimeout(() => setSavedFeedback(null), 1500);
  };

  const getStorageSize = () => {
    if (typeof window === "undefined") return "0 KB";
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("aurum")) {
        total += (localStorage.getItem(key) || "").length;
      }
    }
    return `${(total / 1024).toFixed(1)} KB`;
  };

  const getItemCount = (prefix: string) => {
    if (typeof window === "undefined") return 0;
    try {
      const data = localStorage.getItem(prefix);
      if (!data) return 0;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold text-white">Configurações</h1>
        <p className="mb-6 text-sm text-white/40">Gerencie seu perfil e preferências</p>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-white/50 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-2xl font-bold text-white">
                  {userName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{userName || "Usuário"}</h2>
                  <p className="text-sm text-white/40">{userName || "sem email"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Plano Atual</label>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 px-3 py-1 text-sm font-medium text-cyan-400 border border-cyan-500/30">
                      {currentPlan || "Free"}
                    </span>
                    {onNavigatePricing && (
                      <button
                        onClick={onNavigatePricing}
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Fazer upgrade →
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Membro desde</label>
                  <p className="mt-1 text-sm text-white/70">Março 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Geral</h3>
                {savedFeedback && (
                  <span className="text-xs text-emerald-400 animate-pulse">✓ Salvo</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Voz do Assistente</p>
                  <p className="text-xs text-white/40">Ativar respostas por voz (JARVIS)</p>
                </div>
                <button
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    savePref("aurum_voice_enabled", String(next));
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    voiceEnabled ? "bg-cyan-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      voiceEnabled ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                    style={{ transform: voiceEnabled ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>

              {/* Voice Speed Slider */}
              {voiceEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Velocidade da Voz</p>
                    <p className="text-xs text-white/40">Ajuste a velocidade de fala do assistente</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-8 text-right">{voiceSpeed.toFixed(1)}x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVoiceSpeed(val);
                        savePref("aurum_voice_speed", val.toString());
                        setVoiceConfig({ ttsRate: val });
                      }}
                      className="w-32 accent-cyan-500"
                    />
                    <button
                      onClick={() => {
                        // Preview the speed
                        if (typeof window !== "undefined" && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const utt = new SpeechSynthesisUtterance("Essa é a velocidade selecionada.");
                          utt.lang = "pt-BR";
                          utt.rate = voiceSpeed;
                          window.speechSynthesis.speak(utt);
                        }
                      }}
                      className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
                      title="Testar velocidade"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Idioma</p>
                  <p className="text-xs text-white/40">Idioma da interface</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    savePref("aurum_language", e.target.value);
                  }}
                  className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Tema</p>
                  <p className="text-xs text-white/40">Aparência visual</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    savePref("aurum_theme", e.target.value);
                  }}
                  className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="dark">Escuro</option>
                  <option value="midnight">Meia-noite</option>
                  <option value="light">Claro (em breve)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Atalhos de Teclado</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["⌘K", "Busca Global"],
                  ["⌘1-7", "Navegar entre páginas"],
                  ["?", "Mostrar atalhos"],
                  ["Ctrl+V", "Colar imagem no chat"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-white/60">{desc}</span>
                    <kbd className="rounded bg-white/10 px-2 py-0.5 text-xs text-cyan-400 font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Armazenamento Local</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Total usado</span>
                  <span className="text-cyan-400 font-medium">{getStorageSize()}</span>
                </div>
                {[
                  ["aurum_tasks", "Tarefas"],
                  ["aurum_habits", "Hábitos"],
                  ["aurum_projects", "Projetos"],
                  ["aurum_reminders", "Lembretes"],
                  ["aurum_transactions", "Transações"],
                  ["aurum_messages", "Mensagens"],
                  ["aurum_feedback", "Feedbacks"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className="text-white/40">{getItemCount(key)} itens</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="text-sm font-semibold text-red-400/70 uppercase tracking-wider mb-3">Zona de Perigo</h3>
              <p className="text-xs text-white/40 mb-4">
                Estas ações são irreversíveis. Seus dados serão permanentemente removidos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm("Tem certeza? Isso apagará todos os dados do Aurum no localStorage.")) {
                      const keys = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key?.startsWith("aurum")) keys.push(key);
                      }
                      keys.forEach((k) => localStorage.removeItem(k));
                      window.location.reload();
                    }
                  }}
                  className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Limpar todos os dados
                </button>
                <button
                  onClick={() => {
                    const data: Record<string, string> = {};
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key?.startsWith("aurum")) {
                        data[key] = localStorage.getItem(key) || "";
                      }
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `aurum-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Exportar backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
