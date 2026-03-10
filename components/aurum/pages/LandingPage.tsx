"use client";

import { useState, useEffect, useRef } from "react";
// Icons as inline SVG components to avoid lucide-react dependency
const ChevronDown = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const Check = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
import { PLANS, formatPrice } from "@/lib/aurum-plans";

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPricing: () => void;
  currentPlan?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function LandingPage({ onGetStarted, onViewPricing, currentPlan }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const faqs: FAQItem[] = [
    {
      question: "O que é o Aurum?",
      answer: "Aurum é um assistente pessoal com IA que funciona por voz. Você pode organizar tarefas, hábitos, projetos e finanças simplesmente falando. É como ter um assistente executivo no seu bolso.",
    },
    {
      question: "Preciso pagar algo?",
      answer: "Não! O Aurum tem um plano Free permanente e gratuito. Você tem acesso a todas as funcionalidades básicas sem pagar nada. Os planos pagos desbloqueiam limites maiores e recursos avançados.",
    },
    {
      question: "Meus dados são seguros?",
      answer: "Sim, seus dados são protegidos com criptografia de ponta a ponta. Nunca vendemos dados de usuários. Você tem controle total sobre suas informações e pode exportar tudo a qualquer momento.",
    },
    {
      question: "Como funciona o reconhecimento de voz?",
      answer: "Usamos tecnologia de ponta em processamento de linguagem natural. Você fala naturalmente e o Aurum compreende o contexto, intenção e até mesmo corrige pequenos erros. Funciona em português e em vários outros idiomas.",
    },
    {
      question: "Posso usar em múltiplos dispositivos?",
      answer: "Sim! Sua conta sincroniza automaticamente em todos seus dispositivos - celular, tablet e desktop. Tudo sempre atualizado em tempo real.",
    },
    {
      question: "Há uma versão para equipes?",
      answer: "Sim! O plano Teams foi desenvolvido especialmente para empresas. Suporta até 50 membros, SSO, auditorias e muito mais. Perfeito para times que precisam colaborar.",
    },
  ];

  const features = [
    {
      icon: "🎙️",
      title: "Conversa por Voz",
      description: "Fale naturalmente com IA avançada",
    },
    {
      icon: "✅",
      title: "Tarefas Inteligentes",
      description: "Organize com prioridades e lembretes",
    },
    {
      icon: "📊",
      title: "Dashboard Pessoal",
      description: "Visão completa da sua vida",
    },
    {
      icon: "💰",
      title: "Controle Financeiro",
      description: "Receitas, despesas e análises",
    },
    {
      icon: "🎯",
      title: "Hábitos & Metas",
      description: "Rastreie streaks e progresso",
    },
    {
      icon: "🔮",
      title: "Vision Board",
      description: "Visualize seus objetivos",
    },
  ];

  const stats = [
    { label: "50K+", description: "Mensagens Processadas" },
    { label: "10K+", description: "Tarefas Criadas" },
    { label: "99.9%", description: "Uptime Garantido" },
  ];

  const steps = [
    {
      number: 1,
      title: "Crie sua conta grátis",
      description: "Cadastro simples em menos de 2 minutos",
    },
    {
      number: 2,
      title: "Fale ou digite seus comandos",
      description: "Use voz natural para organizar tudo",
    },
    {
      number: 3,
      title: "Aurum organiza tudo para você",
      description: "IA trabalha 24/7 mantendo você produtivo",
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050810] text-white overflow-hidden">
      {/* Animated background */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 217, 255, 0.6);
          }
        }

        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .glow-button {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffd700 0%, #00d9ff 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glass-card-hover {
          transition: all 0.3s ease;
        }

        .glass-card-hover:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 217, 255, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 217, 255, 0.1);
        }

        .feature-icon {
          font-size: 3rem;
          animation: float 3s ease-in-out infinite;
        }

        .gradient-bg {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%);
        }

        .pricing-card-popular {
          border-color: #00d9ff;
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.2);
        }
      `}
      </style>

      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section id="hero" className="min-h-screen flex items-center justify-center pt-20 pb-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight gradient-text animate-slide-up">
              AURUM
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Seu assistente pessoal com inteligência artificial e voz
            </p>

            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Organize tarefas, hábitos, projetos e finanças com comandos de voz. Gratuito para sempre.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg transition-all duration-300 glow-button text-lg"
              >
                Começar Grátis
              </button>
              <button
                onClick={onViewPricing}
                className="px-8 py-4 glass-card text-white font-bold rounded-lg transition-all duration-300 hover:bg-white/10 border border-white/20 text-lg"
              >
                Ver Planos
              </button>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <p className="text-white/40 mb-4">Você sempre terá acesso grátis ao plano Free</p>
              <div className="flex justify-center">
                <ChevronDown className="w-8 h-8 text-cyan-400 animate-bounce" />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" data-animate className="py-24 px-4 md:px-8 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-center mb-4 text-white">
              Recursos Poderosos
            </h2>
            <p className="text-center text-white/60 text-lg mb-16 max-w-2xl mx-auto">
              Tudo que você precisa para organizar sua vida, em um único lugar
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="glass-card glass-card-hover p-8 rounded-xl group"
                  style={{
                    animation: isVisible["features"] ? `slide-up 0.6s ease-out forwards` : "none",
                    animationDelay: `${idx * 0.1}s`,
                  }}
                >
                  <div className="text-5xl mb-4 feature-icon">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / STATS SECTION */}
        <section id="stats" data-animate className="py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-white">
              Mais de 50 mil pessoas já usam o Aurum
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="glass-card p-8 rounded-xl"
                  style={{
                    animation: isVisible["stats"] ? `slide-up 0.6s ease-out forwards` : "none",
                    animationDelay: `${idx * 0.1}s`,
                  }}
                >
                  <p className="text-4xl md:text-5xl font-black text-cyan-400 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-white/70">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" data-animate className="py-24 px-4 md:px-8 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-center mb-4 text-white">
              Como Funciona
            </h2>
            <p className="text-center text-white/60 text-lg mb-16">
              Comece em 3 passos simples
            </p>

            <div className="grid md:grid-cols-3 gap-8 md:gap-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center"
                  style={{
                    animation: isVisible["how-it-works"] ? `slide-up 0.6s ease-out forwards` : "none",
                    animationDelay: `${idx * 0.15}s`,
                  }}
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-2xl font-black">
                      {step.number}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 w-8 h-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                  <p className="text-white/60">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" data-animate className="py-24 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-center mb-4 text-white">
              Planos para Todos
            </h2>
            <p className="text-center text-white/60 text-lg mb-12">
              Escolha o plano perfeito para suas necessidades
            </p>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12">
              <div className="glass-card p-2 rounded-lg flex gap-2 w-fit">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-cyan-500 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    billingPeriod === "yearly"
                      ? "bg-cyan-500 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Anual (Save 33%)
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {Object.values(PLANS).map((plan, idx) => {
                const price =
                  billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
                return (
                  <div
                    key={plan.id}
                    className={`glass-card glass-card-hover p-8 rounded-xl flex flex-col ${
                      plan.popular ? "pricing-card-popular relative border-2" : "border border-white/10"
                    }`}
                    style={{
                      animation: isVisible["pricing"] ? `slide-up 0.6s ease-out forwards` : "none",
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1 rounded-full text-sm font-bold text-white whitespace-nowrap">
                        Mais Popular
                      </div>
                    )}

                    <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                    <p className="text-white/60 text-sm mb-6">{plan.description}</p>

                    <div className="mb-6">
                      {plan.priceMonthly === 0 ? (
                        <p className="text-4xl font-black text-cyan-400">Grátis</p>
                      ) : (
                        <>
                          <p className="text-4xl font-black text-cyan-400">
                            {formatPrice(price)}
                          </p>
                          <p className="text-white/60 text-sm">
                            por mês {billingPeriod === "yearly" && "(anual)"}
                          </p>
                        </>
                      )}
                    </div>

                    <button
                      onClick={onGetStarted}
                      className={`w-full py-3 rounded-lg font-bold transition-all mb-6 ${
                        plan.popular
                          ? "bg-cyan-500 hover:bg-cyan-400 text-white"
                          : "glass-card hover:bg-white/10 text-white border border-white/20"
                      }`}
                    >
                      Começar
                    </button>

                    <div className="space-y-4 flex-1">
                      {plan.highlights.map((highlight, hIdx) => (
                        <div key={hIdx} className="flex gap-3 items-start">
                          <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/80 text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" data-animate className="py-24 px-4 md:px-8 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-center mb-4 text-white">
              Perguntas Frequentes
            </h2>
            <p className="text-center text-white/60 text-lg mb-12">
              Tem dúvidas? Aqui estão as respostas mais comuns
            </p>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-xl overflow-hidden"
                  style={{
                    animation: isVisible["faq"] ? `slide-up 0.6s ease-out forwards` : "none",
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                  >
                    <h3 className="text-lg font-bold text-white">{faq.question}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-400 transition-transform flex-shrink-0 ${
                        expandedFAQ === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedFAQ === idx && (
                    <div className="px-6 pb-6 text-white/70 border-t border-white/10 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section id="cta" data-animate className="py-24 px-4 md:px-8">
          <div className="max-w-2xl mx-auto glass-card rounded-2xl p-12 text-center border-2 border-cyan-500/50">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
              Pronto para organizar sua vida?
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Junte-se a milhares de usuários que transformaram sua produtividade com o Aurum
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg transition-all duration-300 glow-button text-lg"
            >
              Começar Grátis Agora
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 py-12 px-4 md:px-8 mt-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div>
                <h3 className="text-2xl font-black gradient-text mb-2">Aurum</h3>
                <p className="text-white/60 text-sm">
                  Seu assistente pessoal com IA e voz
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-bold mb-4 text-white">Produto</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li><button className="hover:text-cyan-400 transition">Recursos</button></li>
                  <li><button className="hover:text-cyan-400 transition">Preços</button></li>
                  <li><button className="hover:text-cyan-400 transition">Blog</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-white">Legal</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li><button className="hover:text-cyan-400 transition">Termos</button></li>
                  <li><button className="hover:text-cyan-400 transition">Privacidade</button></li>
                  <li><button className="hover:text-cyan-400 transition">Contato</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-white">Suporte</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li><button className="hover:text-cyan-400 transition">Ajuda</button></li>
                  <li><button className="hover:text-cyan-400 transition">Status</button></li>
                  <li><button className="hover:text-cyan-400 transition">Comunidade</button></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/40 text-sm">
                  Feito com ❤️ por Sestari Digital
                </p>
                <div className="flex gap-6">
                  <button className="text-white/40 hover:text-cyan-400 transition text-sm">
                    Twitter
                  </button>
                  <button className="text-white/40 hover:text-cyan-400 transition text-sm">
                    LinkedIn
                  </button>
                  <button className="text-white/40 hover:text-cyan-400 transition text-sm">
                    GitHub
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}