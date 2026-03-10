# Aurum - Passo a Passo Completo

## Principio #1: Gastar ZERO ate ter receita

Tudo abaixo usa free tiers. Voce so paga quando usuarios pagam voce primeiro.

---

## FASE 1: Autenticacao Funcionando (Hoje)

### Passo 1: Configurar Google OAuth no Supabase

1. Acesse https://supabase.com/dashboard/project/njwejucemfgwhfqhibcf/auth/providers
2. Clique em **Google**
3. Vai pedir **Client ID** e **Client Secret**. Para conseguir:
   - Acesse https://console.cloud.google.com
   - Crie um novo projeto (ou use existente)
   - Va em **APIs & Services > Credentials**
   - Clique **Create Credentials > OAuth Client ID**
   - Tipo: **Web application**
   - Nome: "Aurum Login"
   - Em **Authorized redirect URIs** adicione:
     ```
     https://njwejucemfgwhfqhibcf.supabase.co/auth/v1/callback
     ```
   - Copie o **Client ID** e **Client Secret**
4. Cole no Supabase e salve
5. Custo: **R$ 0** (Google OAuth e gratuito)

### Passo 2: Configurar URL de Redirect

1. No Supabase, va em **Authentication > URL Configuration**
2. Em **Site URL** coloque: `http://localhost:3000` (dev) ou seu dominio final
3. Em **Redirect URLs** adicione:
   - `http://localhost:3000`
   - `https://seudominio.com` (quando tiver)

### Passo 3: Testar Login

1. Rode `npm run dev` no Aurum
2. Abra http://localhost:3000
3. Voce deve ver a tela de login
4. Teste login com Google e com email/senha
5. Verifique no Supabase dashboard que o usuario apareceu em **Authentication > Users**

---

## FASE 2: Deploy Gratuito na Vercel (Semana 1)

### Passo 4: Deploy na Vercel

1. Acesse https://vercel.com e faca login com GitHub
2. Importe o repositorio do Aurum
3. Em **Environment Variables** adicione TODAS as variaveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `GEMINI_API_KEY`
   - `ANTHROPIC_API_KEY`
4. Clique Deploy
5. Custo: **R$ 0** (Vercel Hobby e gratuito)

### Passo 5: Atualizar URLs no Supabase

1. Depois do deploy, voce tera uma URL tipo `aurum-xyz.vercel.app`
2. Volte no Supabase > Authentication > URL Configuration
3. Atualize **Site URL** para `https://aurum-xyz.vercel.app`
4. Adicione nas **Redirect URLs**: `https://aurum-xyz.vercel.app`
5. Volte no Google Cloud Console e adicione o redirect:
   ```
   https://njwejucemfgwhfqhibcf.supabase.co/auth/v1/callback
   ```

### Passo 6: Dominio Customizado (Opcional)

1. Compre um dominio (aurum.ai, useaurum.com, etc.)
2. No Vercel, va em Settings > Domains e adicione
3. Custo: ~R$ 40-80/ano dependendo do dominio

---

## FASE 3: Pagamentos com Stripe (Semana 2)

### Por que Stripe e nao Mercado Pago?

- Stripe suporta assinaturas recorrentes nativamente
- Tem portal do cliente pronto (usuario cancela/muda plano sozinho)
- Webhooks confiaveis para atualizar plano automaticamente
- Aceita cartao internacional (mais clientes potenciais)
- Se quiser PIX/boleto depois, adiciona Stripe + Pagar.me juntos

### Passo 7: Criar Conta Stripe

