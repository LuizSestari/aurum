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
const Star = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
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

  // Parallax mouse effect for hero
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const features = [
    { icon: "🎙️", title: "Comando por Voz", desc: "Fale naturalmente em português. Reconhecimento inteligente de intenção com execução automática de ações, como um verdadeiro JARVIS.", accent: "from-amber-500/20 to-amber-600/5" },
    { icon: "🧠", title: "IA Multi-Modelo", desc: "Groq, Gemini, Claude e Ollama em cascata inteligente. Sempre a melhor resposta, da forma mais rápida possível.", accent: "from-yellow-500/20 to-amber-600/5" },
    { icon: "📸", title: "Visão Multimodal", desc: "Envie fotos e imagens. Aurum analisa documentos, recibos, gráficos e qualquer conteúdo visual com IA avançada.", accent: "from-orange-500/20 to-amber-600/5" },
    { icon: "✅", title: "Gestão Completa", desc: "Tarefas, hábitos, projetos, lembretes e finanças. Tudo integrado com streaks, Kanban e prioridades inteligentes.", accent: "from-amber-400/20 to-yellow-600/5" },
    { icon: "📊", title: "Dashboard Inteligente", desc: "Visão 360° da sua produtividade. Gráficos, métricas de hábitos, resumo financeiro e insights da IA em tempo real.", accent: "from-amber-500/20 to-orange-600/5" },
    { icon: "☁️", title: "Sync & Segurança", desc: "Dados sincronizados na nuvem, criptografia, autenticação Google OAuth, backup automático e controle total.", accent: "from-yellow-500/20 to-amber-500/5" },
  ];

  const testimonials = [
    { name: "Mariana S.", role: "Product Manager", text: "Aurum substituiu 5 apps que eu usava. Organizo tudo por voz enquanto dirijo. A IA entende exatamente o que preciso.", avatar: "MS", stars: 5 },
    { name: "Rafael T.", role: "Desenvolvedor", text: "O modo JARVIS é absurdo. Falo 'cria tarefa deploy sexta' e pronto. Zero fricção, máxima produtividade.", avatar: "RT", stars: 5 },
    { name: "Juliana C.", role: "Empreendedora", text: "Controle financeiro + hábitos + projetos num lugar só. O dashboard me dá visão completa do meu dia.", avatar: "JC", stars: 5 },
  ];

  const faqs = [
    { q: "Aurum é gratuito?", a: "Sim! O plano Free é permanente e gratuito, com 30 mensagens/dia, tarefas e hábitos. Os planos pagos desbloqueiam IA avançada, voz premium e limites maiores." },
    { q: "Como funciona a voz?", a: "Usamos reconhecimento de fala avançado do navegador com detecção de silêncio inteligente. Você fala naturalmente e o Aurum entende contexto, intenção e executa ações automaticamente." },
    { q: "Meus dados são seguros?", a: "Totalmente. Autenticação via Supabase com Google OAuth, dados criptografados e sincronizados na nuvem. Você pode exportar ou deletar tudo a qualquer momento." },
    { q: "Funciona no celular?", a: "Sim! Aurum é um PWA — instale como app nativo no celular ou desktop. Funciona offline, com notificações push e tela cheia." },
    { q: "Posso cancelar a qualquer momento?", a: "Claro. Sem contratos, sem multas. Cancele quando quiser pelo portal de billing do Stripe. Seus dados permanecem acessíveis." },
    { q: "Qual IA o Aurum usa?", a: "Cascata inteligente: Groq (ultra-rápido com Llama 3.3 70B), Ollama local, Claude da Anthropic e Gemini 2.0 Flash como fallbacks. Sempre a resposta mais rápida e precisa." },
  ];

  const planOrder: PlanTier[] = ["free", "starter", "pro", "max"];

  const planColors: Record<PlanTier, { border: string; glow: string; badge: string; btn: string }> = {
    free: { border: "border-white/10", glow: "", badge: "bg-white/10 text-white/60", btn: "bg-white/10 hover:bg-white/15 text-white border border-white/10" },
    starter: { border: "border-amber-500/30", glow: "", badge: "bg-amber-500/10 text-amber-400", btn: "bg-amber-500 hover:bg-amber-400 text-black font-bold" },
    pro: { border: "border-amber-400/50", glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]", badge: "bg-amber-500/10 text-amber-400", btn: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold" },
    max: { border: "border-amber-300/40", glow: "shadow-[0_0_40px_rgba(252,211,77,0.12)]", badge: "bg-amber-400/10 text-amber-300", btn: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold" },
    dev: { border: "border-emerald-500/40", glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]", badge: "bg-emerald-500/10 text-emerald-400", btn: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold" },
  };

  return (
    <div className="relative min-h-screen bg-[#080706] text-white overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-15px) rotate(2deg)} }
        @keyframes gold-pulse { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.1)} 50%{box-shadow:0 0 30px rgba(245,158,11,0.4), 0 0 80px rgba(245,158,11,0.15)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes glow-ring { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
        @keyframes text-glow { 0%,100%{text-shadow:0 0 20px rgba(245,158,11,0.3)} 50%{text-shadow:0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2)} }
        @keyframes particle-float { 0%{transform:translateY(0) translateX(0);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateY(-100vh) translateX(20px);opacity:0} }
        .anim-slide-up { animation: slide-up 0.8s ease-out forwards; opacity:0; }
        .anim-fade { animation: fade-in 0.6s ease-out forwards; opacity:0; }
        .gold-glow-btn { animation: gold-pulse 3s ease-in-out infinite; }
        .gradient-gold { background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 30%,#d97706 60%,#fbbf24 100%); background-size:200% 200%; animation:shimmer 4s linear infinite; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gradient-gold-subtle { background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 50%,#d97706 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.02); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.05); }
        .glass-gold { background:rgba(245,158,11,0.03); backdrop-filter:blur(16px); border:1px solid rgba(245,158,11,0.08); }
        .glass-hover { transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .glass-hover:hover { background:rgba(245,158,11,0.06); border-color:rgba(245,158,11,0.15); transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(245,158,11,0.06); }
        .gold-shimmer-border { position:relative; overflow:hidden; }
        .gold-shimmer-border::before { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(245,158,11,0.08),transparent); animation:shimmer 3s linear infinite; }
      `}</style>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[-15%] w-[500px] h-[500px] bg-orange-600/[0.025] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-yellow-500/[0.02] rounded-full blur-[120px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(rgba(245,158,11,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30"
            style={{
              left: `${15 + i * 15}%`,
              bottom: '-5%',
              animation: `particle-float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">

        {/* ═══════════ NAVBAR ═══════════ */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-amber-500/[0.06] bg-[#080706]/85 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-black shadow-lg shadow-amber-500/20">A</div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-amber-400">A</span>
                <span className="text-white/80">urum</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-white/40">
              <a href="#features" className="hover:text-amber-400 transition">Recursos</a>
              <a href="#how" className="hover:text-amber-400 transition">Como funciona</a>
              <a href="#pricing" className="hover:text-amber-400 transition">Preços</a>
              <a href="#faq" className="hover:text-amber-400 transition">FAQ</a>
            </div>
            <button onClick={onGetStarted} className="rounded-xl bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition border border-amber-500/20 hover:border-amber-500/30">
              Entrar
            </button>
          </div>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
          {/* Interactive orb */}
          <div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] pointer-events-none"
            style={{
              transform: `translate(calc(-50% + ${mousePos.x * 15}px), calc(-50% + ${mousePos.y * 15}px))`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] blur-[100px]" />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 50%, transparent 70%)',
                animation: 'float 5s ease-in-out infinite',
              }}
            />
            {/* Orbit ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-amber-500/[0.08]"
              style={{ animation: 'glow-ring 4s ease-in-out infinite' }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-amber-500/[0.04]"
              style={{ animation: 'glow-ring 4s ease-in-out infinite 1s' }}
            />
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="anim-slide-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-500/15 bg-amber-500/[0.06] px-5 py-2.5 text-sm text-amber-400/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              IA Multi-Modelo • Voz Inteligente • Grátis
            </div>

            <h1 className="anim-slide-up text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.92] mb-8" style={{ animationDelay: '0.1s' }}>
              <span className="gradient-gold">Seu assistente</span>
              <br />
              <span className="text-white" style={{ animation: 'text-glow 4s ease-in-out infinite' }}>pessoal com IA</span>
            </h1>

            <p className="anim-slide-up max-w-2xl mx-auto text-lg md:text-xl text-white/40 mb-12 leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Organize tarefas, hábitos, projetos e finanças com comandos de voz.
              <br className="hidden md:block" />
              IA que entende você e age <span className="text-amber-400/70">automaticamente</span>.
            </p>

            <div className="anim-slide-up flex flex-col sm:flex-row gap-4 justify-center mb-16" style={{ animationDelay: '0.3s' }}>
              <button onClick={onGetStarted} className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4.5 text-lg font-bold text-black transition-all hover:from-amber-400 hover:to-amber-500 gold-glow-btn">
                Começar Grátis
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={onViewPricing} className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] px-10 py-4.5 text-lg font-medium text-white/70 transition-all hover:bg-amber-500/[0.08] hover:border-amber-500/25 hover:text-white">
                Ver Planos
              </button>
            </div>

            {/* Mini stats */}
            <div className="anim-slide-up flex flex-wrap justify-center gap-8 md:gap-14 text-sm" style={{ animationDelay: '0.4s' }}>
              {[
                ["Multi-AI", "Groq + Claude + Gemini"],
                ["PWA", "Instale como app nativo"],
                ["Grátis", "Para sempre, sem cartão"],
              ].map(([label, desc]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  <div>
                    <span className="font-semibold text-amber-200/80">{label}</span>
                    <span className="text-white/30 ml-2">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ TRUST BAR ═══════════ */}
        <section className="py-14 border-y border-amber-500/[0.06]">
          <p className="text-center text-xs text-white/20 uppercase tracking-[0.25em] mb-6">Powered by</p>
          <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {[
              { name: "Supabase", icon: "⚡" },
              { name: "Stripe", icon: "💳" },
              { name: "Groq", icon: "🚀" },
              { name: "Anthropic", icon: "🧠" },
              { name: "Gemini", icon: "✨" },
              { name: "Vercel", icon: "▲" },
            ].map((brand) => (
              <div key={brand.name} className="flex items-center gap-2 text-white/15 hover:text-amber-400/40 transition text-sm font-medium tracking-wider">
                <span className="text-base opacity-50">{brand.icon}</span>
                {brand.name}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" data-animate className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-amber-400/80 text-sm font-semibold tracking-[0.2em] uppercase mb-4">Recursos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Tudo que você precisa.</h2>
              <p className="text-4xl md:text-5xl font-black gradient-gold-subtle">Nada que você não precisa.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="glass glass-hover rounded-2xl p-8 group gold-shimmer-border"
                  style={{
                    animation: isVisible["features"] ? `slide-up 0.6s ease-out ${i * 0.08}s forwards` : "none",
                    opacity: isVisible["features"] ? undefined : 0,
                  }}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} mb-6 text-3xl`} style={{ animation: 'float 3.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white group-hover:text-amber-400 transition">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" data-animate className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-20">
              <p className="text-amber-400/80 text-sm font-semibold tracking-[0.2em] uppercase mb-4">Como funciona</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">3 passos. <span className="gradient-gold-subtle">Zero fricção.</span></h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { n: "01", title: "Crie sua conta", desc: "Cadastro em 10 segundos com Google. Sem cartão de crédito, sem fricção.", icon: "🔑" },
                { n: "02", title: "Fale ou digite", desc: "Use voz natural: 'cria tarefa estudar amanhã' — Aurum entende e executa na hora.", icon: "🎤" },
                { n: "03", title: "Aurum organiza", desc: "IA trabalha 24/7. Tarefas, hábitos, finanças — tudo sincronizado na nuvem.", icon: "✨" },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative text-center md:text-left"
                  style={{
                    animation: isVisible["how"] ? `slide-up 0.6s ease-out ${i * 0.15}s forwards` : "none",
                    opacity: isVisible["how"] ? undefined : 0,
                  }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-gold mb-6 text-2xl">
                    {step.icon}
                  </div>
                  <div className="text-5xl font-black text-amber-500/[0.08] absolute -top-2 right-0 md:right-auto md:-left-2 select-none">{step.n}</div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ DEMO PREVIEW ═══════════ */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-gold rounded-3xl p-1">
              <div className="rounded-[22px] bg-[#0C0A09] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-white/20 font-mono">aurum-app.vercel.app</span>
                  </div>
                </div>

                {/* Simulated chat */}
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-amber-500/10 border border-amber-500/15 px-5 py-3 max-w-sm">
                      <p className="text-sm text-white/80">Cria uma tarefa para estudar React amanhã às 14h</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.06] px-5 py-3 max-w-md">
                      <p className="text-sm text-white/70">Feito. Tarefa <span className="text-amber-400">"Estudar React"</span> adicionada para amanhã às 14h com prioridade média.</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/50">
                        <span>✅ Tarefa criada</span>
                        <span>•</span>
                        <span>via Groq (0.3s)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-amber-500/10 border border-amber-500/15 px-5 py-3 max-w-sm">
                      <p className="text-sm text-white/80">Gastei 45 reais no almoço</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.06] px-5 py-3 max-w-md">
                      <p className="text-sm text-white/70">Registrado. Despesa de <span className="text-amber-400">R$ 45,00</span> em Alimentação.</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/50">
                        <span>💲 Transação registrada</span>
                        <span>•</span>
                        <span>via Groq (0.2s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-white/20 mt-4">Demonstração real do Aurum em ação</p>
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section id="social" data-animate className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-400/80 text-sm font-semibold tracking-[0.2em] uppercase mb-4">Depoimentos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Amado por <span className="gradient-gold-subtle">profissionais.</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="glass glass-hover rounded-2xl p-8"
                  style={{
                    animation: isVisible["social"] ? `slide-up 0.6s ease-out ${i * 0.1}s forwards` : "none",
                    opacity: isVisible["social"] ? undefined : 0,
                  }}
                >
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/25 to-orange-500/25 flex items-center justify-center text-xs font-bold text-amber-300/70 border border-amber-500/10">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/35">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section id="pricing" data-animate className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-16">
              <p className="text-amber-400/80 text-sm font-semibold tracking-[0.2em] uppercase mb-4">Preços</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Simples e <span className="gradient-gold-subtle">transparente.</span></h2>
              <p className="text-white/35 text-lg max-w-xl mx-auto">Comece grátis. Escale quando precisar.</p>
            </div>

            {/* Billing toggle */}
            <div className="flex justify-center mb-14">
              <div className="flex items-center gap-1 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${billingPeriod === "monthly" ? "bg-amber-500/15 text-amber-300 shadow-lg shadow-amber-500/5" : "text-white/35 hover:text-white/55"}`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${billingPeriod === "yearly" ? "bg-amber-500/15 text-amber-300 shadow-lg shadow-amber-500/5" : "text-white/35 hover:text-white/55"}`}
                >
                  Anual
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">-20%</span>
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
                    className={`relative rounded-2xl border ${colors.border} ${colors.glow} bg-white/[0.015] p-8 flex flex-col transition-all hover:bg-white/[0.03] ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
                    style={{
                      animation: isVisible["pricing"] ? `slide-up 0.6s ease-out ${idx * 0.1}s forwards` : "none",
                      opacity: isVisible["pricing"] ? undefined : 0,
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <div className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-1.5 text-xs font-bold text-black whitespace-nowrap shadow-lg shadow-amber-500/20">
                          Mais Popular
                        </div>
                      </div>
                    )}

                    <div className={`inline-flex w-fit rounded-lg px-3 py-1.5 text-xs font-semibold mb-5 ${colors.badge}`}>
                      {plan.name}
                    </div>

                    <div className="mb-6">
                      {plan.priceMonthly === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">R$0</span>
                          <span className="text-white/25 text-sm">/mês</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">{formatPrice(price)}</span>
                          <span className="text-white/25 text-sm">/mês</span>
                        </div>
                      )}
                      <p className="text-xs text-white/25 mt-2">{plan.description}</p>
                    </div>

                    <button
                      onClick={onGetStarted}
                      className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all mb-8 ${colors.btn}`}
                    >
                      {plan.priceMonthly === 0 ? "Começar Grátis" : "Assinar Agora"}
                    </button>

                    <div className="space-y-3.5 flex-1">
                      {plan.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-amber-400/50 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/40">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise */}
            <div className="mt-10 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-white">Enterprise / Teams</span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-[10px] font-bold text-amber-400/60 uppercase tracking-wider">Sob consulta</span>
                </div>
                <p className="text-sm text-white/30 max-w-lg">SSO, white-label, membros ilimitados, SLA dedicado e customizações. Para empresas que precisam de escala e controle total.</p>
              </div>
              <a href="mailto:luizsestari2004@gmail.com?subject=Aurum%20Enterprise" className="flex-shrink-0 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-8 py-3 text-sm font-bold text-amber-400/80 hover:bg-amber-500/10 transition whitespace-nowrap hover:text-amber-300">
                Falar com vendas
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section id="faq" data-animate className="py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-400/80 text-sm font-semibold tracking-[0.2em] uppercase mb-4">FAQ</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Perguntas frequentes</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl overflow-hidden transition-all hover:border-amber-500/10"
                  style={{
                    animation: isVisible["faq"] ? `slide-up 0.5s ease-out ${i * 0.05}s forwards` : "none",
                    opacity: isVisible["faq"] ? undefined : 0,
                  }}
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-amber-500/[0.02] transition"
                  >
                    <span className="font-semibold text-white pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-amber-400/30 flex-shrink-0 transition-transform duration-300 ${expandedFAQ === i ? "rotate-180" : ""}`} />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: expandedFAQ === i ? '200px' : '0px', opacity: expandedFAQ === i ? 1 : 0 }}
                  >
                    <div className="px-6 pb-6 text-sm text-white/40 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            {/* Glow behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

            <h2 className="relative text-4xl md:text-6xl font-black text-white mb-6">
              Pronto para ter seu{" "}
              <span className="gradient-gold">assistente pessoal?</span>
            </h2>
            <p className="relative text-white/35 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a profissionais que já transformaram sua produtividade com o Aurum.
            </p>
            <button onClick={onGetStarted} className="relative group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-5 text-lg font-bold text-black transition-all hover:from-amber-400 hover:to-amber-500 gold-glow-btn">
              Começar Grátis Agora
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="relative text-white/20 text-sm mt-6">Sem cartão de crédito. Cancele quando quiser.</p>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="border-t border-amber-500/[0.06] py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-black">A</div>
                  <span className="font-bold">
                    <span className="text-amber-400">A</span>
                    <span className="text-white/80">urum</span>
                  </span>
                </div>
                <p className="text-sm text-white/25 leading-relaxed">Assistente pessoal com IA e voz. Organiza sua vida automaticamente.</p>
              </div>
              {[
                { title: "Produto", links: ["Recursos", "Preços", "Changelog"] },
                { title: "Legal", links: ["Termos de Uso", "Privacidade", "Cookies"] },
                { title: "Suporte", links: ["Contato", "Status", "Documentação"] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-amber-400/40 mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link}><button className="text-sm text-white/25 hover:text-amber-400/60 transition">{link}</button></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-amber-500/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/15">&copy; 2026 Sestari Digital. Todos os direitos reservados.</p>
              <div className="flex gap-6">
                {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                  <button key={s} className="text-xs text-white/15 hover:text-amber-400/40 transition">{s}</button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
