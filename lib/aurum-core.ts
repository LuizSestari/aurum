import { generateResponse } from './brains/index.js';
import { MultiAgentSystem } from './agents/multi-agent-system.js';
import { SelfImprovement } from './self-improvement.js';
import { saveToObsidian } from './integrations/obsidian.js';
import { executeN8nWorkflow } from './integrations/n8n.js';
import { SmartRouter, ExecutionResult } from './smart-router.js';

export class AurumCore {
  private multiAgent: MultiAgentSystem;
  private selfImprovement: SelfImprovement;
  private smartRouter: SmartRouter;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.multiAgent = new MultiAgentSystem();
    this.selfImprovement = new SelfImprovement();
    this.smartRouter = new SmartRouter({
      useOllama: true,
      useGemini: true,
      useAnthropic: true,
      syncContext: true,
      learningMode: true,
    });
  }

  async initialize() {
    console.log('[Aurum] 🚀 Inicializado com sucesso!');
    console.log('[Aurum] ✅ Ollama + Claude sincronizados');
    console.log('[Aurum] ✅ Multi-agentes ativos');
    console.log('[Aurum] ✅ Self-improvement habilitado');
  }

  /**
   * Processa mensagens do usuário com router inteligente
   */
  async processUserMessage(message: string): Promise<ExecutionResult> {
    console.log(`[Aurum] Processando: "${message}"`);

    // Adicionar ao histórico
    this.conversationHistory.push({
      role: 'user',
      content: message,
    });

    try {
      // Verificar comandos especiais
      if (message.toLowerCase().includes('melhore')) {
        return await this.handleSelfImprovement(message);
      }

      if (message.toLowerCase().includes('salve no obsidian')) {
        return await this.handleObsidianSave(message);
      }

      if (
        message.toLowerCase().includes('agende') ||
        message.toLowerCase().includes('envie')
      ) {
        return await this.handleN8nAutomation(message);
      }

      if (this.isComplexTask(message)) {
        return await this.handleComplexTask(message);
      }

      // Usar router inteligente para tarefas normais
      const result = await this.smartRouter.route(message);

      // Adicionar resposta ao histórico
      this.conversationHistory.push({
        role: 'assistant',
        content: result.response,
      });

      console.log(
        `[Aurum] ✅ Modelo: ${result.model} | Complexidade: ${result.complexity} | Tempo: ${result.executionTime}ms`
      );

      return result;
    } catch (error) {
      console.error('[Aurum] ❌ Erro:', error);
      throw error;
    }
  }

  /**
   * Lidar com tarefas complexas (multi-agentes)
   */
  private async handleComplexTask(message: string): Promise<ExecutionResult> {
    console.log('[Aurum] 🔄 Delegando para multi-agentes...');
    const startTime = Date.now();

    const result = await this.multiAgent.delegateTask(message);

    return {
      response: result.finalStrategy,
      model: 'hybrid',
      complexity: 'high',
      executionTime: Date.now() - startTime,
      confidence: 0.95,
    };
  }

  /**
   * Lidar com self-improvement
   */
  private async handleSelfImprovement(message: string): Promise<ExecutionResult> {
    console.log('[Aurum] 🧠 Iniciando self-improvement...');
    const startTime = Date.now();

    const success = await this.selfImprovement.improveYourself(message);

    return {
      response: success
        ? '✅ Melhorias implementadas com sucesso!'
        : '❌ Falha ao implementar melhorias.',
      model: 'anthropic',
      complexity: 'high',
      executionTime: Date.now() - startTime,
      confidence: success ? 0.9 : 0.5,
    };
  }

  /**
   * Lidar com Obsidian
   */
  private async handleObsidianSave(message: string): Promise<ExecutionResult> {
    console.log('[Aurum] 📝 Salvando no Obsidian...');
    const startTime = Date.now();

    const success = await saveToObsidian(message, ['aurum']);

    return {
      response: success
        ? '✅ Conteúdo salvo no Obsidian!'
        : '❌ Erro ao salvar no Obsidian.',
      model: 'ollama',
      complexity: 'low',
      executionTime: Date.now() - startTime,
      confidence: success ? 0.9 : 0.5,
    };
  }

  /**
   * Lidar com automações n8n
   */
  private async handleN8nAutomation(message: string): Promise<ExecutionResult> {
    console.log('[Aurum] ⚙️ Executando automação n8n...');
    const startTime = Date.now();

    try {
      await executeN8nWorkflow('schedule_meeting', { message });
      return {
        response: '✅ Automação executada com sucesso!',
        model: 'ollama',
        complexity: 'medium',
        executionTime: Date.now() - startTime,
        confidence: 0.85,
      };
    } catch (error) {
      return {
        response: '❌ Erro na automação.',
        model: 'ollama',
        complexity: 'medium',
        executionTime: Date.now() - startTime,
        confidence: 0.3,
      };
    }
  }

  /**
   * Detectar tarefas complexas
   */
  private isComplexTask(message: string): boolean {
    const keywords = [
      'estratégia',
      'análise',
      'melhore',
      'otimize',
      'crie',
      'implemente',
      'integre',
      'complexo',
    ];
    return keywords.some(k => message.toLowerCase().includes(k));
  }

  /**
   * Obter histórico de conversa
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Obter contexto compartilhado entre modelos
   */
  getSharedContext() {
    return this.smartRouter.getSharedContext();
  }

  /**
   * Obter histórico de execução
   */
  getExecutionHistory() {
    return this.smartRouter.getExecutionHistory();
  }

  /**
   * Limpar memória
   */
  clearMemory() {
    this.conversationHistory = [];
    this.smartRouter.clearMemory();
  }
}
