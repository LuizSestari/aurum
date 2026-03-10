// @ts-nocheck
// NOTE: Skills integration — skill-manager and github-skill-loader are planned modules

export interface ClaudeSkill {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export class ClaudeIntegration {
  private skillManager: SkillManager;
  private githubSkillLoader: GitHubSkillLoader;
  private claudeSkills: Map<string, ClaudeSkill> = new Map();

  constructor(skillManager: SkillManager, githubSkillLoader: GitHubSkillLoader) {
    this.skillManager = skillManager;
    this.githubSkillLoader = githubSkillLoader;
  }

  /**
   * Exportar skills para Claude Code
   */
  async exportSkillsForClaude(): Promise<ClaudeSkill[]> {
    console.log('[ClaudeIntegration] 📤 Exportando skills para Claude...\n');

    const skills = this.skillManager.listSkills();
    const claudeSkills: ClaudeSkill[] = [];

    for (const skill of skills) {
      const claudeSkill: ClaudeSkill = {
        name: skill.name,
        description: skill.description,
        parameters: {
          input: { type: 'any', description: 'Entrada para a skill' },
        },
        execute: skill.execute,
      };

      this.claudeSkills.set(skill.id, claudeSkill);
      claudeSkills.push(claudeSkill);

      console.log(`✅ ${skill.name} exportada para Claude`);
    }

    console.log(`\n[ClaudeIntegration] 🎉 ${claudeSkills.length} skills exportadas\n`);
    return claudeSkills;
  }

  /**
   * Executar skill via Claude
   */
  async executeSkillFromClaude(skillName: string, params: any): Promise<any> {
    console.log(`[ClaudeIntegration] 🚀 Executando ${skillName} (via Claude)`);

    // Encontrar skill pelo nome
    let targetSkill: ClaudeSkill | undefined;
    for (const [, skill] of this.claudeSkills) {
      if (skill.name === skillName) {
        targetSkill = skill;
        break;
      }
    }

    if (!targetSkill) {
      throw new Error(`Skill não encontrada: ${skillName}`);
    }

    return await targetSkill.execute(params);
  }

  /**
   * Gerar prompt para Claude Code
   */
  generateClaudeCodePrompt(): string {
    const skills = Array.from(this.claudeSkills.values());

    const skillsList = skills
      .map(
        s =>
          `- **${s.name}**: ${s.description}
        Parâmetros: ${JSON.stringify(s.parameters)}`
      )
      .join('\n\n');

    return `# Aurum Skills para Claude Code

Você tem acesso às seguintes skills do Aurum:

${skillsList}

## Como usar:

1. Identifique qual skill é necessária para a tarefa
2. Chame a skill com os parâmetros apropriados
3. Processe o resultado
4. Retorne o resultado final

## Exemplo:

\`\`\`
const result = await aurum.useSkill('skill-analysis', {
  data: userInput,
  depth: 'deep'
});
\`\`\`

Você pode combinar múltiplas skills para tarefas complexas!`;
  }

  /**
   * Obter lista de skills para Claude
   */
  getSkillsForClaudePrompt(): string {
    const skills = Array.from(this.claudeSkills.values());
    return skills.map(s => `${s.name}: ${s.description}`).join('\n');
  }
}
