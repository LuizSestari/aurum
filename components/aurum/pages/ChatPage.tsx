"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbState } from "@/lib/aurum-voice";
import {
  speak,
  stopSpeak,
  startListening,
  isSpeechRecognitionSupported,
} from "@/lib/aurum-voice";
import { generateAIResponse, type StreamCallbacks } from "@/lib/aurum-ai";
import { addMessage, getRecentContext, getGreeting } from "@/lib/aurum-memory";
import AurumOrb from "../shared/AurumOrb";
import { useAuth } from "@/lib/aurum-auth";
import { UpgradeModal } from "../UpgradeModal";
import { UsageBar } from "../UsageBar";
import {
  addTask,
  addHabit,
  addProject,
  addReminder,
  addTransaction,
  loadData,
  saveData,
  deleteTask,
  updateTask,
} from "@/lib/aurum-store";

interface Props {
  muted: boolean;
  onMuteToggle: () => void;
  orbState: OrbState;
  onOrbState: (s: OrbState) => void;
  userName?: string;
}

interface TranscriptEntry {
  role: "user" | "aurum";
  text: string;
  timestamp: number;
}

// ── Execute AI action blocks (e.g., create tasks, habits, etc) ──
function executeActions(text: string): string {
  const actionRegex = /:::action\s*\n?([\s\S]*?)\n?:::/g;
  let match;
  const actions: Array<{ type: string; data: any }> = [];

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const action = JSON.parse(match[1].trim());
      actions.push(action);
    } catch (e) {
      console.warn("[Aurum] Failed to parse action:", e);
    }
  }

  for (const action of actions) {
    try {
      switch (action.type) {
        case "add_task":
          addTask({
            ...action.data,
            status: "pendente",
            completedAt: null,
          });
          break;

        case "add_habit":
          const habits = loadData().habits || [];
          habits.push({
            id: `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
            ...action.data,
            streak: 0,
            bestStreak: 0,
            completedDates: [],
            createdAt: new Date().toISOString(),
          });
          saveData({ ...loadData(), habits });
          break;

        case "add_reminder":
          addReminder({
            ...action.data,
            done: false,
          });
          break;

        case "add_transaction":
          addTransaction({
            ...action.data,
            title: action.data.title || action.data.description,
          });
          break;

        case "add_project":
          const projects = loadData().projects || [];
          projects.push({
            id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
            ...action.data,
            progress: 0,
            createdAt: new Date().toISOString(),
          });
          saveData({ ...loadData(), projects });
          break;

        case "complete_task":
          const data = loadData();
          const task = data.tasks?.find((t) =>
            t.title.toLowerCase().includes(action.data.title.toLowerCase())
          );
          if (task) {
            updateTask(task.id, { status: "concluída" });
          }
          break;

        case "delete_task":
          const allData = loadData();
          const taskIdx = allData.tasks?.findIndex((t) =>
            t.title.toLowerCase().includes(action.data.title.toLowerCase())
          );
          if (taskIdx !== undefined && taskIdx >= 0) {
            deleteTask(allData.tasks[taskIdx].id);
          }
          break;
      }
    } catch (e) {
      console.warn("[Aurum] Error executing action:", action.type, e);
    }
  }

  // Return text without action blocks (clean display)
  return text.replace(/:::action\s*\n?[\s\S]*?\n?:::/g, "").trim();
}

export default function ChatPage({ muted, onMuteToggle, orbState, onOrbState, userName }: Props) {
  const auth = useAuth();
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [aiPartial, setAiPartial] = useState("");
  const [statusText, setStatusText] = useState("");
  const [greeting] = useState(() => getGreeting(userName));
  const [sttSupported, setSttSupported] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const stopListenRef = useRef<(() => void) | null>(null);
  const spaceDown = useRef(false);
  const processingRef = useRef(false);
  const streamRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const continuousModeRef = useRef(false);
  const mutedRef = useRef(muted);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { continuousModeRef.current = continuousMode; }, [continuousMode]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported());
    const history = getRecentContext(20);
    if (history.length > 0) {
      setTranscript(history.map((m) => ({
        role: m.role === "user" ? "user" : "aurum",
        text: m.content,
        timestamp: m.timestamp,
      })));
    }
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, aiPartial]);

  // ── Core: process message and handle full cycle ──
  const processMessageDirect = useCallback((userText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setTranscript((prev) => [...prev, { role: "user", text: userText, timestamp: Date.now() }]);
    addMessage({ role: "user", content: userText, timestamp: Date.now() });
    setPartialTranscript("");
    setStatusText("Pensando...");
    onOrbState("thinking");
    streamRef.current = "";
    setAiPartial("");

    const restartListenIfContinuous = () => {
      if (!continuousModeRef.current || processingRef.current) return;
      setTimeout(() => {
        if (!continuousModeRef.current || processingRef.current) return;
        onOrbState("listening");
        setStatusText("Ouvindo...");
        const s = startListening({
          onResult: (t) => { s(); stopListenRef.current = null; processMessageDirect(t); },
          onPartial: (p) => { setPartialTranscript(p); setStatusText(p); },
          onError: () => { onOrbState("idle"); setStatusText(""); },
          onEnd: () => { if (!processingRef.current) { onOrbState("idle"); setStatusText(""); } },
        });
        stopListenRef.current = s;
      }, 500);
    };

    const callbacks: StreamCallbacks = {
      onToken: (token) => {
        streamRef.current += token;
        setAiPartial(streamRef.current);
        setStatusText(streamRef.current.slice(-100));
      },
      onComplete: (fullText) => {
        // Execute any action blocks in the response
        const cleanText = executeActions(fullText);

        setAiPartial("");
        setTranscript((prev) => [...prev, { role: "aurum", text: cleanText, timestamp: Date.now() }]);
        addMessage({ role: "aurum", content: cleanText, timestamp: Date.now() });

        if (!mutedRef.current) {
          setStatusText("Falando...");
          onOrbState("speaking");
          speak(cleanText.replace(/[*#`_\[\]()]/g, ""), {
            onEnd: () => {
              setStatusText("");
              onOrbState("idle");
              processingRef.current = false;
              restartListenIfContinuous();
            },
          });
        } else {
          setStatusText("");
          onOrbState("idle");
          processingRef.current = false;
          restartListenIfContinuous();
        }
      },
      onError: (err) => {
        setAiPartial("");
        setStatusText(`Erro: ${err}`);
        onOrbState("idle");
        processingRef.current = false;
        setTimeout(() => setStatusText(""), 4000);
      },
    };

    generateAIResponse(userText, callbacks);
  }, [onOrbState]);

  // ── Start listening ──
  const doListen = useCallback(() => {
    if (mutedRef.current || processingRef.current) return;
    onOrbState("listening");
    setStatusText("Ouvindo...");
    const stop = startListening({
      onResult: (t) => { stopListenRef.current = null; processMessageDirect(t); },
      onPartial: (p) => { setPartialTranscript(p); setStatusText(p); },
      onError: () => { onOrbState("idle"); setStatusText(""); },
      onEnd: () => { if (!processingRef.current) { onOrbState("idle"); setStatusText(""); } },
    });
    stopListenRef.current = stop;
  }, [onOrbState, processMessageDirect]);

  const doStopListen = useCallback(() => {
    stopListenRef.current?.();
    stopListenRef.current = null;
  }, []);

  const doStopAll = useCallback(() => {
    doStopListen();
    stopSpeak();
    processingRef.current = false;
    setContinuousMode(false);
    onOrbState("idle");
    setStatusText("");
    setAiPartial("");
    setPartialTranscript("");
  }, [doStopListen, onOrbState]);

  // ── Image analysis function ──
  const analyzeImage = useCallback(async (file: File, userMessage?: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const msg = userMessage || "Analise esta imagem";
    setTranscript(prev => [...prev, { role: "user", text: `📷 ${msg}`, timestamp: Date.now() }]);
    addMessage({ role: "user", content: `[imagem] ${msg}`, timestamp: Date.now() });
    setStatusText("Analisando imagem...");
    onOrbState("thinking");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("message", msg);

      const res = await fetch("/api/vision", { method: "POST", body: formData });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const cleanText = executeActions(data.reply);
      setTranscript(prev => [...prev, { role: "aurum", text: cleanText, timestamp: Date.now() }]);
      addMessage({ role: "aurum", content: cleanText, timestamp: Date.now() });

      if (!mutedRef.current) {
        setStatusText("Falando...");
        onOrbState("speaking");
        speak(cleanText.replace(/[*#`_\[\]()]/g, ""), {
          onEnd: () => { setStatusText(""); onOrbState("idle"); processingRef.current = false; },
        });
      } else {
        setStatusText(""); onOrbState("idle"); processingRef.current = false;
      }
    } catch (err) {
      setStatusText(`Erro: ${err instanceof Error ? err.message : "Falha na análise"}`);
      onOrbState("idle");
      processingRef.current = false;
      setTimeout(() => setStatusText(""), 4000);
    }

    setImageFile(null);
    setImagePreview(null);
  }, [onOrbState]);

  const sendText = useCallback(() => {
    const t = text.trim();
    if ((!t && !imageFile) || processingRef.current) return;

    // Check usage limit before sending
    if (!auth.isWithinUsageLimit("aiMessagesPerMonth")) {
      setShowUpgradeModal(true);
      return;
    }

    // If there's an image, analyze it
    if (imageFile) {
      auth.incrementUsage("aiMessages");
      analyzeImage(imageFile, t || undefined);
      setText("");
      return;
    }

    setText("");
    auth.incrementUsage("aiMessages");
    processMessageDirect(t);
  }, [text, imageFile, processMessageDirect, auth, analyzeImage]);

  const toggleContinuous = useCallback(() => {
    if (continuousMode) {
      setContinuousMode(false);
      doStopAll();
    } else {
      setContinuousMode(true);
      setTimeout(() => {
        if (!processingRef.current) {
          onOrbState("listening");
          setStatusText("Ouvindo... (modo contínuo)");
          const s = startListening({
            onResult: (t) => { s(); stopListenRef.current = null; processMessageDirect(t); },
            onPartial: (p) => { setPartialTranscript(p); setStatusText(p); },
            onError: () => { onOrbState("idle"); setStatusText(""); },
            onEnd: () => { if (!processingRef.current) { onOrbState("idle"); setStatusText(""); } },
          });
          stopListenRef.current = s;
        }
      }, 100);
    }
  }, [continuousMode, doStopAll, onOrbState, processMessageDirect]);

  // ── Image handling functions ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImagePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onload = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  // ── Paste event listener for images ──
  useEffect(() => {
    document.addEventListener("paste", handleImagePaste);
    return () => document.removeEventListener("paste", handleImagePaste);
  }, [handleImagePaste]);

  // Keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase() ?? "";
      if (e.key === "Escape") { e.preventDefault(); doStopAll(); return; }
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;
      if (e.code === "Space" && !spaceDown.current) {
        e.preventDefault();
        spaceDown.current = true;
        doListen();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") { spaceDown.current = false; doStopListen(); }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [doListen, doStopListen, doStopAll]);

  // Click anywhere on the background to start/stop
  const handleBackgroundClick = useCallback(() => {
    if (orbState === "listening") doStopListen();
    else if (orbState === "speaking") { stopSpeak(); onOrbState("idle"); processingRef.current = false; }
    else if (orbState === "thinking") { /* noop */ }
    else doListen();
  }, [orbState, doStopListen, doListen, onOrbState]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050810]">
      {/* ── USAGE BAR (TOP LEFT) ── */}
      <div className="absolute top-4 left-4 z-20 w-64">
        <UsageBar
          current={auth.usage.aiMessages}
          limit={auth.plan === "dev" || auth.plan === "max" ? -1 : auth.plan === "pro" ? 3000 : auth.plan === "starter" ? 500 : 30}
          label="Mensagens IA"
          color="from-cyan-500 to-blue-500"
        />
      </div>

      {/* ── FULLSCREEN ORB FIELD ── */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleBackgroundClick}>
        <AurumOrb state={orbState} />
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setShowTranscript(!showTranscript); }}
          className={[
            "rounded-lg px-3 py-1.5 text-xs backdrop-blur-xl transition-all",
            showTranscript ? "bg-white/10 text-white/70" : "bg-white/5 text-white/25 hover:bg-white/8 hover:text-white/40",
          ].join(" ")}
        >
          {showTranscript ? "Ocultar log" : "Ver log"}
        </button>
      </div>

      {/* ── TRANSCRIPT SIDEBAR ── */}
      {showTranscript && (
        <div className="absolute right-0 top-0 z-30 h-full w-80 border-l border-white/6 bg-[#050810]/90 backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
            <span className="text-xs font-medium text-white/40">Transcrição</span>
            <button onClick={() => setShowTranscript(false)} className="text-white/25 hover:text-white/50">✕</button>
          </div>
          <div className="h-[calc(100%-48px)] overflow-y-auto p-4 space-y-3">
            {transcript.map((entry, i) => {
              const time = new Date(entry.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} className={entry.role === "user" ? "text-right" : "text-left"}>
                  <div className={[
                    "inline-block max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed group relative",
                    entry.role === "user" ? "bg-cyan-500/10 text-white/70" : "bg-white/5 text-white/50",
                  ].join(" ")}>
                    <div>{entry.text}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{time}</div>
                    {entry.role === "aurum" && (
                      <button onClick={() => { navigator.clipboard.writeText(entry.text); }}
                        className="absolute -right-7 top-1 opacity-0 group-hover:opacity-100 rounded px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-[10px] transition-opacity">
                        📋
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {aiPartial && (
              <div className="text-left">
                <div className="inline-block max-w-[90%] rounded-xl bg-white/5 px-3 py-2 text-xs text-white/30">
                  {aiPartial}<span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-cyan-400/50" />
                </div>
              </div>
            )}
            {orbState === "thinking" && !aiPartial && (
              <div className="text-left">
                <div className="inline-block rounded-xl bg-white/5 px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* ── CENTER STATUS ── */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
        {/* Status / Greeting */}
        <div className="mb-4 h-16 flex flex-col items-center justify-end">
          {statusText ? (
            <p className="max-w-lg text-center text-sm text-white/40 truncate px-8">{statusText}</p>
          ) : transcript.length === 0 ? (
            <>
              <p className="text-2xl font-extralight tracking-wider text-white/50">{greeting}</p>
              <p className="mt-2 text-xs text-white/15">Toque em qualquer lugar ou segure Espaço</p>
            </>
          ) : null}
        </div>

        {/* State indicator */}
        <div className="h-10 flex items-center justify-center">
          {orbState === "listening" && (
            <div className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              <span className="text-xs font-medium text-cyan-400/80">Ouvindo...</span>
            </div>
          )}
          {orbState === "thinking" && (
            <div className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
              </span>
              <span className="text-xs font-medium text-violet-400/80">Pensando...</span>
            </div>
          )}
          {orbState === "speaking" && (
            <div className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-400/80">Falando...</span>
            </div>
          )}
          {partialTranscript && orbState === "listening" && (
            <p className="mt-2 max-w-sm text-center text-xs text-white/25 italic">&ldquo;{partialTranscript}&rdquo;</p>
          )}
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="absolute bottom-5 left-0 right-0 z-20 px-6" onClick={(e) => e.stopPropagation()}>
        <style>{`
          @keyframes borderGlow {
            0%, 100% { box-shadow: 0 0 0 1px currentColor, 0 0 12px rgba(34, 211, 238, 0.15) inset; }
            50% { box-shadow: 0 0 0 1px currentColor, 0 0 20px rgba(34, 211, 238, 0.25) inset; }
          }
          .control-bar-listening { animation: borderGlow 2s ease-in-out infinite; }
          .control-bar-thinking { border-color: rgba(168, 85, 247, 0.4) !important; box-shadow: 0 0 12px rgba(168, 85, 247, 0.2) inset, 0 0 24px rgba(168, 85, 247, 0.15); }
          .control-bar-speaking { border-color: rgba(34, 197, 94, 0.4) !important; box-shadow: 0 0 12px rgba(34, 197, 94, 0.2) inset, 0 0 24px rgba(34, 197, 94, 0.15); }
        `}</style>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image preview (above the control bar) */}
          {imagePreview && (
            <div className="absolute bottom-full mb-2 left-4 right-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-2 backdrop-blur-xl">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                <div className="text-xs text-white/50">
                  <p>{imageFile?.name}</p>
                  <p className="text-white/30">{((imageFile?.size ?? 0) / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="ml-2 text-white/30 hover:text-red-400">✕</button>
              </div>
            </div>
          )}

          <div className={[
            "flex w-full items-center gap-2 rounded-2xl border transition-all duration-300",
            "bg-white/[0.08] backdrop-blur-3xl",
            orbState === "listening" ? "control-bar-listening border-cyan-500/60" :
            orbState === "thinking" ? "control-bar-thinking" :
            orbState === "speaking" ? "control-bar-speaking" :
            "border-white/[0.15]",
            "px-4 py-2.5"
          ].join(" ")}>
            <textarea
              ref={inputRef as any}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/15 text-white/85 resize-none max-h-24"
              placeholder="Ou digite aqui..."
              rows={1}
              style={{ minHeight: "24px" }}
            />

            <button onClick={onMuteToggle} className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${muted ? "text-white/15" : "text-white/30 hover:text-white/45"}`}>
              {muted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/45 transition-all"
              title="Enviar imagem"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            <button
              onClick={toggleContinuous}
              className={[
                "flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-medium transition-all",
                continuousMode
                  ? "bg-cyan-500/25 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.15)]"
                  : "text-white/25 hover:text-white/40",
              ].join(" ")}
            >
              {continuousMode ? "II Parar" : "\u221E Cont\u00EDnuo"}
            </button>

            {text.trim() ? (
              <button onClick={sendText} className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/85 text-white transition-all hover:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            ) : (
              <button
                onClick={() => { if (orbState === "listening") doStopListen(); else doListen(); }}
                disabled={!sttSupported}
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                  orbState === "listening" ? "bg-cyan-500 text-white animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.3)]" : "bg-white/8 text-white/30 hover:bg-white/12",
                  !sttSupported ? "opacity-20" : "",
                ].join(" ")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[8px] text-white/15">
            <span><kbd className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5">Space</kbd> falar</span>
            <span className="text-white/10">•</span>
            <span><kbd className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5">Esc</kbd> parar</span>
          </div>
        </div>
      </div>

      {/* ── UPGRADE MODAL ── */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Mensagens IA"
        requiredPlan="pro"
        onUpgrade={() => {
          console.log("Upgrade to Pro or Max plan");
          // Will be connected to pricing navigation later
        }}
      />
    </div>
  );
}
