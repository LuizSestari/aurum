"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-[#0a0f1a]/95 backdrop-blur-xl px-4 py-3 shadow-[0_0_30px_rgba(0,217,255,0.1)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">Instalar Aurum</p>
          <p className="text-xs text-white/40">Acesse offline, mais rápido</p>
        </div>
        <button
          onClick={handleInstall}
          className="ml-2 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowInstall(false)}
          className="text-white/20 hover:text-white/40 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
