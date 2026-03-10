// ─────────────────────────────────────────────
// Aurum AI Service v2
// Multi-provider streaming engine
// Rate limiting, response cache, interaction logging
// Context injection from memory
// ─────────────────────────────────────────────

import { getRecentContext, getRelevantContext, type ChatMessage } from "./aurum-memory";

export type AIProvider = "openai" | "anthropic" | "local" | "server" | "groq" | "ollama";

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

// ── Default system prompt (JARVIS-style) ──
const DEFAULT_SYSTEM_PROMPT = `Você é Aurum, assistente pessoal de elite estilo JARVIS. Tom confiante, direto, eficiente. Português brasileiro.

REGRAS:
- NUNCA faça perguntas desnecessárias. Se o usuário pedir algo, FAÇA.
- Respostas curtas para ações (1-2 frases). Conversas normais podem ser mais longas.
- NUNCA diga "quer que eu faça?", "posso criar?", "deseja que eu adicione?" — apenas FAÇA.
- Confirme ações em uma frase: "Feito. Tarefa X adicionada com prioridade alta."

Contexto: Plataforma Aurum — assistente premium com voz, visão e gestão de vida.`;

// ── Config with auto-detection and persistence ──
const AI_CONFIG_KEY = "aurum_ai_config";

function loadSavedConfig(): Partial<AIConfig> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {};
}

function detectBestProvider(): AIConfig {
  const saved = loadSavedConfig();

  // If user has explicitly configured a provider with an API key, use it
  if (saved.provider && saved.provider !== "local" && saved.apiKey) {
    return {
      provider: saved.provider,
      apiKey: saved.apiKey,
      model: saved.model,
      systemPrompt: saved.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      temperature: saved.temperature ?? 0.7,
      maxTokens: saved.maxTokens ?? 2048,
    };
  }

  // Auto-detect from keys injected into window by the config loader
  if (typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    if (win.__AURUM_ANTHROPIC_KEY) {
      return {
        provider: "anthropic",
        apiKey: win.__AURUM_ANTHROPIC_KEY as string,
        model: "claude-sonnet-4-20250514",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2048,
      };
    }
    if (win.__AURUM_OPENAI_KEY) {
      return {
        provider: "openai",
        apiKey: win.__AURUM_OPENAI_KEY as string,
        model: "gpt-4o-mini",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2048,
      };
    }
  }

  return {
    provider: saved.provider ?? "local",
    apiKey: saved.apiKey,
    model: saved.model,
    systemPrompt: saved.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    temperature: saved.temperature ?? 0.7,
    maxTokens: saved.maxTokens ?? 2048,
  };
}

let currentConfig: AIConfig = detectBestProvider();

export function setAIConfig(config: Partial<AIConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  // Persist so it survives page reloads
  if (typeof window !== "undefined") {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(currentConfig));
  }
}

export function getAIConfig(): AIConfig {
  return { ...currentConfig };
}

/**
 * Re-run auto-detection. Call this after API keys are injected into window.
 */
export function redetectProvider(): void {
  const detected = detectBestProvider();
  if (detected.provider !== "local" && currentConfig.provider === "local") {
    currentConfig = detected;
    console.log(`[Aurum AI] Auto-detected provider: ${detected.provider}`);
  }
}

// Auto re-detect shortly after module load (allows window.__AURUM_* to be set first)
if (typeof window !== "undefined") {
  setTimeout(redetectProvider, 200);
}

// ── Rate Limiter ──
const rateLimiter = {
  tokens: 10,
  maxTokens: 10,
  refillRate: 1, // per second
  lastRefill: Date.now(),

  canMakeRequest(): boolean {
    this.refill();
    return this.tokens > 0;
  },

  consume(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  },

  refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  },
};

// ── Response Cache ──
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(text: string): string {
  return text.toLowerCase().trim().slice(0, 200);
}

function getCachedResponse(text: string): string | null {
  const key = getCacheKey(text);
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.response;
  }
  if (entry) responseCache.delete(key);
  return null;
}

function cacheResponse(text: string, response: string): void {
  const key = getCacheKey(text);
  responseCache.set(key, { response, timestamp: Date.now() });
  // Limit cache size
  if (responseCache.size > 100) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
}

// ── Interaction Logging ──
interface InteractionLog {
  timestamp: string;
  provider: AIProvider;
  model: string;
  inputLength: number;
  outputLength: number;
  durationMs: number;
  cached: boolean;
  error?: string;
}

