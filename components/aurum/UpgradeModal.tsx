"use client";

import { useState, useEffect } from "react";
import type { PlanTier } from "@/lib/aurum-plans";
import { PLANS, formatPrice } from "@/lib/aurum-plans";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: PlanTier;
  onUpgrade: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  requiredPlan,
  onUpgrade,
}: UpgradeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const planDef = PLANS[requiredPlan];
  const monthlyPrice = planDef.priceMonthly;
  const yearlyPrice = planDef.priceYearly;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Select 2-3 relevant benefits based on plan
  const benefits = planDef.highlights.slice(0, 3);

  // Plan-specific gradient and colors
  const gradientMap: Record<PlanTier, string> = {
    free: "from-slate-600 to-slate-700",
    starter: "from-amber-500 to-orange-500",
    pro: "from-cyan-500 to-blue-500",
    max: "from-purple-500 to-pink-500",
    dev: "from-emerald-500 to-teal-500",
  };

  const accentMap: Record<PlanTier, string> = {
    free: "cyan",
    starter: "amber",
    pro: "cyan",
    max: "pink",
    dev: "emerald",
  };

  const gradient = gradientMap[requiredPlan];
  const accent = accentMap[requiredPlan];

  return (
    <>
      <style>{`
        @keyframes modalScale {
          from {
            transform: scale(0.9) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes backdropFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }

        .upgrade-modal-backdrop {
          animation: backdropFadeIn 0.3s ease-out forwards;
        }

        .upgrade-modal-content {
          animation: modalScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 217, 255, 0.6);
          }
        }

        .glow-button {
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes slideInBenefit {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .benefit-item {
          animation: slideInBenefit 0.5s ease-out forwards;
        }

        .benefit-item:nth-child(1) { animation-delay: 0.1s; }
        .benefit-item:nth-child(2) { animation-delay: 0.2s; }
        .benefit-item:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      {/* Backdrop */}
      {isVisible && (
        <div
          className={`upgrade-modal-backdrop fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleClose}
          style={{
            backdropFilter: isVisible ? "blur(4px)" : "blur(0px)",
          }}
        />
      )}

      {/* Modal */}
      <div
        className={`upgrade-modal-content fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Glassmorphism Container */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#070A0F]/80 via-[#050810]/60 to-[#070A0F]/80 p-8 shadow-2xl">
          {/* Decorative gradient background */}
          <div className="absolute -inset-0.5 opacity-20 blur-xl">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
              style={{ opacity: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="relative space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Desbloqueie {feature}
              </h2>
              <p className="text-sm text-slate-300">
                Esta funcionalidade está disponível no plano{" "}
                <span className="font-semibold text-[#00d9ff]">{planDef.name}</span>
              </p>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3 rounded-lg bg-white/5 p-4 border border-white/10">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-300">Plano {planDef.name}</span>
                <span className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {formatPrice(monthlyPrice)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ou {formatPrice(yearlyPrice)}/mês cobrado anualmente
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Por que fazer upgrade
              </p>
              <div className="space-y-2">
                {benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="benefit-item flex items-start gap-2 text-sm text-slate-200"
                  >
                    <div className={`mt-0.5 h-1.5 w-1.5 rounded-full bg-[#00d9ff] flex-shrink-0`} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 border border-white/10"
              >
                Agora não
              </button>
              <button
                onClick={() => {
                  onUpgrade();
                  handleClose();
                }}
                className={`glow-button flex-1 rounded-lg bg-gradient-to-r ${gradient} px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95`}
              >
                Começar teste grátis
              </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-xs text-slate-500">
              7 dias grátis. Cancele quando quiser.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
