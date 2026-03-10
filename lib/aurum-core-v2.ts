// @ts-nocheck
// NOTE: This is the V2 core — experimental, not used in production.
// The main core is aurum-core.ts which uses SmartRouter.
import { generateResponse } from './brains/index.js';
import { MultiAgentSystem } from './agents/multi-agent-system.js';
import { SelfImprovement } from './self-improvement.js';
import { KnowledgeBase } from './knowledge-base.js';

export class AurumCoreV2 {
  private multiAgent: MultiAgentSystem;
  private selfImprovement: SelfImprovement;
  private skillManager: SkillManager;
  private githubSkillLoader: GitHubSkillLoader;
  private feedbackSystem: FeedbackSystem;
  private selfImprovementEngine: SelfImprovementEngine;
  private knowledgeBase: KnowledgeBase;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.multiAgent = new MultiAgentSystem();
    this.selfImprovement = new SelfImprovement();
    this.skillManager = new SkillManager();
    this.githubSkillLoader = new GitHubSkillLoader();
    this.feedbackSystem = new FeedbackSystem();
    this.selfImprovementEngine = new SelfImprovementEngine(
      this.skillManager,
      this.feedbackSystem
    );
    this.knowledgeBase = new KnowledgeBase();
  }

  async initialize() {
    console.log('[Aurum] 🚀 Inicializando...\n');
    
    console.log('[Aurum] 📦 Carregando skills do GitHub...');
    const githubSkills = await this.githubSkillLoader.loadSkillsFromGitHub();
    
    githubSkills.forEach(skill => {
      this.skillManager.registerSkill(skill);
    });

    console.log('\n[Aurum] ✅ Inicializado com sucesso!');
    console.log(`[Aurum] 📚 ${githubSkills.length} skills do GitHub carregadas`);
    console.log('[Aurum] 🧠 Sistema de auto-melhoria ativo');
    console.log('[Aurum] 💾 Knowledge Base pronta\n');
  }

  /**
   * Processar mensagem do usuário
   */
  async processUserMessage(message: string): Promise<any> {
    this.conversationHistory.push({ role: 'user', content: message });

    // Buscar conhecimento relevante
    const relevantKnowledge = this.knowledgeBase.search(message);

    // Gerar resposta
    const response = await generateResponse(message);

    this.conversationHistory.push({ role: 'assistant', content: response });

    return {
      response,
      relevantKnowledge,
      timestamp: new Date(),
    };
  }

  /**
   * Usar uma skill específica
   */
  async useSkill(skillId: string, input: any): Promise<any> {
    return await this.skillManager.executeSkill(skillId, input);
  }

  /**
   * Registrar feedback
   */
  recordFeedback(userInput: string, aiResponse: string, rating: number): void {
    this.feedbackSystem.recordFeedback(userInput, aiResponse, rating);
    
    // Analisar e gerar melhorias
    this.selfImprovementEngine.analyzeAndImprove();
  }

  /**
   * Adicionar conhecimento
   */
  addKnowledge(topic: string, content: string, source: string): void {
    this.knowledgeBase.addKnowledge(topic, content, source);
  }

  /**
   * Obter status completo
   */
  getStatus(): any {
    return {
      skills: this.skillManager.listSkills().length,
      conversationHistory: this.conversationHistory.length,
      knowledge: this.knowledgeBase.getAll().length,
      improvements: this.selfImprovementEngine.getStatus(),
      feedbacks: this.feedbackSystem.getImprovementInsights(),
    };
  }
}
