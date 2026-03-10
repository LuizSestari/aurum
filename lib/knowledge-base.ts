export interface Knowledge {
  id: string;
  topic: string;
  content: string;
  source: string;
  timestamp: Date;
  confidence: number;
}

export class KnowledgeBase {
  private knowledge: Map<string, Knowledge> = new Map();

  /**
   * Adicionar conhecimento
   */
  addKnowledge(topic: string, content: string, source: string, confidence: number = 0.8): Knowledge {
    const knowledge: Knowledge = {
      id: `kb-${Date.now()}`,
      topic,
      content,
      source,
      timestamp: new Date(),
      confidence,
    };

    this.knowledge.set(knowledge.id, knowledge);
    console.log(`[KnowledgeBase] 📚 Conhecimento adicionado: ${topic}`);

    return knowledge;
  }

  /**
   * Buscar conhecimento
   */
  search(query: string): Knowledge[] {
    const results: Knowledge[] = [];
    
    this.knowledge.forEach(k => {
      if (
        k.topic.toLowerCase().includes(query.toLowerCase()) ||
        k.content.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push(k);
      }
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Obter todo o conhecimento
   */
  getAll(): Knowledge[] {
    return Array.from(this.knowledge.values());
  }

  /**
   * Limpar conhecimento antigo
   */
  cleanup(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let removed = 0;
    this.knowledge.forEach((k, id) => {
      if (k.timestamp < cutoffDate) {
        this.knowledge.delete(id);
        removed++;
      }
    });

    console.log(`[KnowledgeBase] 🗑️ ${removed} itens removidos`);
  }
}
