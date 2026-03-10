export const AURUM_CONFIG = {
  // Modelos disponíveis
  models: {
    ollama: {
      enabled: true,
      url: 'http://localhost:11434',
      model: 'llama2',
      timeout: 30000,
    },
    gemini: {
      enabled: true, // API key ativa no .env.local
      model: 'gemini-2.0-flash',
      timeout: 10000,
    },
    anthropic: {
      enabled: true, // API key ativa no .env.local
      model: 'claude-sonnet-4-20250514',
      timeout: 30000,
    },
  },

  // Estratégia de roteamento inteligente
  routing: {
    // low complexity → Ollama (grátis, local)
    // medium complexity → Gemini (grátis, API)
    // high complexity → Anthropic Claude (pago, melhor qualidade)
    strategy: 'smart' as const,
    default: 'anthropic',
    fallbackChain: ['anthropic', 'gemini', 'ollama'],
    autoSwitch: true,
  },

  // Configurações de performance
  performance: {
    maxLatency: 300, // ms target
    streaming: true,
    caching: true,
    cacheTTL: 5 * 60 * 1000,
    maxCacheEntries: 100,
    rateLimitTokens: 10,
  },

  // Configurações de voz
  voice: {
    enabled: true,
    language: 'pt-BR',
    sampleRate: 16000,
    sttEngine: 'web' as const,
    ttsRate: 1.05,
  },

  // Configurações de integração
  integrations: {
    obsidian: {
      enabled: true,
      url: 'http://localhost:27123',
    },
    n8n: {
      enabled: true,
      url: 'http://localhost:5678',
    },
  },

  // Self-improvement
  selfImprovement: {
    enabled: true,
    minFeedbackToAnalyze: 3,
    autoImproveInterval: 50,
  },
};
