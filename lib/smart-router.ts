import { generateResponseOllama } from './brains/ollama.js';
import { generateResponseGemini } from './brains/gemini.js';
import { generateResponseAnthropic } from './brains/anthropic.js';

export interface RouterConfig {
  useOllama: boolean;
  useGemini: boolean;
  useAnthropic: boolean;
  syncContext: boolean;
  learningMode: boolean;
}

export interface ExecutionResult {
  response: string;
  model: 'ollama' | 'gemini' | 'anthropic' | 'hybrid';
  complexity: 'low' | 'medium' | 'high';
  executionTime: number;
  confidence: number;
}

export class SmartRouter {
  private config: RouterConfig;
  private contextMemory: Map<string, unknown> = new Map();
  private executionHistory: ExecutionResult[] = [];
  private performanceStats: Map<string, { avgTime: number; successRate: number; count: number }> = new Map();

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      useOllama: true,
      useGemini: true,
      useAnthropic: true,
      syncContext: true,
      learningMode: true,
      ...config,
    };
  }

  /**
   * Analisa a complexidade da pergunta com scoring mais sofisticado
   */
  private analyzeComplexity(message: string): 'low' | 'medium' | 'high' {
    const lowerMessage = message.toLowerCase();
    const wordCount = message.split(/\s+/).length;

    let score = 0;

    // Length-based scoring
    if (wordCount > 50) score += 3;
    else if (wordCount > 20) score += 1;

    // High complexity indicators
    const highKeywords = [
      'estratégia', 'análise', 'analise', 'otimize', 'otimizar',
      'implemente', 'implementar', 'integre', 'integrar', 'complexo',
      'arquitetura', 'planeje', 'planejar', 'compare', 'comparar',
      'refatore', 'refatorar', 'debug', 'depure', 'investimento',
      'relatório', 'relatorio', 'código', 'programa', 'algoritmo',
      'machine learning', 'deep learning', 'neural', 'optimize',
      'strategy', 'architecture', 'implement', 'analyze', 'research',
    ];
    score += highKeywords.filter(k => lowerMessage.includes(k)).length * 2;

    // Medium complexity indicators
    const mediumKeywords = [
      'explique', 'explicar', 'como funciona', 'por que', 'porque',
      'diferença', 'diferenca', 'vantagem', 'desvantagem', 'melhor',
      'recomende', 'recomendar', 'sugira', 'sugerir', 'avalie',
      'resuma', 'resumir', 'traduza', 'traduzir', 'escreva',
      'explain', 'recommend', 'suggest', 'evaluate', 'write',
    ];
    score += mediumKeywords.filter(k => lowerMessage.includes(k)).length;

    // Low complexity indicators (reduce score)
    const lowKeywords = [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
      'obrigado', 'valeu', 'tchau', 'bye', 'hello', 'hi',
      'que horas', 'que dia', 'qual data', 'clima', 'tempo',
    ];
    if (lowKeywords.some(k => lowerMessage.includes(k))) score -= 3;

    // Question marks suggest inquiry (medium)
    if (message.includes('?')) score += 1;

    if (score >= 4) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  /**
   * Rota inteligente: decide qual modelo usar baseado em complexidade
   *
   * Low complexity → Ollama (rápido, grátis, local)
   * Medium complexity → Gemini (bom equilíbrio qualidade/custo)
   * High complexity → Anthropic Claude (melhor qualidade)
   */
  async route(message: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const complexity = this.analyzeComplexity(message);

    let response: string;
    let model: ExecutionResult['model'];
    let confidence: number;

    try {
      if (complexity === 'low') {
        // Tarefas simples → Ollama (rápido, grátis)
        ({ response, model, confidence } = await this.tryWithFallback(
          message,
          this.config.useOllama ? 'ollama' : null,
          this.config.useGemini ? 'gemini' : null,
          this.config.useAnthropic ? 'anthropic' : null,
        ));
      } else if (complexity === 'high') {
        // Tarefas complexas → Anthropic Claude (melhor qualidade)
        ({ response, model, confidence } = await this.tryWithFallback(
          message,
          this.config.useAnthropic ? 'anthropic' : null,
          this.config.useGemini ? 'gemini' : null,
          this.config.useOllama ? 'ollama' : null,
        ));
      } else {
        // Tarefas médias → Gemini (bom equilíbrio)
        ({ response, model, confidence } = await this.tryWithFallback(
          message,
          this.config.useGemini ? 'gemini' : null,
          this.config.useAnthropic ? 'anthropic' : null,
          this.config.useOllama ? 'ollama' : null,
        ));
      }

      // Sincronizar contexto
      if (this.config.syncContext) {
        this.syncContextBetweenModels(message, response, model);
      }

      const executionTime = Date.now() - startTime;
      const result: ExecutionResult = {
        response,
        model,
        complexity,
        executionTime,
        confidence,
      };

      // Aprender com o tempo
      if (this.config.learningMode) {
        this.executionHistory.push(result);
        this.updatePerformanceStats(model, executionTime, true);
      }

      console.log(
        `[SmartRouter] ✅ ${model} | ${complexity} | ${executionTime}ms | confidence: ${confidence}`
      );

      return result;
    } catch (error) {
      console.error('[SmartRouter] Erro em todos os modelos:', error);
      throw error;
    }
  }

  /**
   * Tenta os modelos na ordem especificada com fallback automático
   */
  private async tryWithFallback(
    message: string,
    ...models: (string | null)[]
  ): Promise<{ response: string; model: ExecutionResult['model']; confidence: number }> {
    const confidenceMap: Record<string, number> = {
      anthropic: 0.95,
      gemini: 0.85,
      ollama: 0.75,
    };

    const generators: Record<string, (msg: string) => Promise<string>> = {
      ollama: generateResponseOllama,
      gemini: generateResponseGemini,
      anthropic: generateResponseAnthropic,
    };

    for (const modelName of models) {
      if (!modelName) continue;
      try {
        const response = await generators[modelName](message);
        return {
          response,
          model: modelName as ExecutionResult['model'],
          confidence: confidenceMap[modelName] ?? 0.7,
        };
      } catch (err) {
        console.warn(`[SmartRouter] ${modelName} falhou, tentando próximo...`, err);
        continue;
      }
    }

    throw new Error('Nenhum modelo disponível');
  }

  /**
   * Atualiza estatísticas de performance dos modelos
   */
  private updatePerformanceStats(model: string, time: number, success: boolean): void {
    const existing = this.performanceStats.get(model) ?? { avgTime: 0, successRate: 1, count: 0 };
    const newCount = existing.count + 1;
    const newAvgTime = (existing.avgTime * existing.count + time) / newCount;
    const newSuccessRate = (existing.successRate * existing.count + (success ? 1 : 0)) / newCount;
    this.performanceStats.set(model, { avgTime: newAvgTime, successRate: newSuccessRate, count: newCount });
  }

  /**
   * Sincroniza contexto entre modelos
   */
  private syncContextBetweenModels(
    message: string,
    response: string,
    model: string
  ): void {
    const contextKey = `${Date.now()}-${model}`;
    this.contextMemory.set(contextKey, {
      message,
      response,
      model,
      timestamp: new Date(),
    });

    // Manter apenas os últimos 100 itens
    if (this.contextMemory.size > 100) {
      const firstKey = this.contextMemory.keys().next().value;
      if (firstKey) this.contextMemory.delete(firstKey);
    }
  }

  /**
   * Obter contexto compartilhado
   */
  getSharedContext(): unknown[] {
    return Array.from(this.contextMemory.values());
  }

  /**
   * Obter histórico de execução
   */
  getExecutionHistory(): ExecutionResult[] {
    return this.executionHistory;
  }

  /**
   * Obter estatísticas de performance dos modelos
   */
  getPerformanceStats(): Record<string, { avgTime: number; successRate: number; count: number }> {
    return Object.fromEntries(this.performanceStats);
  }

  /**
   * Limpar memória
   */
  clearMemory(): void {
    this.contextMemory.clear();
    this.executionHistory = [];
  }
}
