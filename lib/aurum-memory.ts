// ─────────────────────────────────────────────
// Aurum Memory Service v2
// Persistent conversation history & user preferences
// Supabase sync + localStorage fallback
// Semantic search ready (embeddings placeholder)
// ─────────────────────────────────────────────

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface ChatMessage {
  role: "user" | "aurum";
  content: string;
  timestamp: number;
}

export interface MemoryNote {
  id: string;
  content: string;
  tags: string[];
  importance: "alta" | "média" | "baixa";
  category: string;
  createdAt: string;
  embedding?: number[]; // For semantic search (future)
}

export interface AurumMemory {
  conversations: ChatMessage[];
  notes: MemoryNote[];
  userName?: string;
  preferredLanguage: string;
  totalInteractions: number;
  firstUse: number;
  lastUse: number;
  settings: Record<string, unknown>;
}

// ── Storage Keys ──
const STORAGE_KEY = "aurum_memory";
const MAX_HISTORY = 2000; // Keep 2000 messages for infinite conversation

// ── Supabase (optional) ──
let supabase: SupabaseClient | null = null;

export function initSupabaseMemory(url: string, anonKey: string): void {
  try {
    supabase = createClient(url, anonKey);
  } catch {
    console.warn("Aurum: Failed to init Supabase memory");
  }
}

// ── LocalStorage operations ──

function getDefault(): AurumMemory {
  return {
    conversations: [],
    notes: [],
    preferredLanguage: "pt-BR",
    totalInteractions: 0,
    firstUse: Date.now(),
    lastUse: Date.now(),
    settings: {},
  };
}

export function loadMemory(): AurumMemory {
  if (typeof window === "undefined") return getDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw);
    return { ...getDefault(), ...parsed };
  } catch {
    return getDefault();
  }
}

export function saveMemory(memory: AurumMemory): void {
  if (typeof window === "undefined") return;
  try {
    if (memory.conversations.length > MAX_HISTORY) {
      memory.conversations = memory.conversations.slice(-MAX_HISTORY);
    }
    memory.lastUse = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));

    // Async sync to Supabase (non-blocking)
    syncToSupabase(memory).catch(() => {});
  } catch { /* storage full */ }
}

// ── Message operations ──

export function addMessage(msg: ChatMessage): void {
  const mem = loadMemory();
  mem.conversations.push(msg);
  mem.totalInteractions++;
  saveMemory(mem);
}

export function getRecentContext(count = 20): ChatMessage[] {
  const mem = loadMemory();
  return mem.conversations.slice(-count);
}

export function clearConversations(): void {
  const mem = loadMemory();
  mem.conversations = [];
  saveMemory(mem);
}

// ── Notes / Memory operations ──

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const AUTO_CATEGORIES = [
  { keywords: ["trabalho", "projeto", "reunião", "cliente", "deadline"], category: "Trabalho" },
  { keywords: ["estudar", "aprender", "curso", "livro", "aula"], category: "Estudos" },
  { keywords: ["comprar", "pagar", "dinheiro", "conta", "salário"], category: "Finanças" },
  { keywords: ["saúde", "médico", "exercício", "academia", "dieta"], category: "Saúde" },
  { keywords: ["casa", "limpeza", "cozinhar", "mercado"], category: "Casa" },
  { keywords: ["ideia", "insight", "pensar", "conceito"], category: "Ideias" },
];

function autoCategorizate(content: string): string {
  const lower = content.toLowerCase();
  for (const rule of AUTO_CATEGORIES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }
  return "Geral";
}

export function addNote(
  content: string,
  tags: string[] = [],
  importance: MemoryNote["importance"] = "média",
  category?: string,
): MemoryNote {
  const mem = loadMemory();
  const note: MemoryNote = {
    id: genId(),
    content,
    tags,
    importance,
    category: category ?? autoCategorizate(content),
    createdAt: new Date().toISOString(),
  };
  mem.notes.unshift(note);
  saveMemory(mem);
  return note;
}