1. Acesse https://stripe.com e crie conta
2. Complete a verificacao da empresa (Sestari Digital Ltda)
3. Pegue as chaves em **Developers > API Keys**:
   - `STRIPE_SECRET_KEY` (sk_live_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
4. Custo: **R$ 0** (Stripe so cobra % por transacao: 3.99% + R$ 0.39)

### Passo 8: Criar Produtos no Stripe

1. Va em **Products** no Stripe Dashboard
2. Crie 3 produtos:

**Aurum Pro**
- Preco mensal: R$ 29,90
- Preco anual: R$ 286,80 (R$ 23,90/mes)

**Aurum Max**
- Preco mensal: R$ 79,90
- Preco anual: R$ 766,80 (R$ 63,90/mes)

**Aurum Teams**
- Preco mensal: R$ 49,90 por membro
- Preco anual: R$ 478,80/membro (R$ 39,90/mes)

3. Anote os `price_id` de cada um (price_xxx...)

### Passo 9: Me peca para implementar

Quando tiver os price_ids do Stripe, me peca para criar:
- `/api/stripe/checkout` - cria sessao de checkout
- `/api/stripe/webhook` - recebe confirmacao de pagamento
- `/api/stripe/portal` - portal do cliente para gerenciar assinatura
- Atualizar `PricingPage` para conectar com Stripe real

**Como funciona o fluxo:**
```
Usuario clica "Assinar Pro"
  → API cria Stripe Checkout Session
  → Usuario vai para pagina do Stripe (segura)
  → Paga com cartao
  → Stripe envia webhook para /api/stripe/webhook
  → Webhook atualiza profiles.plan = 'pro' no Supabase
  → Usuario volta para o Aurum ja com plano ativo
```

Voce nunca toca em dados de cartao. Stripe cuida de tudo.

### Passo 10: Variaveis de Ambiente do Stripe

Adicione no `.env.local` e na Vercel:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## FASE 4: Feature Gating Real (Semana 2-3)

### Passo 11: Me peca para implementar feature gating

Eu vou criar:
- **UpgradeModal** - componente bonito que aparece quando usuario Free tenta usar recurso Pro
- **UsageBar** - barra de progresso mostrando "45/50 mensagens usadas"
- **PlanBadge** - badge "PRO" nos recursos bloqueados
- Integracao em cada pagina: ChatPage (limitar mensagens), VisionPage (bloquear para Free), etc.

### Passo 12: Testar Fluxo Completo

1. Crie uma conta Free
2. Use 50 mensagens → deve mostrar modal de upgrade
3. Tente acessar Vision Board → deve mostrar "Disponivel no Pro"
4. Faca upgrade para Pro (use modo teste do Stripe)
5. Confirme que tudo desbloqueia

---

## FASE 5: Otimizacao de Custos (Semana 3-4)

### Passo 13: Controlar Custos de IA

**Regra de ouro: so gaste dinheiro em APIs pagas quando o usuario paga voce.**

| Plano | Backend de IA | Custo |
|-------|--------------|-------|
| Free | Groq (Llama 3.3 70B) | R$ 0 |
| Pro | Groq + ElevenLabs | ~R$ 5-15/usuario |
| Max | Groq + Gemini + Claude + ElevenLabs | ~R$ 20-40/usuario |

- **Free usa APENAS Groq** (free tier: 30 requests/min, ~14.4K msgs/dia - mais que suficiente)
- **Pro/Max**: Groq como padrao, modelos pagos so quando usuario escolhe
- **ElevenLabs**: So ativa para Pro/Max. Free usa Google TTS (custo zero)

### Passo 14: Rate Limiting

Me peca para implementar:
- Rate limit por IP (evitar abuso)
- Rate limit por usuario (respeitar limites do plano)
- Fila de requisicoes para usuarios Free (prioridade menor)

### Passo 15: Monitorar Gastos

1. Configure alertas no Stripe: notificacao quando receber pagamento
2. Configure budget alerts na Vercel
3. Monitore uso do Supabase (free tier: 500MB DB, 1GB storage, 50K auth users)
4. Monitore uso do Groq (dashboard deles mostra consumo)

---

## FASE 6: Marketing e Lancamento (Semana 4+)

### Passo 16: Landing Page

Me peca para criar uma landing page publica em `/landing` com:
- Hero section com demo do Aurum
- Features section
- Pricing (ja temos o PricingPage)
- Testimonials (quando tiver)
- CTA "Comece Gratis"

### Passo 17: SEO Basico

- Adicionar meta tags (title, description, og:image)
- Criar sitemap.xml
- Submeter no Google Search Console
- Custo: **R$ 0**

### Passo 18: Primeiros Usuarios

1. Poste no Twitter/X, LinkedIn, Reddit (r/productivity, r/artificial)
2. Product Hunt launch (quando estiver polido)
3. Video demo no YouTube/TikTok
4. Compartilhe em comunidades de IA brasileiras
5. Custo: **R$ 0** (so seu tempo)

### Passo 19: Programa de Referral

Me peca para implementar:
- "Convide um amigo → ganhe 1 semana de Pro gratis"
- Link unico por usuario
- Tracking de convites
- Custo: quase zero (so estende trial por 7 dias)

---

## FASE 7: Enterprise (Mes 2+)

### Passo 20: Preparar para Enterprise

So faca isso quando tiver pelo menos 50-100 usuarios pagantes:

1. Criar pagina `/enterprise` com formulario de contato
2. Preparar proposta comercial (docx template)
3. Documentar API do Aurum
4. Preparar ambiente multi-tenant (schema separation no Supabase)

---

## Resumo de Custos por Fase

| Fase | Custo | Quando |
|------|-------|--------|
| 1. Auth | R$ 0 | Hoje |
| 2. Deploy | R$ 0 | Semana 1 |
| 3. Stripe | R$ 0 (so % por venda) | Semana 2 |
| 4. Gating | R$ 0 | Semana 2-3 |
| 5. Otimizacao | R$ 0 | Semana 3-4 |
| 6. Marketing | R$ 0-80 (dominio) | Semana 4 |
| 7. Enterprise | R$ 0 | Mes 2+ |

**Total ate ter o primeiro usuario pagante: R$ 0 a R$ 80**

Quando chegar o primeiro pagamento de R$ 29,90, o Stripe cobra ~R$ 1,58 (3.99% + R$ 0.39). Voce recebe R$ 28,32 limpo. Lucro desde o dia 1.

---

## Checklist Rapido

- [ ] Configurar Google OAuth no Google Cloud Console
- [ ] Colar Client ID/Secret no Supabase
- [ ] Configurar redirect URLs
- [ ] Testar login local
- [ ] Deploy na Vercel
- [ ] Atualizar URLs no Supabase pos-deploy
- [ ] Criar conta Stripe
- [ ] Criar produtos/precos no Stripe
- [ ] Me pedir para implementar integracao Stripe
- [ ] Me pedir para implementar feature gating
- [ ] Testar fluxo completo Free → Pro
- [ ] Lancar para primeiros usuarios
- [ ] Me pedir para criar landing page
- [ ] Postar em redes sociais

---

*Sempre que precisar implementar qualquer passo tecnico, e so me pedir. Eu crio o codigo, voce faz o deploy.*
