"use client";

import { useState } from "react";
import { PLANS, type PlanTier } from "@/lib/aurum-plans";
import { useCheckout } from "@/lib/use-checkout";

interface Props {
  currentPlan: PlanTier;
  userId?: string;
  userEmail?: string;
  stripeCustomerId?: string | null;
  onBack: () => void;
}

export default function PricingPage({
  currentPlan,
  userId,
  userEmail,
  stripeCustomerId,
  onBack,
}: Props) {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const { startCheckout, openPortal, loading: checkoutLoading, error: checkoutError } = useCheckout();

  const faqItems = [
    { id: "trial", question: "Posso experimentar antes de pagar?", answer: "Sim! O plano Free é totalmente funcional e gratuito indefinidamente. Não é necessário cartão de crédito para começar." },
    { id: "cancel", question: "Posso cancelar a qualquer momento?", answer: "Claro. Você pode cancelar a qualquer momento sem penalidades. Seu acesso continuará até o final do período." },
    { id: "upgrade", question: "Como mudo de plano?", answer: "Selecione o plano desejado e complete o checkout. A mudança é imediata e o valor é creditado proporcionalmente." },
    { id: "teams", question: "Preciso de uma solução para equipe?", answer: "Entre em contato para uma solução personalizada com SSO, white-label e muito mais." },
    { id: "invoice", question: "Recebo nota fiscal?", answer: "Sim. Todos os planos pagos incluem recibo por email. Para NF corporativa, entre em contato." },
    { id: "api", question: "Qual plano inclui API?", answer: "O plano Max inclui acesso completo à API do Aurum." },
  ];

  const planOrder: PlanTier[] = ["free", "starter", "pro", "max"];

  const getPrice = (planId: PlanTier) => {
    const plan = PLANS[planId];
    return billingMode === "monthly" ? plan.priceMonthly : plan.priceYearly;
  };

  const getSavings = () => {
    const m = PLANS["pro"].priceMonthly * 12;
    const y = PLANS["pro"].priceYearly * 12;
    return Math.round(((m - y) / m) * 100);
  };

  const handleSelectPlan = async (planId: PlanTier) => {
    if (planId === currentPlan) return;

    // Free plan — just go back
    if (planId === "free") {
      onBack();
      return;
    }

    // If user not logged in, can't checkout
    if (!userId) {
      alert("Faça login para assinar um plano.");
      return;
    }

    // Start Stripe checkout
    await startCheckout({
      userId,
      email: userEmail,
      planTier: planId,
      billingPeriod: billingMode,
    });
  };

  const handleManageSubscription = async () => {
    if (stripeCustomerId) {
      await openPortal(stripeCustomerId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0A09] via-[#0a0d15] to-[#0C0A09] relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out forwards; }
        .glass-card {
          background: rgba(7, 10, 15, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 255, 0.15);
        }
        .glass-card-popular {
          background: rgba(7, 10, 15, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
        }
        .glass-card-popular::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-orange-500/[0.06] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-20 pt-8 px-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        {/* Title */}
        <div className="text-center mb-14 animate-fadeInUp">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Planos <span className="bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">Aurum</span>
          </h1>
          <p className="text-lg text-white/50 mb-8">
            Escolha o plano ideal para o seu uso
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/10">
              <button
                onClick={() => setBillingMode("monthly")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  billingMode === "monthly"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingMode("yearly")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  billingMode === "yearly"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Anual
                <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-bold">
                  -{getSavings()}%
                </span>
              </button>
            </div>
          </div>

          {/* Manage subscription link */}
          {stripeCustomerId && (
            <button
              onClick={handleManageSubscription}
              disabled={checkoutLoading}
              className="text-sm text-amber-400/70 hover:text-amber-400 transition underline underline-offset-4"
            >
              Gerenciar assinatura existente
            </button>
          )}
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm text-center animate-fadeInUp">
            {checkoutError}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {planOrder.map((planId, idx) => {
            const plan = PLANS[planId];
            const price = getPrice(planId);
            const isPopular = plan.popular;
            const isCurrent = currentPlan === planId;

            return (
              <div
                key={planId}
                className={`animate-fadeInUp ${isPopular ? "glass-card-popular lg:scale-105" : "glass-card"} rounded-2xl p-7 relative transition-all hover:border-amber-400/30 ${
                  isPopular ? "lg:shadow-xl lg:shadow-amber-500/10" : ""
                }`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Mais Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3.5 right-4 px-3 py-1 bg-emerald-500/90 text-white text-xs font-semibold rounded-full">
                    Atual
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-white/40">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-white">
                      {price === 0 ? "Gratis" : `R$${price.toFixed(2).replace(".", ",")}`}
                    </span>
                    {price > 0 && <span className="text-sm text-white/30">/mes</span>}
                  </div>
                  {billingMode === "yearly" && price > 0 && (
                    <p className="text-[11px] text-emerald-400/80 mt-1">
                      R${(price * 12).toFixed(2).replace(".", ",")} cobrado anualmente
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isCurrent || checkoutLoading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-6 ${
                    isCurrent
                      ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                      : isPopular
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20"
                      : "bg-white/[0.08] border border-white/15 text-white hover:bg-white/15"
                  }`}
                >
                  {checkoutLoading
                    ? "Redirecionando..."
                    : isCurrent
                    ? "Plano atual"
                    : planId === "free"
                    ? "Comecar Gratis"
                    : `Assinar ${plan.name}`}
                </button>

                {/* Highlights */}
                <div className="space-y-2.5 pt-5 border-t border-white/[0.06]">
                  {plan.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-white/50 leading-relaxed">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mb-20 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Comparar Planos</h2>
          <div className="glass-card rounded-2xl p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 font-semibold text-xs">Recurso</th>
                  {planOrder.map((planId) => (
                    <th key={planId} className={`text-center py-3 px-4 font-semibold text-xs ${currentPlan === planId ? "text-amber-400" : "text-white/50"}`}>
                      {PLANS[planId].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Mensagens IA/mes", get: (p: PlanTier) => PLANS[p].limits.aiMessagesPerMonth === -1 ? "Ilimitado" : PLANS[p].limits.aiMessagesPerMonth },
                  { label: "Voz/mes (min)", get: (p: PlanTier) => PLANS[p].limits.voiceMinutesPerMonth === -1 ? "Ilimitado" : PLANS[p].limits.voiceMinutesPerMonth },
                  { label: "Armazenamento", get: (p: PlanTier) => `${PLANS[p].limits.storageGB} GB` },
                  { label: "Modo continuo", get: (p: PlanTier) => PLANS[p].features.continuousMode },
                  { label: "Voz ElevenLabs", get: (p: PlanTier) => PLANS[p].features.elevenlabsVoice },
                  { label: "Vozes custom", get: (p: PlanTier) => PLANS[p].features.customVoices },
                  { label: "IA Visao", get: (p: PlanTier) => PLANS[p].features.visionAI },
                  { label: "Kanban", get: (p: PlanTier) => PLANS[p].features.kanbanBoard },
                  { label: "Financas", get: (p: PlanTier) => PLANS[p].features.financeAnalysis },
                  { label: "Analytics", get: (p: PlanTier) => PLANS[p].features.advancedAnalytics },
                  { label: "Automacoes n8n", get: (p: PlanTier) => PLANS[p].features.n8nAutomations },
                  { label: "Acesso API", get: (p: PlanTier) => PLANS[p].features.apiAccess },
                  { label: "Suporte prioritario", get: (p: PlanTier) => PLANS[p].features.prioritySupport },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white/40 text-xs">{row.label}</td>
                    {planOrder.map((planId) => {
                      const val = row.get(planId);
                      return (
                        <td key={planId} className="py-3 px-4 text-center text-xs">
                          {typeof val === "boolean" ? (
                            val ? (
                              <svg className="w-4 h-4 text-amber-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-white/15">—</span>
                            )
                          ) : (
                            <span className="text-white/50">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise */}
        <div className="mb-20 animate-fadeInUp" style={{ animationDelay: "450ms" }}>
          <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-3">Precisa de algo maior?</h2>
            <p className="text-sm text-white/40 mb-6">
              Solucoes empresariais com SSO, white-label, integracao customizada e suporte dedicado.
            </p>
            <a
              href="mailto:luizsestari2004@gmail.com?subject=Aurum%20Enterprise"
              className="inline-block px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all text-sm"
            >
              Falar com Vendas
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16 animate-fadeInUp" style={{ animationDelay: "500ms" }}>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
          <div className="max-w-xl mx-auto space-y-3">
            {faqItems.map((item) => (
              <div key={item.id} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-medium text-sm text-white">{item.question}</span>
                  <svg
                    className={`w-4 h-4 text-amber-400/60 transition-transform ${expandedFaq === item.id ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {expandedFaq === item.id && (
                  <div className="px-5 py-4 bg-white/[0.02] border-t border-white/[0.06] text-white/40 text-sm animate-slideInLeft">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