const interactionLogs: InteractionLog[] = [];

export function getInteractionLogs(limit = 50): InteractionLog[] {
  return interactionLogs.slice(0, limit);
}

export function getAIStats() {
  const total = interactionLogs.length;
  const errors = interactionLogs.filter((l) => l.error).length;
  const cached = interactionLogs.filter((l) => l.cached).length;
  const avgDuration = total > 0
    ? Math.round(interactionLogs.reduce((s, l) => s + l.durationMs, 0) / total)
    : 0;
  return { total, errors, cached, avgDuration };
}

// ── Resolve the active provider (handles Turbopack module duplication) ──
// Instead of relying on module-scoped currentConfig alone, we also check
// window globals and localStorage on EVERY call. Turbopack can create
// multiple module instances, so the ConfigLoader may have updated a
// different instance's currentConfig.

function resolveActiveConfig(): AIConfig {
  // 1. If this instance already has a real provider, use it
  if (currentConfig.provider !== "local" && currentConfig.apiKey) {
    return currentConfig;
  }

  // 2. Check localStorage (another module instance may have saved it)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(AI_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AIConfig;
        if (parsed.provider && parsed.provider !== "local" && parsed.apiKey) {
          currentConfig = { ...currentConfig, ...parsed };
          return currentConfig;
        }
      }
    } catch { /* ignore */ }

    // 3. Check window globals (set by ConfigLoader)
    const win = window as unknown as Record<string, unknown>;
    if (win.__AURUM_ANTHROPIC_KEY) {
      currentConfig = {
        ...currentConfig,
        provider: "anthropic",
        apiKey: win.__AURUM_ANTHROPIC_KEY as string,
        model: currentConfig.model ?? "claude-sonnet-4-20250514",
      };
      return currentConfig;
    }
    if (win.__AURUM_OPENAI_KEY) {
      currentConfig = {
        ...currentConfig,
        provider: "openai",
        apiKey: win.__AURUM_OPENAI_KEY as string,
        model: currentConfig.model ?? "gpt-4o-mini",
      };
      return currentConfig;
    }
  }

  return currentConfig;
}

// Also fetch from server if everything else fails
let _serverFetched = false;

async function fetchServerConfig(): Promise<void> {
  if (_serverFetched) return;
  _serverFetched = true;

  try {
    const response = await fetch("/api/config");
    if (!response.ok) return;
    const data = await response.json();
    const win = typeof window !== "undefined"
      ? (window as unknown as Record<string, unknown>)
      : ({} as Record<string, unknown>);

    if (data.anthropicKey) {
      win.__AURUM_ANTHROPIC_KEY = data.anthropicKey;
      currentConfig = {
        ...currentConfig,
        provider: "anthropic",
        apiKey: data.anthropicKey,
        model: "claude-sonnet-4-20250514",
      };
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(currentConfig));
      console.log("[Aurum AI] Configured Anthropic from server API");
    } else if (data.openaiKey) {
      win.__AURUM_OPENAI_KEY = data.openaiKey;
      currentConfig = {
        ...currentConfig,
        provider: "openai",
        apiKey: data.openaiKey,
        model: "gpt-4o-mini",
      };
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(currentConfig));
      console.log("[Aurum AI] Configured OpenAI from server API");
    }
  } catch {
    // Server not available
  }
}

// ── Server-side API call (bypasses all client-side config issues) ──
async function generateViaServer(
  userText: string,
  history: ChatMessage[],
  callbacks?: StreamCallbacks,
): Promise<string> {
  console.log("[Aurum AI] Calling /api/chat (server-side)...");

  const historyForServer = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const useStream = !!callbacks?.onToken;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userText,
      history: historyForServer,
      stream: useStream,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errData.error ?? `Server error: ${response.status}`);
  }

  if (useStream && response.body) {
    let full = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === "content_block_delta") {
            const token = parsed.delta?.text ?? "";
            if (token) { full += token; callbacks!.onToken!(token); }
          }
        } catch { /* skip */ }
      }
    }
    callbacks!.onComplete?.(full);
    return full;
  }

  const data = await response.json();
  console.log(`[Aurum AI] Response from server: provider=${data.provider}, model=${data.model}`);
  callbacks?.onComplete?.(data.reply);
  return data.reply;
}

