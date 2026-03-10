import { generateResponse } from '../brains/index.js';
import { Agent } from './types.js';

export class MultiAgentSystem {
  private centralAgent: Agent;
  private specializedAgents: Agent[] = [];

  constructor() {
    this.centralAgent = {
      id: 'aurum-central',
      name: 'Aurum',
      role: 'central',
      systemPrompt: `Você é Aurum, o líder de uma equipe de agentes especializados.
        Sua função é coordenar, delegar tarefas e integrar resultados.`,
      capabilities: ['coordenação', 'delegação', 'integração'],
    };

    this.specializedAgents = [
      {
        id: 'agent-traffic',
        name: 'Traffic Agent',
        role: 'traffic',
        systemPrompt: `Você é especialista em tráfego pago. Otimize campanhas e analise ROI.`,
        capabilities: ['google-ads', 'facebook-ads', 'analytics'],
      },
      {
        id: 'agent-copy',
        name: 'Copy Agent',
        role: 'copy',
        systemPrompt: `Você é especialista em copywriting. Crie textos que convertem.`,
        capabilities: ['copywriting', 'headlines', 'cta'],
      },
      {
        id: 'agent-design',
        name: 'Design Agent',
        role: 'design',
        systemPrompt: `Você é especialista em design e UX. Sugira layouts e cores.`,
        capabilities: ['ui-design', 'ux', 'colors'],
      },
      {
        id: 'agent-seo',
        name: 'SEO Agent',
        role: 'seo',
        systemPrompt: `Você é especialista em SEO. Otimize conteúdo e keywords.`,
        capabilities: ['seo', 'keywords', 'content-optimization'],
      },
    ];
  }

  async delegateTask(task: string): Promise<Record<string, any>> {
    console.log(`[Aurum] Recebendo tarefa: ${task}`);
    const results: Record<string, any> = {};

    for (const agent of this.specializedAgents) {
      console.log(`[Aurum] Delegando para ${agent.name}...`);
      results[agent.id] = await this.executeAgent(agent, task);
    }

    const finalResult = await this.integrateResults(results, task);
    return finalResult;
  }

  private async executeAgent(agent: Agent, task: string): Promise<any> {
    const agentPrompt = `${agent.systemPrompt}
    
    Tarefa: ${task}
    
    Forneça uma resposta detalhada.`;

    const response = await generateResponse(agentPrompt, 'ollama');

    return {
      agent: agent.name,
      response: response,
      timestamp: new Date(),
    };
  }

  private async integrateResults(
    results: Record<string, any>,
    originalTask: string
  ): Promise<any> {
    const resultsText = Object.values(results)
      .map((r: any) => `${r.agent}: ${r.response}`)
      .join('\n\n---\n\n');

    const integrationPrompt = `Você é Aurum. Integre estes resultados em uma estratégia coerente:
    
    Tarefa: ${originalTask}
    
    Resultados:
    ${resultsText}`;

    const finalResponse = await generateResponse(integrationPrompt, 'gemini');

    return {
      finalStrategy: finalResponse,
      agentResults: results,
      timestamp: new Date(),
    };
  }

  getAgents(): Agent[] {
    return [this.centralAgent, ...this.specializedAgents];
  }
}
