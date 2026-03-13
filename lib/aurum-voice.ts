// ─────────────────────────────────────────────
// Aurum Voice Service v2
// TTS + STT + Web Audio API + Activity detection
// Low-latency voice pipeline (<300ms target)
// Multi-language support (pt-BR, en-US, es-ES)
// ─────────────────────────────────────────────

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "muted";

// ── Configuration ──
export interface VoiceConfig {
  language: string;
  ttsRate: number;
  ttsPitch: number;
  ttsVoiceURI?: string;
  vadSensitivity: number; // 0-1, voice activity detection
  sttEngine: "web" | "whisper"; // web = Web Speech API, whisper = local Whisper
  whisperUrl?: string; // URL for Whisper STT server (e.g., http://localhost:9000)
}

const DEFAULT_CONFIG: VoiceConfig = {
  language: "pt-BR",
  ttsRate: 1.15, // Noticeably faster but still natural
  ttsPitch: 1.0,
  vadSensitivity: 0.5,
  sttEngine: "web",
};

let config: VoiceConfig = { ...DEFAULT_CONFIG };

// Read user's preferred voice speed from localStorage
if (typeof window !== "undefined") {
  const savedSpeed = localStorage.getItem("aurum_voice_speed");
  if (savedSpeed) {
    const parsed = parseFloat(savedSpeed);
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
      config.ttsRate = parsed;
    }
  }
}

// Pre-load voices so they're ready when needed (Chrome loads them async)
let voicesLoaded = false;
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.getVoices(); // Trigger initial load
  speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
    // Auto-select best pt-BR voice
    const voices = speechSynthesis.getVoices();
    const ptBrVoices = voices.filter((v) => v.lang === "pt-BR" || v.lang.startsWith("pt"));
    // Prefer Google voices (higher quality)
    const googleVoice = ptBrVoices.find((v) => v.name.toLowerCase().includes("google"));
    const localVoice = ptBrVoices.find((v) => v.localService);
    const bestVoice = googleVoice ?? localVoice ?? ptBrVoices[0];
    if (bestVoice && !config.ttsVoiceURI) {
      config.ttsVoiceURI = bestVoice.voiceURI;
      console.log(`[Aurum Voice] Auto-selected voice: ${bestVoice.name} (${bestVoice.lang})`);
    }
  };
}

export function setVoiceConfig(c: Partial<VoiceConfig>): void {
  config = { ...config, ...c };
}

// Listen for localStorage changes from Settings page (same-tab via custom event)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "aurum_voice_speed" && e.newValue) {
      const val = parseFloat(e.newValue);
      if (!isNaN(val)) config.ttsRate = val;
    }
  });
}

export function getVoiceConfig(): VoiceConfig {
  return { ...config };
}

// ── Audio Analysis (Web Audio API) ──
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let micStream: MediaStream | null = null;

export function getAudioLevel(): number {
  if (!analyser) return 0;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return sum / (data.length * 255);
}

async function initAudioContext(): Promise<void> {
  if (audioContext) return;
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
}

async function connectMic(): Promise<void> {
  await initAudioContext();
  if (!audioContext || !analyser) return;

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
  } catch (err) {
    console.warn("Aurum: Mic access denied", err);
  }
}

function disconnectMic(): void {
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
}

// ── TTS (Text-to-Speech) ──
// Uses Edge TTS API (high quality Neural voices) with Web Speech API fallback

let currentUtterance: SpeechSynthesisUtterance | null = null;
let chromeBugInterval: ReturnType<typeof setInterval> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let ttsEngine: "edge" | "web" = "edge"; // Prefer Edge TTS

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export function speak(text: string, opts?: SpeakOptions): void {
  stopSpeak();

  if (ttsEngine === "edge") {
    speakEdgeTTS(text, opts);
  } else {
    speakWebSpeech(text, opts);
  }
}

