"use client";

import { useState, useEffect, useRef } from "react";
import { PLANS, formatPrice } from "@/lib/aurum-plans";
import type { PlanTier } from "@/lib/aurum-plans";

const Check = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const ChevronDown = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const ArrowRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPricing: () => void;
  currentPlan?: string;
}

export default function LandingPage({ onGetStarted, onViewPricing }: LandingPageProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    { icon: "🎙️", title: "Comando por Voz", desc: "Fale naturalmente em portugues. JARVIS-like voice com ElevenLabs premium, reconhecimento de intencao e execucao automatica." },
    { icon: "🧠", title: "IA Multi-Modelo", desc: "Groq, Gemini, GPT-4o e Anthropic em cascata inteligente. Sempre a melhor resposta, automaticamente." },
    { icon: "📸", title: "Visao Multimodal", desc: "Envie fotos e imagens. Aurum analisa documentos, recibos, graficos e qualquer conteudo visual com IA." },
    { icon: "✅", title: "Gestao Completa", desc: "Tarefas, habitos, projetos, lembretes e financas. Tudo integrado, com streaks, Kanban e prioridades." },
    { icon: "📊", title: "Dashboard Inteligente", desc: "Visao 360 da sua produtividade. Graficos, metricas de habitos, resumo financeiro e insights da IA." },
    { icon: "🔒", title: "Seguro & Privado", desc: "Dados criptografados, autenticacao Google OAuth, backup automatico e controle total dos seus dados." },
  ];

  const testimonials = [
    { name: "Mariana S.", role: "Product Manager", text: "Aurum substituiu 5 apps que eu usava. Organizo tudo por voz enquanto dirijo.", avatar: "MS" },
    { name: "Rafael T.", role: "Desenvolvedor", text: "O modo JARVIS e absurdo. Falo 'cria tarefa deploy sexta' e pronto. Sem friccao.", avatar: "RT" },
    { name: "Juliana C.", role: "Empreendedora", text: "Controle financeiro + habitos + projetos num lugar so. Vale cada centavo do Pro.", avatar: "JC" },
  ];

  const faqs = [
    { q: "Aurum e gratuito?", a: "Sim! O plano Free e permanente e gratuito, com 30 mensagens/dia, tarefas e habitos. Os planos pagos desbloqueiam IA avancada, voz premium e limites maiores." },
    { q: "Como funciona a voz?", a: "Usamos ElevenLabs para voz ultra-realista e reconhecimento de fala nativo do navegador. Voce fala naturalmente e o Aurum entende contexto, intencao e executa acoes." },
    { q: "Meus dados sao seguros?", a: "Totalmente. Autenticacao via Supabase com Google OAuth, dados criptografados e voce pode exportar ou deletar tudo a qualquer momento." },
    { q: "Funciona no celular?", a: "Sim! Aurum e um PWA — instale como app nativo no celular ou desktop. Funciona offline, com notificacoes push e tela cheia." },
    { q: "Posso cancelar a qualquer momento?", a: "Claro. Sem contratos, sem multas. Cancele quando quiser pelo portal de billing do Stripe. Seus dados permanecem acessiveis." },
    { q: "Qual IA o Aurum usa?", a: "Cascata inteligente: Groq (ultra-rapido), Gemini 2.0 Flash, GPT-4o-mini e fallbacks. Sempre a resposta mais rapida e precisa disponivel." },
  ];

  const planOrder: PlanTier[] = ["free", "starter", "pro", "max"];

  const planColors: Record<PlanTier, { border: string; glow: string; badge: string; btn: string }> = {
    free: { border: "border-white/10", glow: "", badge: "bg-white/10 text-white/60", btn: "bg-white/10 hover:bg-white/15 text-white border border-white/10" },
    starter: { border: "border-amber-500/30", glow: "", badge: "bg-amber-500/10 text-amber-400", btn: "bg-amber-500 hover:bg-amber-400 text-white" },
    pro: { border: "border-cyan-500/40", glow: "shadow-[0_0_40px_rgba(0,217,255,0.15)]", badge: "bg-cyan-500/10 text-cyan-400", btn: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white" },
    max: { border: "border-purple-500/30", glow: "", badge: "bg-purple-500/10 text-purple-400", btn: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white" },
  };

  return (
    <div className="relative min-h-screen bg-[#050810] text-white overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(0,217,255,0.3)} 50%{box-shadow:0 0 50px rgba(0,217,255,0.5)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes gradient-x { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes orbit { 0%{transform:rotate(0deg) translateX(120px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(120px) rotate(-360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .anim-slide-up { animation: slide-up 0.8s ease-out forwards; opacity:0; }
        .anim-fade { animation: fade-in 0.6s ease-out forwards; opacity:0; }
        .glow-btn { animation: glow-pulse 2.5s ease-in-out infinite; }
        .gradient-text { background:linear-gradient(135deg,#ffd700 0%,#00d9ff 40%,#a78bfa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gradient-text-cyan { background:linear-gradient(135deg,#00d9ff 0%,#a78bfa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.03); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); }
        .glass-hover { transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .glass-hover:hover { background:rgba(255,255,255,0.06); border-color:rgba(0,217,255,0.2); transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.3),0 0 30px rgba(0,217,255,0.08); }
        .shimmer-border { background:linear-gradient(90deg,transparent,rgba(0,217,255,0.3),transparent); background-size:200% 100%; animation:shimmer 3s linear infinite; }
      `}</style>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-amber-500/[0.02] rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10">

        {/* ═══════════ NAVBAR ═══════════ */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-bold">A</div>
              <span className="text-lg font-bold tracking-tight">Aurum</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
              <a href="#features" className="hover:text-white transition">Recursos</a>
              <a href="#pricing" className="hover:text-white transition">Precos</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </div>
            <button onClick={onGetStarted} className="rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/15 transition border border-white/10">
              Entrar
            </button>
          </div>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
          {/* Orb decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 blur-xl" style={{ animation: 'float 4s ease-in-out infinite' }} />
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="anim-slide-up mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-sm text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Powered by AI Multi-Model
            </div>

            <h1 className="anim-slide-up text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8" style={{ animationDelay: '0.1s' }}>
              <span className="gradient-text">Seu assistente</span>
              <br />
              <span className="text-white">pessoal com IA</span>
            </h1>

            <p className="anim-slide-up max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-12 leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Organize tarefas, habitos, projetos e financas com comandos de voz.
              IA multi-modelo que entende voce e age automaticamente.
            </p>

            <div className="anim-slide-up flex flex-col sm:flex-row gap-4 justify-center mb-16" style={{ animationDelay: '0.3s' }}>
              <button onClick={onGetStarted} className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-lg font-bold text-white transition-all hover:from-cyan-400 hover:to-blue-400 glow-btn">
                Comecar Gratis
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={onViewPricing} className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10 hover:border-white/20">
                Ver Planos
              </button>
            </div>

            {/* Mini stats */}
            <div className="anim-slide-up flex flex-wrap justify-center gap-8 md:gap-16 text-sm" style={{ animationDelay: '0.4s' }}>
              {[["Multi-AI", "Groq + Gemini + GPT"], ["PWA", "Instale como app"], ["Gratis", "Para sempre"]].map(([label, desc]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <div>
                    <span className="font-semibold text-white">{label}</span>
                    <span className="text-white/40 ml-2">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ LOGOS / TRUST BAR ═══════════ */}
        <section className="py-12 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center items-center gap-8 md:gap-16 text-white/20 text-sm font-medium tracking-wider uppercase">
            {["Supabase", "Stripe", "ElevenLabs", "Groq", "Gemini", "Vercel"].map((brand) => (
              <span key={brand} className="hover:text-white/40 transition">{brand}</span>
            ))}
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" data-animate className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">Recursos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Tudo que voce precisa.</h2>
              <h2 className="text-4xl md:text-5xl font-black gradient-text-cyan">Nada que voce nao precisa.</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="glass glass-hover rounded-2xl p-8 group"
                  style={{
                    animation: isVisible["features"] ? `slide-up 0.6s ease-out ${i * 0.08}s forwards` : "none",
                    opacity: isVisible["features"] ? undefined : 0,
                  }}
                >
                  <div className="text-4xl mb-5" style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-cyan-400 transition">{f.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" data-animate className="py-28 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-20">
              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">Como funciona</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">3 passos. Zero friccao.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: "01", title: "Crie sua conta", desc: "Cadastro em 10 segundos com Google ou email. Sem cartao de credito." },
                { n: "02", title: "Fale ou digite", desc: "Use voz natural: 'cria tarefa estudar amanha' — Aurum entende e executa." },
                { n: "03", title: "Aurum organiza", desc: "IA trabalha 24/7. Tarefas, habitos, financas — tudo sincronizado." },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative"
                  style={{
                    animation: isVisible["how"] ? `slide-up 0.6s ease-out ${i * 0.15}s forwards` : "none",
                    opacity: isVisible["how"] ? undefined : 0,
                  }}
                >
                  <div className="text-6xl font-black text-white/[0.04] mb-4">{step.n}</div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section id="social" data-animate className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">Depoimentos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Amado por profissionais.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-8"
                  style={{
                    animation: isVisible["social"] ? `slide-up 0.6s ease-out ${i * 0.1}s forwards` : "none",
                    opacity: isVisible["social"] ? undefined : 0,
                  }}
                >
                  <p className="text-white/60 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/70">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section id="pricing" data-animate className="py-28 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-16">
              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">Precos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Simples e transparente.</h2>
              <p className="text-white/45 text-lg max-w-xl mx-auto">Comece gratis. Escale quando precisar.</p>
            </div>

            {/* Billing toggle */}
            <div className="flex justify-center mb-14">
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${billingPeriod === "monthly" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${billingPeriod === "yearly" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                >
                  Anual
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">-20%</span>
                </button>
              </div>
            </div>

            {/* Pricing cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {planOrder.map((tier, idx) => {
                const plan = PLANS[tier];
                const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
                const colors = planColors[tier];
                const isPopular = plan.popular;

                return (
                  <div
                    key={tier}
                    className={`relative rounded-2xl border ${colors.border} ${colors.glow} bg-white/[0.02] p-8 flex flex-col transition-all hover:bg-white/[0.04]`}
                    style={{
                      animation: isVisible["pricing"] ? `slide-up 0.6s ease-out ${idx * 0.1}s forwards` : "none",
                      opacity: isVisible["pricing"] ? undefined : 0,
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
                          Mais Popular
                        </div>
                      </div>
                    )}

                    <div className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold mb-4 ${colors.badge}`}>
                      {plan.name}
                    </div>

                    <div className="mb-6">
                      {plan.priceMonthly === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">R$0</span>
                          <span className="text-white/30 text-sm">/mes</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">{formatPrice(price)}</span>
                          <span className="text-white/30 text-sm">/mes</span>
                        </div>
                      )}
                      <p className="text-xs text-white/30 mt-2">{plan.description}</p>
                    </div>

                    <button
                      onClick={onGetStarted}
                      className={`w-full rounded-xl py-3 text-sm font-bold transition-all mb-8 ${colors.btn}`}
                    >
                      {plan.priceMonthly === 0 ? "Comecar Gratis" : "Assinar Agora"}
                    </button>

                    <div className="space-y-3 flex-1">
                      {plan.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-cyan-400/60 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/50">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise CTA */}
            <div className="mt-12 text-center">
              <p className="text-white/30 text-sm">Precisa de mais? <button onClick={onGetStarted} className="text-cyan-400 hover:text-cyan-300 font-medium transition">Fale com vendas</button></p>
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section id="faq" data-animate className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">FAQ</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Perguntas frequentes</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="glass rounded-xl overflow-hidden"
                  style={{
                    animation: isVisible["faq"] ? `slide-up 0.5s ease-out ${i * 0.05}s forwards` : "none",
                    opacity: isVisible["faq"] ? undefined : 0,
                  }}
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition"
                  >
                    <span className="font-semibold text-white pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/30 flex-shrink-0 transition-transform ${expandedFAQ === i ? "rotate-180" : ""}`} />
                  </button>
                  {expandedFAQ === i && (
                    <div className="px-6 pb-6 text-sm text-white/45 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Pronto para ter seu <span className="gradient-text">assistente pessoal?</span>
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a profissionais que ja transformaram sua produtividade com o Aurum.
            </p>
            <button onClick={onGetStarted} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-10 py-5 text-lg font-bold text-white transition-all hover:from-cyan-400 hover:to-blue-400 glow-btn">
              Comecar Gratis Agora
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-white/25 text-sm mt-6">Sem cartao de credito. Cancele quando quiser.</p>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="border-t border-white/5 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-xs font-bold">A</div>
                  <span className="font-bold">Aurum</span>
                </div>
                <p className="text-sm text-white/30 leading-relaxed">Assistente pessoal com IA e voz. Organiza sua vida automaticamente.</p>
              </div>
              {[
                { title: "Produto", links: ["Recursos", "Precos", "Changelog"] },
                { title: "Legal", links: ["Termos de Uso", "Privacidade", "Cookies"] },
                { title: "Suporte", links: ["Contato", "Status", "Documentacao"] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-white/60 mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link}><button className="text-sm text-white/30 hover:text-white/60 transition">{link}</button></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/20">&copy; 2026 Sestari Digital. Todos os direitos reservados.</p>
              <div className="flex gap-6">
                {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                  <button key={s} className="text-xs text-white/20 hover:text-white/40 transition">{s}</button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
