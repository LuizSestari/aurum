# Aurum - Estrategia de Planos & Enterprise

## Visao Geral dos Planos

O Aurum oferece 4 niveis de acesso pensados para atender desde usuarios individuais ate grandes corporacoes. A estrategia e baseada em **valor progressivo**: cada plano desbloqueia capacidades que justificam naturalmente o investimento.

---

## Plano FREE (R$ 0/mes)

**Objetivo:** Atrair usuarios, criar base de dados, gerar boca-a-boca.

**O que oferece:**
- 50 mensagens de IA por mes (Groq/Llama gratuito como backend)
- Voz basica (Google TTS + Web Speech API - custo zero)
- 20 tarefas, 5 habitos, 3 projetos
- 5.000 caracteres TTS/mes
- Dados salvos localmente (sem custo de servidor)
- Interface completa com todas as secoes visiveis (mas bloqueadas)

**Custo real para voce:** Praticamente R$ 0. O Groq tem free tier generoso, Google TTS e gratuito, e dados ficam no localStorage do usuario.

**Estrategia:** Mostrar tudo que o Pro/Max oferece com badges "PRO" para criar desejo de upgrade. Quando o usuario atinge o limite de 50 mensagens, mostrar modal suave: "Voce usou todas as mensagens deste mes. Faca upgrade para continuar."

---

## Plano PRO (R$ 29,90/mes)

**Objetivo:** Monetizacao principal. Deve ser o plano mais popular.

**O que oferece:**
- 1.000 mensagens de IA/mes
- Voz ElevenLabs (ultra-realista) - 100K caracteres/mes
- Modo conversa continua
- Tarefas, habitos, projetos ilimitados
- Vision board e Kanban
- Analise financeira
- Sincronizacao na nuvem (Supabase)
- 5GB armazenamento

**Custo real estimado por usuario:**
- Groq API: ~R$ 0 (free tier cobre 1000 msgs facilmente)
- ElevenLabs: ~R$ 5-15/usuario/mes (depende do uso de TTS)
- Supabase: ~R$ 1-3/usuario/mes (storage + bandwidth)
- **Total: ~R$ 8-18/usuario/mes**
- **Margem: ~40-75%**

**Estrategia:** Este e o plano "sweet spot". Preco acessivel, margem saudavel. Oferecer 7 dias gratis de trial. Desconto de 20% no plano anual (R$ 23,90/mes).

---

## Plano MAX (R$ 79,90/mes)

**Objetivo:** Power users e profissionais. Margem alta.

**O que oferece:**
- Mensagens de IA ilimitadas
- Todos os modelos de IA (GPT-4, Claude, Gemini, Groq)
- Voz ElevenLabs ilimitada + vozes customizadas
- Automacoes com n8n (ate 10 workflows)
- Acesso a API do Aurum
- Exportacao de dados
- Suporte prioritario (email em 24h)
- 50GB armazenamento
- Analytics avancado

**Custo real estimado por usuario:**
- APIs de IA: ~R$ 15-30/usuario/mes (mix de modelos)
- ElevenLabs: ~R$ 20-40/usuario/mes (uso intenso)
- n8n hosting: ~R$ 5/usuario/mes
- Supabase: ~R$ 3-5/usuario/mes
- **Total: ~R$ 43-80/usuario/mes**
- **Margem: ~0-45%** (depende do uso)

**Estrategia:** Limitar usuarios "heavy" com fair use policy. A maioria dos usuarios Max nao vai usar tudo, mantendo a margem saudavel. O acesso a API e o diferencial que atrai desenvolvedores.

---

## Plano TEAMS (R$ 49,90/membro/mes)

**Objetivo:** Receita recorrente alta. Empresas pequenas/medias.

**O que oferece:**
- Tudo do Max para cada membro
- Ate 50 membros
- SSO (Google Workspace, Microsoft)
- Painel administrativo
- Audit logs
- Branding customizado (logo, cores)
- Gerente de conta dedicado (acima de 20 membros)
- 100GB armazenamento compartilhado
- SLA 99.9% uptime

