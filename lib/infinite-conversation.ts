// @ts-nocheck
import { generateResponse } from './brains/index.js';
import { getImprovementInsights } from './feedback-system.js';

export interface ConversationTurn {
  id: string;
  userInput: string;
  aiResponse: string;
  timestamp: Date;
  rating?: number;
  context?: any;
}

export class InfiniteConversation {
  private conversationHistory: ConversationTurn[] = [];
  private feedbackSystem: FeedbackSystem;
  private isActive: boolean = false;
  private conversationId: string;

  constructor(feedbackSystem: FeedbackSystem) {
    this.feedbackSystem = feedbackSystem;
    this.conversationId = `conv-${Date.now()}`;
  }

  /**
   * Iniciar conversa infinita
   */
  async startInfiniteConversation(): Promise<void> {
    this.isActive = true;
    console.log(`[InfiniteConversation] 🎤 Conversa iniciada: ${this.conversationId}\n`);
  }

  /**
   * Processar turno de conversa
   */
  async processTurn(userInput: string): Promise<ConversationTurn> {
    if (!this.isActive) {
      throw new Error('Conversa não está ativa');
    }

    console.log(`[InfiniteConversation] 👤 Usuário: "${userInput}"`);

    // Gerar contexto da conversa anterior
    const context = this.buildContext();

    // Gerar resposta
    const aiResponse = await generateResponse(userInput);

    // Criar turno
    const turn: ConversationTurn = {
      id: `turn-${Date.now()}`,
      userInput,
      aiResponse,
      timestamp: new Date(),
      context,
    };

    this.conversationHistory.push(turn);

    console.log(`[InfiniteConversation] 🤖 Aurum: "${aiResponse.substring(0, 80)}..."\n`);

    return turn;
  }

  /**
   * Construir contexto da conversa
   */
  private buildContext(): any {
    const recentTurns = this.conversationHistory.slice(-5);
    const topics = this.extractTopics();

    return {
      recentTurns: recentTurns.map(t => ({
        user: t.userInput,
        ai: t.aiResponse.substring(0, 100),
      })),
      topics,
      conversationLength: this.conversationHistory.length,
    };
  }

  /**
   * Extrair tópicos da conversa
   */
  private extractTopics(): string[] {
    const topics: Set<string> = new Set();

    this.conversationHistory.forEach(turn => {
      const keywords = [
        'estratégia',
        'código',
        'design',
        'marketing',
        'análise',
        'otimização',
      ];

      keywords.forEach(keyword => {
        if (turn.userInput.toLowerCase().includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  /**
   * Registrar feedback para um turno
   */
  recordFeedback(turnId: string, rating: number, comment?: string): void {
    const turn = this.conversationHistory.find(t => t.id === turnId);

    if (!turn) {
      throw new Error('Turno não encontrado');
    }

    turn.rating = rating;

    this.feedbackSystem.recordFeedback(
      turn.userInput,
      turn.aiResponse,
      rating,
      comment
    );

    console.log(`[InfiniteConversation] ⭐ Feedback registrado: ${rating}/5`);
  }

  /**
   * Parar conversa
   */
  stopConversation(): void {
    this.isActive = false;
    console.log(
      `[InfiniteConversation] 🛑 Conversa finalizada. Total de turnos: ${this.conversationHistory.length}`
    );
  }

  /**
   * Obter histórico
   */
  getHistory(): ConversationTurn[] {
    return this.conversationHistory;
  }

  /**
   * Obter resumo da conversa
   */
  getSummary(): any {
    const avgRating =
      this.conversationHistory
        .filter(t => t.rating)
        .reduce((sum, t) => sum + (t.rating || 0), 0) /
      this.conversationHistory.filter(t => t.rating).length || 0;

    return {
      conversationId: this.conversationId,
      totalTurns: this.conversationHistory.length,
      averageRating: avgRating.toFixed(2),
      topics: this.extractTopics(),
      duration: new Date().getTime() - parseInt(this.conversationId.split('-')[1]),
    };
  }
}
