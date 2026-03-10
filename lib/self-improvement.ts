// ─────────────────────────────────────────────
// Aurum Self-Improvement System
// Analyzes feedback patterns, adjusts AI behavior,
// tracks improvements over time
// ─────────────────────────────────────────────

import { getImprovementInsights, type FeedbackInsights } from './feedback-system';
import { getAIConfig, setAIConfig } from './aurum-ai';

export interface Improvement {
  id: string;
  type: 'prompt_adjustment' | 'model_switch' | 'parameter_tune' | 'behavior_change';
  description: string;
  status: 'pending' | 'applied' | 'reverted';
  impact: string;
  appliedAt?: number;
  basedOn: {
    feedbackCount: number;
    avgRating: number;
    area: string;
  };
}

const IMPROVEMENTS_KEY = 'aurum_improvements';

function loadImprovements(): Improvement[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(IMPROVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveImprovements(list: Improvement[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(IMPROVEMENTS_KEY, JSON.stringify(list));
}

let improvements: Improvement[] = loadImprovements();

export class SelfImprovement {
  /**
   * Main self-improvement loop: analyze feedback → generate improvements → apply
   */
  async improveYourself(request?: string): Promise<boolean> {
    try {
      const insights = getImprovementInsights();

      if (insights.totalFeedback < 3) {
        console.log('[Self-Improvement] Não há feedback suficiente ainda (mínimo: 3)');
        return false;
      }

      console.log(`[Self-Improvement] Analisando ${insights.totalFeedback} feedbacks...`);
      console.log(`[Self-Improvement] Rating médio: ${insights.averageRating}/5 | Tendência: ${insights.trend}`);

      const newImprovements = this.generateImprovements(insights);

      if (newImprovements.length === 0) {
        console.log('[Self-Improvement] Nenhuma melhoria necessária — tudo está bom!');
        return true;
      }

      // Apply improvements
      for (const imp of newImprovements) {
        this.applyImprovement(imp);
        improvements.unshift(imp);
      }

      saveImprovements(improvements);
      console.log(`[Self-Improvement] ✅ ${newImprovements.length} melhorias aplicadas`);
      return true;
    } catch (error) {
      console.error('[Self-Improvement] Erro:', error);
      return false;
    }
  }

  /**
   * Generate improvements based on feedback insights
   */
  private generateImprovements(insights: FeedbackInsights): Improvement[] {
    const result: Improvement[] = [];
    const config = getAIConfig();

    // 1. If accuracy is low, increase detail in system prompt
    if (insights.categoryScores['accuracy']?.avg < 3.5) {
      result.push({
        id: `imp-${Date.now()}-accuracy`,
        type: 'prompt_adjustment',
        description: 'Adicionar instrução de precisão ao system prompt',
        status: 'pending',
        impact: 'Respostas mais precisas e verificadas',
        basedOn: {
          feedbackCount: insights.categoryScores['accuracy'].count,
          avgRating: insights.categoryScores['accuracy'].avg,
          area: 'accuracy',
        },
      });
    }

    // 2. If speed is low and using a heavy model, suggest lighter model
    if (insights.categoryScores['speed']?.avg < 3.0 && config.provider === 'anthropic') {
      result.push({
        id: `imp-${Date.now()}-speed`,
        type: 'parameter_tune',
        description: 'Reduzir max_tokens para respostas mais rápidas',
        status: 'pending',
        impact: 'Respostas mais rápidas',
        basedOn: {
          feedbackCount: insights.categoryScores['speed'].count,
          avgRating: insights.categoryScores['speed'].avg,
          area: 'speed',
        },
      });
    }

    // 3. If relevance is low, enhance context injection
    if (insights.categoryScores['relevance']?.avg < 3.5) {
      result.push({
        id: `imp-${Date.now()}-relevance`,
        type: 'prompt_adjustment',
        description: 'Melhorar injeção de contexto para respostas mais relevantes',
        status: 'pending',
        impact: 'Respostas mais contextuais e relevantes',
        basedOn: {
          feedbackCount: insights.categoryScores['relevance'].count,
          avgRating: insights.categoryScores['relevance'].avg,
          area: 'relevance',
        },
      });
    }

    // 4. If tone is problematic, adjust personality
    if (insights.categoryScores['tone']?.avg < 3.5) {
      result.push({
        id: `imp-${Date.now()}-tone`,
        type: 'prompt_adjustment',
        description: 'Ajustar tom das respostas baseado no feedback',
        status: 'pending',
        impact: 'Tom mais adequado nas respostas',
        basedOn: {
          feedbackCount: insights.categoryScores['tone'].count,
          avgRating: insights.categoryScores['tone'].avg,
          area: 'tone',
        },
      });
    }

    // 5. If overall declining, switch to better model
    if (insights.trend === 'declining' && insights.averageRating < 3.0) {
      result.push({
        id: `imp-${Date.now()}-model`,
        type: 'model_switch',
        description: 'Trocar para modelo mais capaz devido a baixa satisfação',
        status: 'pending',
        impact: 'Qualidade geral melhorada',
        basedOn: {
          feedbackCount: insights.totalFeedback,
          avgRating: insights.averageRating,
          area: 'general',
        },
      });
    }

    return result;
  }

  /**
   * Apply a specific improvement
   */
  private applyImprovement(imp: Improvement): void {
    const config = getAIConfig();

    switch (imp.type) {
      case 'prompt_adjustment': {
        const currentPrompt = config.systemPrompt ?? '';
        let addition = '';

        if (imp.basedOn.area === 'accuracy') {
          addition = '\n\nIMPORTANTE: Sempre verifique a precisão antes de responder. Se não tiver certeza, diga claramente.';
        } else if (imp.basedOn.area === 'relevance') {
          addition = '\n\nIMPORTANTE: Preste atenção extra ao contexto do usuário. Conecte sua resposta diretamente ao que foi perguntado.';
        } else if (imp.basedOn.area === 'tone') {
          addition = '\n\nIMPORTANTE: Mantenha um tom amigável, caloroso e encorajador. Evite ser frio ou mecânico.';
        }

        if (addition && !currentPrompt.includes(addition.trim())) {
          setAIConfig({ systemPrompt: currentPrompt + addition });
        }
        break;
      }

      case 'parameter_tune': {
        if (imp.basedOn.area === 'speed') {
          setAIConfig({ maxTokens: Math.max(1024, (config.maxTokens ?? 2048) - 512) });
        }
        break;
      }

      case 'model_switch': {
        // If using local, try to switch to a real model
        if (config.provider === 'local') {
          // Check if we have Anthropic key available
          const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
          if (win.__AURUM_ANTHROPIC_KEY) {
            setAIConfig({
              provider: 'anthropic',
              apiKey: win.__AURUM_ANTHROPIC_KEY as string,
              model: 'claude-sonnet-4-20250514',
            });
          }
        }
        break;
      }
    }

    imp.status = 'applied';
    imp.appliedAt = Date.now();
    console.log(`[Self-Improvement] Aplicado: ${imp.description}`);
  }

  /**
   * Get all improvements
   */
  getImprovements(): Improvement[] {
    return [...improvements];
  }

  /**
   * Get improvement summary
   */
  getStatus(): {
    totalImprovements: number;
    applied: number;
    pending: number;
    latestImprovement?: Improvement;
  } {
    return {
      totalImprovements: improvements.length,
      applied: improvements.filter(i => i.status === 'applied').length,
      pending: improvements.filter(i => i.status === 'pending').length,
      latestImprovement: improvements[0],
    };
  }

  /**
   * Revert a specific improvement
   */
  revertImprovement(id: string): boolean {
    const imp = improvements.find(i => i.id === id);
    if (!imp || imp.status !== 'applied') return false;
    imp.status = 'reverted';
    saveImprovements(improvements);
    console.log(`[Self-Improvement] Revertido: ${imp.description}`);
    return true;
  }
}