// Edge TTS — high quality Neural voices via /api/tts
function speakEdgeTTS(text: string, opts?: SpeakOptions): void {
  opts?.onStart?.();

  fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`TTS API error: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        opts?.onEnd?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        // Fallback to Web Speech API
        console.warn("[Aurum Voice] Edge TTS playback failed, falling back to Web Speech");
        ttsEngine = "web";
        speakWebSpeech(text, opts);
      };

      audio.playbackRate = 1.2;
      audio.play().catch(() => {
        // Autoplay blocked — fallback
        ttsEngine = "web";
        speakWebSpeech(text, opts);
      });
    })
    .catch((err) => {
      console.warn("[Aurum Voice] Edge TTS failed, falling back to Web Speech:", err);
      ttsEngine = "web";
      speakWebSpeech(text, opts);
    });
}

// Web Speech API — browser built-in (fallback)
function speakWebSpeech(text: string, opts?: SpeakOptions): void {
  if (!("speechSynthesis" in window)) {
    opts?.onError?.("TTS not supported");
    opts?.onEnd?.();
    return;
  }

  // Always read the latest speed from localStorage (survives module re-init)
  const savedSpeed = localStorage.getItem("aurum_voice_speed");
  const liveRate = savedSpeed ? parseFloat(savedSpeed) : config.ttsRate;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = config.language;
  utterance.rate = !isNaN(liveRate) ? liveRate : config.ttsRate;
  utterance.pitch = config.ttsPitch;

  const voices = speechSynthesis.getVoices();
  if (config.ttsVoiceURI) {
    const preferred = voices.find((v) => v.voiceURI === config.ttsVoiceURI);
    if (preferred) utterance.voice = preferred;
  } else {
    const langVoice = voices.find((v) => v.lang.startsWith(config.language.slice(0, 2)) && v.localService);
    if (langVoice) utterance.voice = langVoice;
  }

  utterance.onstart = () => opts?.onStart?.();
  utterance.onend = () => {
    clearChromeBug();
    currentUtterance = null;
    opts?.onEnd?.();
  };
  utterance.onerror = (e) => {
    clearChromeBug();
    currentUtterance = null;
    if (e.error !== "interrupted") opts?.onError?.(e.error);
    opts?.onEnd?.();
  };

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);

  chromeBugInterval = setInterval(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      speechSynthesis.resume();
    }
  }, 14000);
}

function clearChromeBug(): void {
  if (chromeBugInterval) {
    clearInterval(chromeBugInterval);
    chromeBugInterval = null;
  }
}

export function stopSpeak(): void {
  clearChromeBug();
  // Stop Edge TTS audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // Stop Web Speech
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused) return true;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return speechSynthesis.speaking;
  }
  return false;
}

export function setTTSEngine(engine: "edge" | "web"): void {
  ttsEngine = engine;
}

// ── STT (Speech-to-Text) ──

interface ListenOptions {
  onResult: (transcript: string) => void;
  onPartial?: (transcript: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  onAudioLevel?: (level: number) => void;
  continuous?: boolean;
  /** Auto-stop after this many ms of silence (default: 2500) */
  silenceTimeout?: number;
  /** Auto-stop after this many ms total (default: 30000) */
  maxDuration?: number;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export function startListening(opts: ListenOptions): () => void {
  if (!isSpeechRecognitionSupported()) {
    opts.onError?.("STT not supported in this browser");
    opts.onEnd?.();
    return () => {};
  }

  const SRConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SRConstructor();
  recognition.lang = config.language;
  recognition.interimResults = true;
  // Always use continuous mode — we handle stop ourselves via silence detection
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let stopped = false;
  let audioLevelRaf: number | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let accumulatedFinal = "";
  let lastSpeechAt = Date.now();

  const silenceMs = opts.silenceTimeout ?? 2500;
  const maxMs = opts.maxDuration ?? 30000;

  // Reset silence timer whenever speech is detected
  function resetSilenceTimer() {
    lastSpeechAt = Date.now();
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      // Silence detected — if we have accumulated text, send it
      if (!stopped && accumulatedFinal.trim()) {
        stopped = true;
        try { recognition.stop(); } catch { /* ok */ }
      } else if (!stopped) {
        // No speech at all — just end
        stopped = true;
        try { recognition.stop(); } catch { /* ok */ }
      }
    }, silenceMs);
  }

  // Connect mic for audio analysis
  connectMic().then(() => {
    if (opts.onAudioLevel && !stopped) {
      const pump = () => {
        if (stopped) return;
        opts.onAudioLevel!(getAudioLevel());
        audioLevelRaf = requestAnimationFrame(pump);
      };
      pump();
    }
  });

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let newFinal = "";
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        newFinal += transcript;
      } else {
        interim += transcript;
      }
    }
    if (interim) {
      resetSilenceTimer();
      opts.onPartial?.(accumulatedFinal + interim);
    }
    if (newFinal) {
      accumulatedFinal += newFinal;
      resetSilenceTimer();
      opts.onPartial?.(accumulatedFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "no-speech") {
      // No speech detected — keep waiting (silence timer will handle stop)
      return;
    }
    if (event.error !== "aborted") {
      opts.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    clearTimers();
    if (accumulatedFinal.trim()) {
      opts.onResult(accumulatedFinal.trim());
    }
    if (!stopped) opts.onEnd?.();
    stopped = true;
    cleanup();
  };

  // Start
  recognition.start();
  resetSilenceTimer();

  // Max duration safety
  maxTimer = setTimeout(() => {
    if (!stopped) {
      stopped = true;
      try { recognition.stop(); } catch { /* ok */ }
    }
  }, maxMs);

  function clearTimers() {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    if (maxTimer) { clearTimeout(maxTimer); maxTimer = null; }
  }

  function cleanup() {
    stopped = true;
    clearTimers();
    disconnectMic();
    if (audioLevelRaf) cancelAnimationFrame(audioLevelRaf);
  }

  return () => {
    if (!stopped) {
      stopped = true;
      // If manually stopped, still deliver accumulated text
      if (accumulatedFinal.trim()) {
        try { recognition.stop(); } catch { /* ok */ }
        // onend will fire and deliver the result
        return;
      }
      try { recognition.stop(); } catch { /* ok */ }
    }
    cleanup();
  };
}

// ── Available Voices ──

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  return speechSynthesis.getVoices();
}

export function getSupportedLanguages(): string[] {
  return ["pt-BR", "en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "ja-JP", "ko-KR", "zh-CN"];
}

// ── Legacy compatibility ──

export async function generateResponse(text: string): Promise<string> {
  // Placeholder — use aurum-ai.ts instead
  await new Promise((r) => setTimeout(r, 300));
  return `Recebi: "${text}". Configure uma API key para respostas reais.`;
}