export function updateNote(id: string, updates: Partial<MemoryNote>): void {
  const mem = loadMemory();
  const idx = mem.notes.findIndex((n) => n.id === id);
  if (idx >= 0) {
    mem.notes[idx] = { ...mem.notes[idx], ...updates };
    saveMemory(mem);
  }
}

export function deleteNote(id: string): void {
  const mem = loadMemory();
  mem.notes = mem.notes.filter((n) => n.id !== id);
  saveMemory(mem);
}

export function searchNotes(query: string): MemoryNote[] {
  const mem = loadMemory();
  const lower = query.toLowerCase();
  return mem.notes.filter(
    (n) =>
      n.content.toLowerCase().includes(lower) ||
      n.tags.some((t) => t.toLowerCase().includes(lower)) ||
      n.category.toLowerCase().includes(lower),
  );
}

export function getNotesByCategory(): Record<string, MemoryNote[]> {
  const mem = loadMemory();
  const grouped: Record<string, MemoryNote[]> = {};
  for (const note of mem.notes) {
    if (!grouped[note.category]) grouped[note.category] = [];
    grouped[note.category].push(note);
  }
  return grouped;
}

// ── Export ──

export function exportToMarkdown(): string {
  const mem = loadMemory();
  let md = "# Aurum Memory Export\n\n";
  md += `_Exportado em ${new Date().toLocaleString("pt-BR")}_\n\n`;

  // Conversations
  md += "## Conversas\n\n";
  for (const msg of mem.conversations.slice(-50)) {
    const time = new Date(msg.timestamp).toLocaleString("pt-BR");
    md += `**${msg.role === "user" ? "Você" : "Aurum"}** (${time}):\n${msg.content}\n\n`;
  }

  // Notes
  if (mem.notes.length > 0) {
    md += "## Notas\n\n";
    const grouped = getNotesByCategory();
    for (const [cat, notes] of Object.entries(grouped)) {
      md += `### ${cat}\n\n`;
      for (const n of notes) {
        md += `- **[${n.importance}]** ${n.content}`;
        if (n.tags.length > 0) md += ` _(${n.tags.join(", ")})_`;
        md += `\n`;
      }
      md += "\n";
    }
  }

  return md;
}

// ── Greeting ──

export function getGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName.split(" ")[0]}` : "";
  if (hour >= 5 && hour < 12) return `Bom dia${name}! Como posso ajudar?`;
  if (hour >= 12 && hour < 18) return `Boa tarde${name}! No que posso ajudar?`;
  return `Boa noite${name}! Como posso ajudar?`;
}

// ── Stats ──

export function getMemoryStats() {
  const mem = loadMemory();
  return {
    totalMessages: mem.conversations.length,
    totalNotes: mem.notes.length,
    totalInteractions: mem.totalInteractions,
    firstUse: mem.firstUse,
    lastUse: mem.lastUse,
    categories: [...new Set(mem.notes.map((n) => n.category))],
  };
}

// ── Supabase sync (async, non-blocking) ──

async function syncToSupabase(memory: AurumMemory): Promise<void> {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("aurum_memory")
      .upsert({
        user_id: user.id,
        conversations: memory.conversations.slice(-100), // Last 100 for DB
        notes: memory.notes,
        settings: memory.settings,
        total_interactions: memory.totalInteractions,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  } catch {
    // Sync failed — data still safe in localStorage
  }
}

export async function loadFromSupabase(): Promise<void> {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("aurum_memory")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const mem = loadMemory();
      // Merge: prefer local for conversations, Supabase for notes
      if (data.notes && data.notes.length > mem.notes.length) {
        mem.notes = data.notes;
      }
      if (data.settings) {
        mem.settings = { ...mem.settings, ...data.settings };
      }
      saveMemory(mem);
    }
  } catch {
    // Load failed — use local data
  }
}

// ── Context retrieval for AI ──

export function getRelevantContext(query: string, maxItems = 5): string {
  const notes = searchNotes(query);
  if (notes.length === 0) return "";

  const relevant = notes.slice(0, maxItems);
  let context = "Notas relevantes do usuário:\n";
  for (const n of relevant) {
    context += `- [${n.category}] ${n.content}\n`;
  }
  return context;
}