**Custo real estimado por membro:**
- Similar ao Max: ~R$ 30-50/membro/mes
- Overhead de infra (SSO, admin panel): ~R$ 5/membro/mes
- **Total: ~R$ 35-55/membro/mes**
- **Margem: ~0-30%**

**Estrategia:** O valor esta no volume. Uma empresa com 20 membros = R$ 998/mes. O gerente de conta dedicado so se justifica acima de 20 membros. Cobrar setup fee de R$ 500 para customizacao de branding.

---

## Modelo Enterprise (Customizado)

### Para Empresas que Querem um Modelo Super Avancado

**Cenario:** Grandes empresas, corporacoes, ou startups que querem o Aurum como plataforma interna ou white-label.

### Opcao 1: White-Label SaaS (mais comum)

A empresa usa o Aurum com sua propria marca.

**O que inclui:**
- Dominio customizado (assistente.empresa.com)
- Logo, cores, nome completamente customizados
- Modelos de IA dedicados (fine-tuned para o negocio)
- Integracao com sistemas internos (ERP, CRM, Slack, Teams)
- Dados isolados (banco dedicado ou schema separado)
- API completa para integracao
- Treinamento da equipe
- Suporte dedicado 24/7

**Precificacao sugerida:**
- Setup: R$ 5.000 - R$ 25.000 (dependendo da customizacao)
- Mensal: R$ 3.000 - R$ 15.000 base + R$ 30-80/usuario ativo
- SLA enterprise com 99.99% uptime

**Para voce, Luiz:**
- Custo de infra dedicada: ~R$ 500-2.000/mes (VPS + banco dedicado)
- Custo de IA: variavel (passar para o cliente ou incluir no preco)
- Margem potencial: 50-70% na mensalidade

### Opcao 2: On-Premise / Self-Hosted

Para empresas que nao podem colocar dados na nuvem (bancos, saude, governo).

**O que inclui:**
- Docker images para deploy interno
- Suporte a modelos locais (Ollama, vLLM)
- Sem dependencia de cloud
- Licenca anual

**Precificacao sugerida:**
- Licenca anual: R$ 50.000 - R$ 200.000
- Suporte anual: 20% do valor da licenca
- Consultoria de implementacao: R$ 500/hora

### Opcao 3: API-as-a-Service

Empresas que querem integrar a inteligencia do Aurum em seus proprios produtos.

**O que inclui:**
- API REST completa
- SDKs (JavaScript, Python, Flutter)
- Webhooks para eventos
- Dashboard de uso
- Rate limiting customizado

**Precificacao sugerida:**
- Pay-as-you-go: R$ 0,02/mensagem de IA, R$ 0,05/requisicao TTS
- Pacotes: 10K msgs/mes = R$ 150, 100K msgs/mes = R$ 1.200
- Enterprise: preco negociado com volume

---

## Integracao Tecnica - Como Fazer Tudo Funcionar

### 1. Autenticacao (ja implementado)

```
Supabase Auth → profiles table → plan_tier enum
                                → usage tracking
                                → team management
```

O sistema ja esta pronto com:
- Login com Google OAuth
- Login com email/senha
- Tabela de profiles com plano
- Tabela de usage com contadores mensais
- RLS policies para isolamento de dados

### 2. Gateway de Pagamento (proximo passo)

**Recomendacao: Stripe**

Motivos:
- Suporta BRL (Real brasileiro)
- Checkout pre-construido
- Portal do cliente para gerenciar assinatura
- Webhooks para atualizar plano automaticamente
- Suporta trials, cupons, upgrades/downgrades

Fluxo:
```
Usuario clica "Assinar Pro"
    → Stripe Checkout (hosted page)
    → Pagamento confirmado
    → Webhook para /api/stripe-webhook
    → Atualiza profiles.plan = 'pro'
    → Atualiza profiles.plan_started_at
    → Usuario redirecionado para o app
```

Alternativas brasileiras: Pagar.me, Mercado Pago (se quiser boleto/PIX).

### 3. Feature Gating (ja implementado parcialmente)

```typescript
// No aurum-auth.tsx
canUseFeature('continuousMode')  // verifica plano
isWithinUsageLimit('aiMessages') // verifica uso mensal

// No componente
if (!canUseFeature('elevenlabsVoice')) {
  showUpgradeModal('Pro', 'Voz ultra-realista com ElevenLabs');
}
```

