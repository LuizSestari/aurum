// ─────────────────────────────────────────────
// Aurum Plan System
// Defines Free, Pro, Max, Teams tiers
// ─────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "max" | "teams";

export interface PlanLimits {
  aiMessagesPerMonth: number;       // -1 = unlimited
  ttsCharactersPerMonth: number;    // -1 = unlimited
  voiceMinutesPerMonth: number;     // -1 = unlimited
  maxTasks: number;                 // -1 = unlimited
  maxProjects: number;              // -1 = unlimited
  maxHabits: number;                // -1 = unlimited
  maxNotebooks: number;             // -1 = unlimited
  storageGB: number;
  teamMembers: number;              // 0 = no team
}

export interface PlanFeatures {
  voiceConversation: boolean;
  continuousMode: boolean;
  elevenlabsVoice: boolean;
  customVoices: boolean;
  aiModels: string[];               // which AI models available
  visionBoard: boolean;
  kanbanBoard: boolean;
  financeAnalysis: boolean;
  advancedAnalytics: boolean;
  n8nAutomations: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  dedicatedAccount: boolean;
  sso: boolean;
  auditLogs: boolean;
  dataExport: boolean;
  whiteLabel: boolean;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;           // BRL
  priceYearly: number;            // BRL (per month)
  popular?: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
  highlights: string[];           // marketing bullets
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Para conhecer o Aurum",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      aiMessagesPerMonth: 50,
      ttsCharactersPerMonth: 5000,
      voiceMinutesPerMonth: 10,
      maxTasks: 20,
      maxProjects: 3,
      maxHabits: 5,
      maxNotebooks: 5,
      storageGB: 0.1,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: false,
      elevenlabsVoice: false,
      customVoices: false,
      aiModels: ["groq"],
      visionBoard: false,
      kanbanBoard: false,
      financeAnalysis: false,
      advancedAnalytics: false,
      n8nAutomations: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      dedicatedAccount: false,
      sso: false,
      auditLogs: false,
      dataExport: false,
      whiteLabel: false,
    },
    highlights: [
      "50 mensagens IA/mês",
      "Voz básica (Google TTS)",
      "20 tarefas, 5 hábitos",
      "3 projetos",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para uso pessoal avançado",
    priceMonthly: 29.90,
    priceYearly: 19.90,
    popular: true,
    limits: {
      aiMessagesPerMonth: 1000,
      ttsCharactersPerMonth: 100000,
      voiceMinutesPerMonth: 120,
      maxTasks: -1,
      maxProjects: -1,
      maxHabits: -1,
      maxNotebooks: -1,
      storageGB: 5,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: true,
      customVoices: false,
      aiModels: ["groq", "anthropic", "gemini"],
      visionBoard: true,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: true,
      n8nAutomations: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      dedicatedAccount: false,
      sso: false,
      auditLogs: false,
      dataExport: true,
      whiteLabel: false,
    },
    highlights: [
      "1.000 mensagens IA/mês",
      "Voz ElevenLabs realista",
      "Modo contínuo de conversa",
      "Tarefas, hábitos e projetos ilimitados",
      "Visão, Kanban e análise financeira",
      "Exportação de dados",
    ],
  },
  max: {
    id: "max",
    name: "Max",
    description: "Sem limites, máximo poder",
    priceMonthly: 79.90,
    priceYearly: 59.90,
    limits: {
      aiMessagesPerMonth: -1,
      ttsCharactersPerMonth: -1,
      voiceMinutesPerMonth: -1,
      maxTasks: -1,
      maxProjects: -1,
      maxHabits: -1,
      maxNotebooks: -1,
      storageGB: 50,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: true,
      customVoices: true,
      aiModels: ["groq", "anthropic", "gemini", "openai", "ollama"],
      visionBoard: true,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: true,
      n8nAutomations: true,
      apiAccess: true,
      customBranding: false,
      prioritySupport: true,
      dedicatedAccount: false,
      sso: false,
      auditLogs: false,
      dataExport: true,
      whiteLabel: false,
    },
    highlights: [
      "Mensagens IA ilimitadas",
      "Voz ilimitada com vozes personalizadas",
      "Todos os modelos de IA",
      "Automações n8n integradas",
      "Acesso à API",
      "Suporte prioritário",
      "50 GB de armazenamento",
    ],
  },
  teams: {
    id: "teams",
    name: "Teams",
    description: "Para equipes e empresas",
    priceMonthly: 49.90,  // per seat
    priceYearly: 39.90,
    limits: {
      aiMessagesPerMonth: -1,
      ttsCharactersPerMonth: -1,
      voiceMinutesPerMonth: -1,
      maxTasks: -1,
      maxProjects: -1,
      maxHabits: -1,
      maxNotebooks: -1,
      storageGB: 100,
      teamMembers: 50,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: true,
      customVoices: true,
      aiModels: ["groq", "anthropic", "gemini", "openai", "ollama"],
      visionBoard: true,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: true,
      n8nAutomations: true,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      dedicatedAccount: true,
      sso: true,
      auditLogs: true,
      dataExport: true,
      whiteLabel: false,
    },
    highlights: [
      "Tudo do Max + colaboração",
      "Até 50 membros por time",
      "SSO / SAML",
      "Logs de auditoria",
      "Branding personalizado",
      "Gerente de conta dedicado",
      "100 GB armazenamento",
      "R$49,90/membro/mês",
    ],
  },
};

// Check if user has access to a feature
export function hasFeature(plan: PlanTier, feature: keyof PlanFeatures): boolean {
  const val = PLANS[plan]?.features?.[feature];
  if (Array.isArray(val)) return val.length > 0;
  return val ?? false;
}

// Check if user is within their usage limits
export function isWithinLimit(
  plan: PlanTier,
  limitKey: keyof PlanLimits,
  currentUsage: number
): boolean {
  const limit = PLANS[plan]?.limits?.[limitKey];
  if (limit === undefined) return false;
  if (limit === -1) return true; // unlimited
  return currentUsage < limit;
}

// Format price
export function formatPrice(value: number): string {
  if (value === 0) return "Grátis";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Get upgrade suggestion based on what feature/limit was hit
export function getUpgradeSuggestion(currentPlan: PlanTier, blockedFeature?: string): PlanTier | null {
  const order: PlanTier[] = ["free", "pro", "max", "teams"];
  const idx = order.indexOf(currentPlan);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}
