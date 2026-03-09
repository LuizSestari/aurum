import { SkillManager } from './skills/skill-manager.js';
import { AurumCoreV2 } from './aurum-core-v2.js';

export interface CoordinatorTask {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: 'claude' | 'manus' | 'auto';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: Date;
  claudeUsageTokens?: number;
  manusExecutionTime?: number;
}

export interface CoordinatorConfig {
  claudeTokenLimit: number; // 100 mensagens/3 horas
  claudeTokenUsed: number;
  autoFallback: boolean;
  syncInterval: number; // ms
}

/**
 * Coordinator Agent - Gerencia Manus + Claude Code
 * 
 * Responsabilidades:
 * 1. Receber tarefas do usuário
 * 2. Decidir: Claude Code ou Manus?
 * 3. Executar tarefa
 * 4. Se Claude atingir limite → Manus toma as rédeas
 * 5. Sincronizar resultados
 * 6. Retornar resultado final
 */
export class CoordinatorAgent {
  private config: CoordinatorConfig;
  private aurumCore: AurumCoreV2;
  private skillManager: SkillManager;
  private taskHistory: CoordinatorTask[] = [];
  private claudeStatus: {
    isAvailable: boolean;
    tokensUsed: number;
    tokensRemaining: number;
    lastChecked: Date;
  };

  constructor(config: Partial<CoordinatorConfig> = {}) {
    this.config = {
      claudeTokenLimit: 100, // 100 mensagens/3 horas
      claudeTokenUsed: 0,
      autoFallback: true,
      syncInterval: 5000, // 5 segundos
      ...config,
    };

    this.aurumCore = new AurumCoreV2();
    this.skillManager = new SkillManager();
    this.claudeStatus = {
      isAvailable: true,
      tokensUsed: 0,
      tokensRemaining: this.config.claudeTokenLimit,
      lastChecked: new Date(),
    };
  }

  /**
   * Inicializar Coordinator
   */
  async initialize(): Promise<void> {
    console.log('[CoordinatorAgent] 🤝 Inicializando Coordinator...\n');
    await this.aurumCore.initialize();
    console.log('[CoordinatorAgent] ✅ Pronto para coordenar tarefas\n');
  }

