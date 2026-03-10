import { InfiniteConversation, ConversationTurn } from './infinite-conversation.js';

export interface OrbState {
  isActive: boolean;
  currentTurn: ConversationTurn | null;
  conversationHistory: ConversationTurn[];
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  energy: number; // 0-100
}

export class OrbInterface {
  private infiniteConversation: InfiniteConversation;
  private state: OrbState;
  private updateCallback?: (state: OrbState) => void;

  constructor(infiniteConversation: InfiniteConversation) {
    this.infiniteConversation = infiniteConversation;
    this.state = {
      isActive: false,
      currentTurn: null,
      conversationHistory: [],
      status: 'idle',
      energy: 100,
    };
  }

  /**
   * Ativar a Orb
   */
  async activateOrb(): Promise<void> {
    this.state.isActive = true;
    this.state.status = 'listening';
    this.state.energy = 100;

    console.log('[OrbInterface] 🔮 Orb ativada!');
    console.log('[OrbInterface] 👂 Escutando...\n');

    await this.infiniteConversation.startInfiniteConversation();
    this.updateState();
  }

  /**
   * Processar input na Orb
   */
  async processInput(userInput: string): Promise<void> {
    if (!this.state.isActive) {
      console.log('[OrbInterface] ❌ Orb não está ativa');
      return;
    }

    this.state.status = 'thinking';
    this.updateState();

    try {
      const turn = await this.infiniteConversation.processTurn(userInput);

      this.state.currentTurn = turn;
      this.state.conversationHistory.push(turn);
      this.state.status = 'speaking';
      this.state.energy = Math.max(0, this.state.energy - 5);

      this.updateState();

      // Simular tempo de fala
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.state.status = 'listening';
      this.updateState();
    } catch (error) {
      console.error('[OrbInterface] ❌ Erro:', error);
      this.state.status = 'idle';
      this.updateState();
    }
  }

  /**
   * Desativar Orb
   */
  deactivateOrb(): void {
    this.state.isActive = false;
    this.state.status = 'idle';
    this.infiniteConversation.stopConversation();

    console.log('[OrbInterface] 🔮 Orb desativada');
    this.updateState();
  }

  /**
   * Registrar feedback
   */
  recordFeedback(rating: number, comment?: string): void {
    if (this.state.currentTurn) {
      this.infiniteConversation.recordFeedback(
        this.state.currentTurn.id,
        rating,
        comment
      );
    }
  }

  /**
   * Obter estado atual
   */
  getState(): OrbState {
    return { ...this.state };
  }

  /**
   * Registrar callback para atualizações
   */
  onStateChange(callback: (state: OrbState) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Atualizar estado
   */
  private updateState(): void {
    if (this.updateCallback) {
      this.updateCallback(this.getState());
    }
  }

  /**
   * Obter resumo da conversa
   */
  getConversationSummary(): any {
    return this.infiniteConversation.getSummary();
  }
}
