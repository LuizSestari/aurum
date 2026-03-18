"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TimerMode = "focus" | "break" | "longBreak";

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const LABELS: Record<TimerMode, string> = {
  focus: "Foco",
  break: "Pausa",
  longBreak: "Pausa Longa",
};

const COLORS: Record<TimerMode, string> = {
  focus: "#00d9ff",
  break: "#22c55e",
  longBreak: "#a855f7",
};

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound();

            // Notify
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Aurum Pomodoro", {
                body: mode === "focus" ? "Hora da pausa!" : "Hora de focar!",
                icon: "/icons/icon-192.png",
              });
            }

            // Auto switch
            if (mode === "focus") {
              const newSessions = sessions + 1;
              setSessions(newSessions);
              if (newSessions % 4 === 0) {
                setMode("longBreak");
                return DURATIONS.longBreak;
              } else {
                setMode("break");
                return DURATIONS.break;
              }
            } else {
              setMode("focus");
              return DURATIONS.focus;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessions, playSound]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setIsRunning(false);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = 1 - timeLeft / DURATIONS[mode];
  const circumference = 2 * Math.PI * 45;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#0a0f1a]/80 border border-white/10 backdrop-blur-xl text-white/40 hover:text-amber-400 hover:border-amber-500/30 transition-all shadow-lg"
        title="Pomodoro Timer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-64 rounded-2xl border border-white/10 bg-[#0a0f1a]/95 backdrop-blur-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40">Pomodoro</span>
        <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white/40 text-xs">✕</button>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 mb-4">
        {(["focus", "break", "longBreak"] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={[
              "flex-1 rounded-lg py-1 text-[10px] font-medium transition-all",
              mode === m ? "text-white" : "text-white/30 hover:text-white/50",
            ].join(" ")}
            style={mode === m ? { backgroundColor: `${COLORS[m]}20` } : {}}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>

      {/* Circular Timer */}
      <div className="relative flex items-center justify-center mb-4">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle
            cx="60" cy="60" r="45" fill="none"
            stroke={COLORS[mode]}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-light text-white/80 tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <p className="text-[10px] text-white/30">{LABELS[mode]}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={reset} className="rounded-lg px-3 py-1.5 text-xs text-white/30 hover:text-white/50 hover:bg-white/5 transition-all">
          Reset
        </button>
        <button
          onClick={() => {
            if (!isRunning && "Notification" in window && Notification.permission === "default") {
              Notification.requestPermission();
            }
            setIsRunning(!isRunning);
          }}
          className="rounded-lg px-4 py-1.5 text-xs font-medium transition-all"
          style={{
            backgroundColor: isRunning ? "rgba(239,68,68,0.2)" : `${COLORS[mode]}20`,
            color: isRunning ? "#f87171" : COLORS[mode],
          }}
        >
          {isRunning ? "Pausar" : "Iniciar"}
        </button>
      </div>

      {/* Sessions counter */}
      <div className="mt-3 flex items-center justify-center gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: i < (sessions % 4) ? COLORS.focus : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
        <span className="ml-1 text-[10px] text-white/20">{sessions} sessões</span>
      </div>
    </div>
  );
}