  /**
   * Processar tarefa do usuário
   */
  async processTask(description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<CoordinatorTask> {
    const task: CoordinatorTask = {
      id: `task-${Date.now()}`,
      description,
      priority,
      assignedTo: 'auto',
      status: 'pending',
      timestamp: new Date(),
    };

    console.log(`[CoordinatorAgent] 📋 Nova tarefa: ${description}`);
    console.log(`[CoordinatorAgent] 🎯 Prioridade: ${priority}\n`);

    try {
      // 1. Decidir quem vai fazer
      const assignedTo = await this.decideExecutor(task);
      task.assignedTo = assignedTo;

      console.log(`[CoordinatorAgent] 👤 Atribuído para: ${assignedTo === 'claude' ? 'Claude Code' : 'Manus'}\n`);

      // 2. Executar tarefa
      task.status = 'in_progress';
      const result = await this.executeTask(task);

      task.result = result;
      task.status = 'completed';

      console.log(`[CoordinatorAgent] ✅ Tarefa concluída\n`);
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      console.error(`[CoordinatorAgent] ❌ Erro:`, error);
    }

    this.taskHistory.push(task);
    return task;
  }

  /**
   * Decidir executor: Claude Code ou Manus?
   */
  private async decideExecutor(task: CoordinatorTask): Promise<'claude' | 'manus'> {
    // Verificar disponibilidade do Claude
    const claudeAvailable = await this.checkClaudeAvailability();

    if (!claudeAvailable) {
      console.log('[CoordinatorAgent] ⚠️ Claude atingiu limite → Usando Manus');
      return 'manus';
    }

    // Usar Claude para tarefas complexas
    if (task.priority === 'critical' || task.priority === 'high') {
      if (this.claudeStatus.tokensRemaining > 20) {
        return 'claude';
      }
    }

    // Usar Manus para tarefas simples ou quando Claude está perto do limite
    if (this.claudeStatus.tokensRemaining < 20) {
      return 'manus';
    }

    // Por padrão, usar Claude para tarefas complexas
    const isComplex = this.isComplexTask(task.description);
    return isComplex ? 'claude' : 'manus';
  }

  /**
   * Executar tarefa
   */
  private async executeTask(task: CoordinatorTask): Promise<any> {
    if (task.assignedTo === 'claude') {
      return await this.executeWithClaude(task);
    } else {
      return await this.executeWithManus(task);
    }
  }

  /**
   * Executar com Claude Code
   */
  private async executeWithClaude(task: CoordinatorTask): Promise<any> {
    console.log('[CoordinatorAgent] 🔄 Enviando para Claude Code...');

    // Simular execução no Claude Code
    const result = {
      executor: 'claude',
      taskId: task.id,
      description: task.description,
      result: `Claude Code processou: ${task.description}`,
      timestamp: new Date(),
    };

    // Incrementar contador de tokens
    this.claudeStatus.tokensUsed++;
    this.claudeStatus.tokensRemaining--;

    console.log(`[CoordinatorAgent] 📊 Claude tokens: ${this.claudeStatus.tokensUsed}/${this.config.claudeTokenLimit}`);

    // Se Claude atingiu limite, próxima tarefa vai para Manus
    if (this.claudeStatus.tokensRemaining <= 0) {
      console.log('[CoordinatorAgent] 🚨 LIMITE DO CLAUDE ATINGIDO!');
      console.log('[CoordinatorAgent] 🔄 Próximas tarefas serão executadas por Manus\n');
      this.claudeStatus.isAvailable = false;
    }

    return result;
  }

  /**
   * Executar com Manus
   */
  private async executeWithManus(task: CoordinatorTask): Promise<any> {
    const startTime = Date.now();
    console.log('[CoordinatorAgent] 🤖 Executando com Manus...');

    // Usar Aurum Core para processar
    const result = await this.aurumCore.processUserMessage(task.description);

    const executionTime = Date.now() - startTime;
    task.manusExecutionTime = executionTime;

    console.log(`[CoordinatorAgent] ⏱️ Tempo de execução: ${executionTime}ms`);

    return {
      executor: 'manus',
      taskId: task.id,
      description: task.description,
      result: result.response,
      executionTime,
      timestamp: new Date(),
    };
  }

  /**
   * Verificar disponibilidade do Claude
   */
  private async checkClaudeAvailability(): Promise<boolean> {
    // Se já sabemos que Claude atingiu limite
    if (!this.claudeStatus.isAvailable) {
      return false;
    }

    // Se ainda há tokens disponíveis
    if (this.claudeStatus.tokensRemaining > 0) {
      return true;
    }

    // Claude atingiu limite
    this.claudeStatus.isAvailable = false;
    return false;
  }

  /**
   * Detectar se tarefa é complexa
   */
  private isComplexTask(description: string): boolean {
    const complexKeywords = [
      'estratégia',
      'análise',
      'código',
      'design',
      'arquitetura',
      'otimização',
      'implementar',
      'criar',
      'desenvolver',
    ];

    return complexKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  /**
   * Sincronizar com Claude Code
   */
  async syncWithClaudeCode(): Promise<void> {
    console.log('[CoordinatorAgent] 🔄 Sincronizando com Claude Code...');

    // Enviar status do Aurum para Claude Code
    const status = {
      coordinator: {
        claudeTokensUsed: this.claudeStatus.tokensUsed,
        claudeTokensRemaining: this.claudeStatus.tokensRemaining,
        claudeAvailable: this.claudeStatus.isAvailable,
      },
      aurum: {
        skills: this.skillManager.listSkills().length,
        taskHistory: this.taskHistory.length,
      },
      timestamp: new Date(),
    };

    console.log('[CoordinatorAgent] 📊 Status:', JSON.stringify(status, null, 2));
  }

  /**
   * Obter status completo
   */
  getStatus(): {
    coordinator: {
      claudeTokensUsed: number;
      claudeTokensRemaining: number;
      claudeAvailable: boolean;
    };
    aurum: {
      skills: number;
      taskHistory: number;
    };
    taskHistory: CoordinatorTask[];
  } {
    return {
      coordinator: {
        claudeTokensUsed: this.claudeStatus.tokensUsed,
        claudeTokensRemaining: this.claudeStatus.tokensRemaining,
        claudeAvailable: this.claudeStatus.isAvailable,
      },
      aurum: {
        skills: this.skillManager.listSkills().length,
        taskHistory: this.taskHistory.length,
      },
      taskHistory: this.taskHistory,
    };
  }

  /**
   * Resetar Claude (quando limite se renova)
   */
  resetClaudeLimit(): void {
    console.log('[CoordinatorAgent] 🔄 Resetando limite do Claude...');
    this.claudeStatus.tokensUsed = 0;
    this.claudeStatus.tokensRemaining = this.config.claudeTokenLimit;
    this.claudeStatus.isAvailable = true;
    this.claudeStatus.lastChecked = new Date();
    console.log('[CoordinatorAgent] ✅ Limite resetado\n');
  }

  /**
   * Obter recomendações
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.claudeStatus.tokensRemaining < 10) {
      recommendations.push('⚠️ Claude está perto do limite. Próximas tarefas usarão Manus.');
    }

    if (this.claudeStatus.tokensRemaining === 0) {
      recommendations.push('🚨 Claude atingiu limite. Todas as tarefas usarão Manus até renovação.');
    }

    if (this.taskHistory.length > 50) {
      recommendations.push('💾 Considere arquivar histórico de tarefas para otimizar performance.');
    }

    return recommendations;
  }
}

/**
 * Task Router - Roteia tarefas para executor correto
 */
export class TaskRouter {
  private coordinator: CoordinatorAgent;
  private queue: CoordinatorTask[] = [];
  private isProcessing: boolean = false;

  constructor(coordinator: CoordinatorAgent) {
    this.coordinator = coordinator;
  }

  /**
   * Adicionar tarefa à fila
   */
  async addTask(description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const task: CoordinatorTask = {
      id: `task-${Date.now()}`,
      description,
      priority,
      assignedTo: 'auto',
      status: 'pending',
      timestamp: new Date(),
    };

    this.queue.push(task);
    console.log(`[TaskRouter] 📋 Tarefa adicionada à fila (${this.queue.length} pendentes)`);

    // Processar fila se não está processando
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Processar fila de tarefas
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await this.coordinator.processTask(task.description, task.priority);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Obter fila
   */
  getQueue(): CoordinatorTask[] {
    return this.queue;
  }
}