// ── Main generate function ──
export async function generateAIResponse(
  userText: string,
  callbacks?: StreamCallbacks,
): Promise<string> {
  const startTime = Date.now();

  // Rate limiting
  if (!rateLimiter.consume()) {
    const msg = "Muitas requisições. Aguarde um momento...";
    callbacks?.onError?.(msg);
    return msg;
  }

  // Check cache (only for non-streaming)
  if (!callbacks?.onToken) {
    const cached = getCachedResponse(userText);
    if (cached) {
      interactionLogs.unshift({
        timestamp: new Date().toISOString(),
        provider: currentConfig.provider,
        model: currentConfig.model ?? "cached",
        inputLength: userText.length,
        outputLength: cached.length,
        durationMs: 0,
        cached: true,
      });
      callbacks?.onComplete?.(cached);
      return cached;
    }
  }

  // Get context from memory — send 50 messages for infinite conversation continuity
  const context = getRecentContext(50);
  const relevantNotes = getRelevantContext(userText, 5);

  let result: string;

  try {
    // ★ NUCLEAR FIX: Always try server-side API first.
    // This completely bypasses Turbopack module duplication issues
    // because the server uses process.env keys directly.
    result = await generateViaServer(userText, context, callbacks);

    // Cache the result
    cacheResponse(userText, result);

    // Log
    interactionLogs.unshift({
      timestamp: new Date().toISOString(),
      provider: "server",
      model: "server-proxy",
      inputLength: userText.length,
      outputLength: result.length,
      durationMs: Date.now() - startTime,
      cached: false,
    });
    if (interactionLogs.length > 200) interactionLogs.length = 200;

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Aurum AI] Server API failed:", errorMsg);

    // Show a helpful error message instead of silently falling back to local
    let userFacingError: string;
    if (errorMsg.includes("Ollama") && errorMsg.includes("timeout")) {
      userFacingError = "⚠️ **Ollama não está rodando**\n\nPara usar IA local ilimitada:\n1. Instale o Ollama: [ollama.com](https://ollama.com)\n2. Execute: `ollama serve`\n3. Baixe um modelo: `ollama pull llama3.2`\n4. Recarregue esta página";
    } else if (errorMsg.includes("não tem modelos")) {
      userFacingError = "⚠️ **Ollama sem modelos**\n\nO Ollama está rodando mas sem modelos instalados.\n\nExecute no terminal:\n```\nollama pull llama3.2\n```";
    } else if (errorMsg.includes("401")) {
      userFacingError = "⚠️ **Erro de autenticação da API**\n\nA chave da API Anthropic no `.env.local` é **inválida ou expirada**.\n\nPara corrigir:\n1. Acesse [console.anthropic.com](https://console.anthropic.com)\n2. Gere uma nova API key\n3. Atualize `ANTHROPIC_API_KEY` no arquivo `.env.local`\n4. Reinicie o servidor (`npm run dev`)";
    } else if (errorMsg.includes("429")) {
      userFacingError = "⚠️ **Limite de requisições excedido**\n\nA cota da API Gemini (free tier) foi **esgotada**.\n\nPara corrigir:\n- Aguarde o reset da cota (geralmente 1 minuto)\n- Ou configure uma chave paga em [ai.google.dev](https://ai.google.dev)\n- Ou adicione uma `ANTHROPIC_API_KEY` válida no `.env.local`";
    } else {
      userFacingError = `⚠️ **Erro ao conectar com a IA**: ${errorMsg}\n\nVerifique se o Ollama está rodando (\`ollama serve\`) ou suas API keys no \`.env.local\`.`;
    }

    // Log the error
    interactionLogs.unshift({
      timestamp: new Date().toISOString(),
      provider: currentConfig.provider,
      model: currentConfig.model ?? "local",
      inputLength: userText.length,
      outputLength: 0,
      durationMs: Date.now() - startTime,
      cached: false,
      error: errorMsg,
    });

    // Show error to user via streaming or direct
    if (callbacks?.onToken) {
      const words = userFacingError.split(" ");
      for (let i = 0; i < words.length; i++) {
        callbacks.onToken((i > 0 ? " " : "") + words[i]);
      }
      callbacks.onComplete?.(userFacingError);
    } else {
      callbacks?.onComplete?.(userFacingError);
    }

    return userFacingError;
  }
}

