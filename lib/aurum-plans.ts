// ─────────────────────────────────────────────
// Aurum Plan System
// Free, Starter (R$49.90), Pro (R$99.90), Max (R$499.90)
// ─────────────────────────────────────────────

export type PlanTier = "free" | "starter" | "pro" | "max";

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
  aiModels: string[];
  visionAI: boolean;
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
  highlights: string[];
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Para experimentar o Aurum",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      aiMessagesPerMonth: 30,
      ttsCharactersPerMonth: 3000,
      voiceMinutesPerMonth: 5,
      maxTasks: 10,
      maxProjects: 2,
      maxHabits: 3,
      maxNotebooks: 3,
      storageGB: 0.05,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: false,
      elevenlabsVoice: false,
      customVoices: false,
      aiModels: ["groq"],
      visionAI: false,
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
      "30 mensagens IA/mês",
      "Voz básica (Google TTS)",
      "10 tarefas, 3 hábitos",
      "2 projetos",
      "Chat com IA (Groq)",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Para quem quer mais do Aurum",
    priceMonthly: 49.90,
    priceYearly: 39.90,
    limits: {
      aiMessagesPerMonth: 500,
      ttsCharactersPerMonth: 50000,
      voiceMinutesPerMonth: 60,
      maxTasks: 100,
      maxProjects: 10,
      maxHabits: 15,
      maxNotebooks: 20,
      storageGB: 2,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: false,
      customVoices: false,
      aiModels: ["groq", "gemini"],
      visionAI: false,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: false,
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
      "500 mensagens IA/mês",
      "Modo contínuo de conversa",
      "100 tarefas, 15 hábitos, 10 projetos",
      "Controle financeiro completo",
      "Kanban e exportação de dados",
      "2 GB de armazenamento",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para produtividade máxima",
    priceMonthly: 99.90,
    priceYearly: 79.90,
    popular: true,
    limits: {
      aiMessagesPerMonth: 3000,
      ttsCharactersPerMonth: 300000,
      voiceMinutesPerMonth: 300,
      maxTasks: -1,
      maxProjects: -1,
      maxHabits: -1,
      maxNotebooks: -1,
      storageGB: 20,
      teamMembers: 5,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: true,
      customVoices: false,
      aiModels: ["groq", "anthropic", "gemini", "openai"],
      visionAI: true,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: true,
      n8nAutomations: true,
      apiAccess: false,
      customBranding: false,
      prioritySupport: true,
      dedicatedAccount: false,
      sso: false,
      auditLogs: false,
      dataExport: true,
      whiteLabel: false,
    },
    highlights: [
      "3.000 mensagens IA/mês",
      "Voz JARVIS (ElevenLabs)",
      "IA Multimodal com Visão",
      "Todos os modelos de IA premium",
      "Tudo ilimitado (tarefas, hábitos, projetos)",
      "Automações n8n integradas",
      "Analytics avançado",
      "Suporte prioritário",
    ],
  },
  max: {
    id: "max",
    name: "Max",
    description: "Sem limites. Poder absoluto.",
    priceMonthly: 499.90,
    priceYearly: 399.90,
    limits: {
      aiMessagesPerMonth: -1,
      ttsCharactersPerMonth: -1,
      voiceMinutesPerMonth: -1,
      maxTasks: -1,
      maxProjects: -1,
      maxHabits: -1,
      maxNotebooks: -1,
      storageGB: 100,
      teamMembers: 0,
    },
    features: {
      voiceConversation: true,
      continuousMode: true,
      elevenlabsVoice: true,
      customVoices: true,
      aiModels: ["groq", "anthropic", "gemini", "openai"],
      visionAI: true,
      kanbanBoard: true,
      financeAnalysis: true,
      advancedAnalytics: true,
      n8nAutomations: true,
      apiAccess: true,
      customBranding: false,
      prioritySupport: true,
      dedicatedAccount: true,
      sso: false,
      auditLogs: false,
      dataExport: true,
      whiteLabel: false,
    },
    highlights: [
      "TUDO ilimitado — mensagens, tarefas, hábitos",
      "Vozes personalizadas e clonagem",
      "Acesso à API para automações próprias",
      "Todos os modelos de IA premium",
      "Gerente de conta dedicado",
      "100 GB armazenamento",
      "Suporte prioritário 24/7",
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
  if (limit === -1) return true;
  return currentUsage < limit;
}

// Format price
export function formatPrice(value: number): string {
  if (value === 0) return "Grátis";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Get upgrade suggestion
export function getUpgradeSuggestion(currentPlan: PlanTier): PlanTier | null {
  const order: PlanTier[] = ["free", "starter", "pro", "max"];
  const idx = order.indexOf(currentPlan);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}
