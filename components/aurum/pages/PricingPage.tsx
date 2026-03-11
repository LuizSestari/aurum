"use client";

import { useState } from "react";
import { PLANS, formatPrice, type PlanTier } from "@/lib/aurum-plans";

interface Props {
  currentPlan: PlanTier;
  onSelectPlan: (plan: string) => void;
  onBack: () => void;
}

export default function PricingPage({ currentPlan, onSelectPlan, onBack }: Props) {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqItems = [
    {
      id: "trial",
      question: "Posso experimentar antes de pagar?",
      answer: "Sim! O plano Free é totalmente funcional e gratuito indefinidamente. Não é necessário cartão de crédito para começar.",
    },
    {
      id: "cancel",
      question: "Posso cancelar minha assinatura a qualquer momento?",
      answer: "Claro. Você pode cancelar sua assinatura a qualquer momento sem penalidades. Seu acesso continuará até o final do período de cobrança.",
    },
    {
      id: "upgrade",
      question: "Como faço para atualizar meu plano?",
      answer: "Você pode atualizar seu plano a qualquer momento nas configurações de conta. A diferença será creditada proporcionalmente.",
    },
    {
      id: "teams",
      question: "Preciso de mais usuários ou características personalizadas?",
      answer: "Contate nossa equipe de vendas para uma solução personalizada. Oferecemos SSO, white-label e muito mais para empresas.",
    },
    {
      id: "invoice",
      question: "Posso receber uma fatura mensal?",
      answer: "Sim. Todos os planos pagos incluem faturas por email. Entre em contato conosco para arranjos de pagamento corporativos.",
    },
    {
      id: "api",
      question: "Qual plano inclui acesso à API?",
      answer: "O plano Max inclui acesso completo à API. Para necessidades corporativas, entre em contato com nosso time de vendas.",
    },
  ];

  const comparisonFeatures = [
    { label: "Mensagens IA por mês", key: "aiMessagesPerMonth" },
    { label: "Minutos de voz por mês", key: "voiceMinutesPerMonth" },
    { label: "Armazenamento", key: "storageGB" },
    { label: "Conversa em modo contínuo", key: "continuousMode" },
    { label: "Voz ElevenLabs realista", key: "elevenlabsVoice" },
    { label: "Vozes personalizadas", key: "customVoices" },
    { label: "Múltiplos modelos IA", key: "aiModels" },
    { label: "IA Multimodal (Visão)", key: "visionAI" },
    { label: "Kanban inteligente", key: "kanbanBoard" },
    { label: "Análise financeira", key: "financeAnalysis" },
    { label: "Análise avançada", key: "advancedAnalytics" },
    { label: "Automações n8n", key: "n8nAutomations" },
    { label: "Acesso à API", key: "apiAccess" },
    { label: "Exportação de dados", key: "dataExport" },
    { label: "Suporte prioritário", key: "prioritySupport" },
    { label: "SSO / SAML", key: "sso" },
    { label: "Logs de auditoria", key: "auditLogs" },
    { label: "Branding personalizado", key: "customBranding" },
    { label: "Gerente de conta dedicado", key: "dedicatedAccount" },
  ];

  const planOrder: PlanTier[] = ["free", "starter", "pro", "max"];

  const getPrice = (planId: PlanTier) => {
    const plan = PLANS[planId];
    const price = billingMode === "monthly" ? plan.priceMonthly : plan.priceYearly;
    return price;
  };

  const getSavings = () => {
    const monthlyPrice = PLANS["pro"].priceMonthly * 12;
    const yearlyPrice = PLANS["pro"].priceYearly * 12;
    return Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070A0F] via-[#0a0d15] to-[#070A0F] relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.6);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .glass-effect {
          background: rgba(7, 10, 15, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 255, 0.2);
        }

        .glass-effect-popular {
          background: rgba(7, 10, 15, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid;
          border-image: linear-gradient(135deg, #00ffff, #6432ff) 1;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00ffff, #6432ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Background orbs */}
      <div className="glow-orb" style={{ width: "500px", height: "500px", top: "-150px", right: "-150px", background: "rgba(0, 255, 255, 0.2)" }} />
      <div className="glow-orb" style={{ width: "400px", height: "400px", bottom: "-100px", left: "-100px", background: "rgba(100, 50, 255, 0.2)" }} />

      {/* Header with back button */}
      <div className="relative z-20 pt-8 px-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-cyan-300 transition-colors mb-12"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-16 animate-fadeInUp">
          <h1 className="text-5xl font-bold text-white mb-4">
            Planos Aurum
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Escolha o plano perfeito para suas necessidades
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex gap-2 p-1 bg-black/20 rounded-lg border border-cyan-400/20">
              <button
                onClick={() => setBillingMode("monthly")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingMode === "monthly"
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingMode("yearly")}
                className={`px-6 py-2 rounded-md font-medium transition-all relative ${
                  billingMode === "yearly"
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Anual
                {billingMode === "yearly" && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/80 text-white text-xs rounded-full font-semibold">
                    Economize {getSavings()}%
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {planOrder.map((planId, idx) => {
            const plan = PLANS[planId];
            const price = getPrice(planId);
            const isPopular = plan.popular;
            const isCurrent = currentPlan === planId;

            return (
              <div
                key={planId}
                className={`animate-fadeInUp ${isPopular ? "glass-effect-popular lg:scale-105" : "glass-effect"} rounded-2xl p-8 relative transition-all hover:border-cyan-400 ${
                  isPopular ? "lg:shadow-2xl lg:shadow-cyan-500/30" : ""
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                    Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500/80 text-white text-xs font-semibold rounded-full">
                    Atual
                  </div>
                )}

                {/* Plan Name and Description */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {price === 0 ? "Grátis" : `R$ ${price.toFixed(2).replace(".", ",")}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-400">/mês</span>
                    )}
                  </div>
                  {billingMode === "yearly" && price > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      R$ {(price * 12).toFixed(2).replace(".", ",")} por ano
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(planId)}
                  disabled={isCurrent}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-6 ${
                    isCurrent
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : isPopular
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/50"
                      : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  {isCurrent ? "Seu plano atual" : planId === "free" ? "Começar Grátis" : `Assinar ${plan.name}`}
                </button>

                {/* Highlights */}
                <div className="space-y-3 pt-6 border-t border-white/10">
                  {plan.highlights.slice(0, 5).map((highlight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-300">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mb-20 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Comparar Planos</h2>
          <div className="glass-effect rounded-2xl p-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Recurso</th>
                  {planOrder.map((planId) => (
                    <th key={planId} className="text-center py-4 px-4 text-gray-300 font-semibold">
                      {PLANS[planId].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-gray-300">{feature.label}</td>
                    {planOrder.map((planId) => {
                      const plan = PLANS[planId];
                      const value = (plan as any)[feature.key === "aiModels" ? "features" : feature.key === "continuousMode" || feature.key === "elevenlabsVoice" || feature.key === "customVoices" || feature.key === "visionAI" || feature.key === "kanbanBoard" || feature.key === "financeAnalysis" || feature.key === "advancedAnalytics" || feature.key === "n8nAutomations" || feature.key === "apiAccess" || feature.key === "dataExport" || feature.key === "prioritySupport" || feature.key === "sso" || feature.key === "auditLogs" || feature.key === "customBranding" || feature.key === "dedicatedAccount" ? "features" : "limits"];

                      let displayValue: React.ReactNode = "-";

                      if (feature.key === "aiModels") {
                        displayValue = plan.features.aiModels.length > 2 ? `${plan.features.aiModels.length}+ modelos` : plan.features.aiModels.join(", ");
                      } else if (feature.key === "storageGB") {
                        displayValue = `${plan.limits.storageGB} GB`;
                      } else if (feature.key === "aiMessagesPerMonth") {
                        displayValue = plan.limits.aiMessagesPerMonth === -1 ? "Ilimitado" : plan.limits.aiMessagesPerMonth;
                      } else if (feature.key === "voiceMinutesPerMonth") {
                        displayValue = plan.limits.voiceMinutesPerMonth === -1 ? "Ilimitado" : plan.limits.voiceMinutesPerMonth;
                      } else if (
                        feature.key === "continuousMode" ||
                        feature.key === "elevenlabsVoice" ||
                        feature.key === "customVoices" ||
                        feature.key === "visionAI" ||
                        feature.key === "kanbanBoard" ||
                        feature.key === "financeAnalysis" ||
                        feature.key === "advancedAnalytics" ||
                        feature.key === "n8nAutomations" ||
                        feature.key === "apiAccess" ||
                        feature.key === "dataExport" ||
                        feature.key === "prioritySupport" ||
                        feature.key === "sso" ||
                        feature.key === "auditLogs" ||
                        feature.key === "customBranding" ||
                        feature.key === "dedicatedAccount"
                      ) {
                        const featureKey = feature.key as keyof typeof plan.features;
                        displayValue = plan.features[featureKey] ? (
                          <svg className="w-5 h-5 text-cyan-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        );
                      }

                      return (
                        <td key={planId} className="py-4 px-4 text-center text-gray-400">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="mb-20 animate-fadeInUp" style={{ animationDelay: "450ms" }}>
          <div className="glass-effect rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Precisa de algo maior?</h2>
            <p className="text-gray-300 mb-8">
              Oferecemos soluções empresariais personalizadas com suporte dedicado, integração customizada, white-label, e muito mais. Entre em contato com nossa equipe.
            </p>
            <a
              href="mailto:luizsestari2004@gmail.com?subject=Aurum%20Enterprise"
              className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/50"
            >
              Contatar Vendas
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20 animate-fadeInUp" style={{ animationDelay: "500ms" }}>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="glass-effect rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-cyan-400 transition-transform ${
                      expandedFaq === item.id ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {expandedFaq === item.id && (
                  <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-gray-300 animate-slideInLeft">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mb-12 animate-fadeInUp" style={{ animationDelay: "550ms" }}>
          <p className="text-gray-300 mb-6">
            Comece grátis hoje. Nenhum cartão de crédito necessário.
          </p>
          <button
            onClick={() => onSelectPlan("free")}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/50"
          >
            Começar Grátis
          </button>
        </div>
      </div>
    </div>
  );
}