// ── OpenAI Provider ──
async function generateOpenAI(
  userText: string, context: ChatMessage[], notes: string, callbacks?: StreamCallbacks,
): Promise<string> {
  let apiKey = currentConfig.apiKey;
  if (!apiKey && typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    apiKey = win.__AURUM_OPENAI_KEY as string | undefined;
  }
  if (!apiKey) return generateLocal(userText, callbacks);

  const systemMsg = (currentConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT) + (notes ? `\n\n${notes}` : "");
  const messages = [
    { role: "system" as const, content: systemMsg },
    ...context.map((m) => ({
      role: m.role === "aurum" ? "assistant" as const : "user" as const,
      content: m.content,
    })),
    { role: "user" as const, content: userText },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: currentConfig.model ?? "gpt-4o-mini",
      messages,
      temperature: currentConfig.temperature ?? 0.7,
      max_tokens: currentConfig.maxTokens ?? 2048,
      stream: !!callbacks?.onToken,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

  if (callbacks?.onToken && response.body) {
    let full = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
          if (token) { full += token; callbacks.onToken(token); }
        } catch { /* skip */ }
      }
    }
    callbacks.onComplete?.(full);
    return full;
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "Desculpe, erro na resposta.";
  callbacks?.onComplete?.(reply);
  return reply;
}

// ── Anthropic Provider ──
async function generateAnthropic(
  userText: string, context: ChatMessage[], notes: string, callbacks?: StreamCallbacks,
): Promise<string> {
  // Resolve API key: try currentConfig, then window global, then fetch from server
  let apiKey = currentConfig.apiKey;
  if (!apiKey && typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    apiKey = win.__AURUM_ANTHROPIC_KEY as string | undefined;
  }
  if (!apiKey) {
    console.warn("[Aurum AI] No Anthropic API key found, falling back to local");
    return generateLocal(userText, callbacks);
  }

  const systemMsg = (currentConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT) + (notes ? `\n\n${notes}` : "");
  const messages = [
    ...context.map((m) => ({
      role: m.role === "aurum" ? "assistant" as const : "user" as const,
      content: m.content,
    })),
    { role: "user" as const, content: userText },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: currentConfig.model ?? "claude-sonnet-4-20250514",
      system: systemMsg,
      messages,
      max_tokens: currentConfig.maxTokens ?? 2048,
      stream: !!callbacks?.onToken,
    }),
  });

  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);

  if (callbacks?.onToken && response.body) {
    let full = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === "content_block_delta") {
            const token = parsed.delta?.text ?? "";
            if (token) { full += token; callbacks.onToken(token); }
          }
        } catch { /* skip */ }
      }
    }
    callbacks.onComplete?.(full);
    return full;
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text ?? "Desculpe, erro na resposta.";
  callbacks?.onComplete?.(reply);
  return reply;
}

// ── Local Provider (placeholder) ──
async function generateLocal(userText: string, callbacks?: StreamCallbacks): Promise<string> {
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 300));

  const lower = userText.toLowerCase();
  let reply: string;

  if (lower.includes("olá") || lower.includes("oi") || lower.includes("hey")) {
    reply = "Olá! Sou o **Aurum**, seu assistente pessoal. Como posso ajudar você hoje?";
  } else if (lower.includes("hora") || lower.includes("que horas")) {
    reply = `Agora são **${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}**.`;
  } else if (lower.includes("dia") || lower.includes("data") || lower.includes("hoje")) {
    reply = `Hoje é **${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}**.`;
  } else if (lower.includes("código") || lower.includes("code")) {
    reply = "Posso ajudar com programação! Aqui está um exemplo:\n\n```typescript\nconst aurum = {\n  name: 'Aurum',\n  status: 'ready',\n  version: '2.0'\n};\nconsole.log(aurum);\n```\n\nPara respostas avançadas, configure uma API key em ⚙️ Configurações.";
  } else {
    const responses = [
      `Entendi: **"${userText}"**.\n\nEstou em modo local. Configure uma **API key** (OpenAI ou Anthropic) em ⚙️ Configurações para respostas inteligentes.\n\nMesmo assim, posso ajudar com:\n- Navegação do app\n- Gestão de tarefas\n- Lembretes\n- Organização geral`,
      `Recebi: **"${userText}"**.\n\nPara respostas reais de IA, vá em ⚙️ **Configurações** > **API** e adicione sua chave.`,
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  }

  // Simulate streaming
  if (callbacks?.onToken) {
    const words = reply.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 15 + Math.random() * 25));
      callbacks.onToken((i > 0 ? " " : "") + words[i]);
    }
    callbacks.onComplete?.(reply);
  } else {
    callbacks?.onComplete?.(reply);
  }

  return reply;
}