### 4. Infra Recomendada

| Componente | Free/Pro | Max | Teams/Enterprise |
|-----------|----------|-----|-----------------|
| Hosting | Vercel Free | Vercel Pro | Vercel Enterprise ou VPS dedicado |
| Database | Supabase Free | Supabase Pro | Supabase Pro + read replicas |
| IA | Groq (free) | Multi-provider | Dedicated instances |
| TTS | Google TTS | ElevenLabs Starter | ElevenLabs Scale |
| Storage | localStorage | Supabase Storage | S3/R2 dedicado |
| Automacao | - | n8n Cloud Starter | n8n Self-hosted |

### 5. Custos Totais Estimados (Infraestrutura)

**Com 100 usuarios:**
- Vercel: R$ 0 (hobby) a R$ 100/mes (pro)
- Supabase: R$ 0 (free tier) a R$ 120/mes (pro)
- ElevenLabs: R$ 100-500/mes (depende do uso)
- Groq: R$ 0 (free tier generoso)
- **Total: R$ 100-720/mes**

**Com 1.000 usuarios (mix de planos):**
- Estimativa: 700 free, 200 pro, 80 max, 20 teams
- Receita: R$ 0 + R$ 5.980 + R$ 6.392 + R$ 998 = **R$ 13.370/mes**
- Custos infra: ~R$ 3.000-5.000/mes
- **Lucro: ~R$ 8.000-10.000/mes**

**Com 10.000 usuarios:**
- Receita estimada: **R$ 80.000-150.000/mes**
- Custos infra: ~R$ 15.000-30.000/mes
- **Lucro: ~R$ 50.000-120.000/mes**

---

## Sugestoes Estrategicas

### Para Atrair Usuarios (Growth)

1. **Product-Led Growth**: O plano Free deve ser genuinamente util. 50 mensagens/mes e suficiente para experimentar e se apaixonar.

2. **Viral Loop**: Adicionar "Feito com Aurum" nas exportacoes do plano Free. Cada documento, lista ou analise exportada vira marketing.

3. **Programa de Referral**: "Convide um amigo e ganhe 1 mes de Pro gratis." Custo para voce e baixo, mas o valor percebido e alto.

4. **Content Marketing**: Criar videos no YouTube/TikTok mostrando o Aurum em acao. "Organizei toda minha vida com IA em 5 minutos."

5. **Comunidade**: Discord/Telegram com usuarios ativos. Feedback direto, beta testers, evangelistas.

### Para Converter Free em Pro

1. **Trial de 7 dias**: Dar acesso completo ao Pro por 7 dias na primeira vez.
2. **Limites suaves**: Ao invez de bloquear, mostrar "Voce fez 45/50 mensagens este mes" com barra de progresso.
3. **Notificacoes contextuais**: Quando o usuario tenta usar um recurso Pro, mostrar preview do que ele teria.
4. **Desconto de primeiro mes**: "Comece por R$ 14,90 no primeiro mes."

### Para Enterprise

1. **Case Studies**: Documentar os primeiros clientes enterprise. Resultados concretos vendem.
2. **Landing Page Dedicada**: aurum.ai/enterprise com formulario de contato.
3. **Parcerias**: Integrar com ferramentas que empresas ja usam (Slack, Teams, Notion, Jira).
4. **Compliance**: Obter certificacoes relevantes (LGPD compliance, SOC 2 se possivel).
5. **Consultoria**: Oferecer servico de implementacao + treinamento. R$ 500/hora.

### Proximos Passos Imediatos

1. **Integrar Stripe** para cobrar pelos planos Pro, Max e Teams
2. **Implementar feature gating real** nos componentes (modais de upgrade)
3. **Criar landing page publica** com pricing e call-to-action
4. **Configurar Google OAuth** no Supabase para login social
5. **Migrar dados do localStorage para Supabase** para usuarios logados
6. **Criar painel admin** para gerenciar usuarios e planos
7. **Monitorar metricas**: taxa de conversao Free→Pro, churn, LTV

---

*Documento gerado em 10/03/2026 - Aurum v2.1.0*
*Sestari Digital Ltda*
