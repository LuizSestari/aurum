"use client";

import type { PlanTier } from "@/lib/aurum-plans";
import { PLANS } from "@/lib/aurum-plans";

interface PlanBadgeProps {
  plan: PlanTier;
  size?: "sm" | "md";
  glow?: boolean;
}

export function PlanBadge({
  plan,
  size = "md",
  glow = false,
}: PlanBadgeProps) {
  const planDef = PLANS[plan];

  // Plan-specific gradients
  const gradientMap: Record<PlanTier, string> = {
    free: "from-slate-600 to-slate-700",
    starter: "from-amber-500 to-orange-500",
    pro: "from-cyan-500 to-blue-500",
    max: "from-purple-500 to-pink-500",
    dev: "from-emerald-500 to-teal-500",
  };

  // Text color map
  const textColorMap: Record<PlanTier, string> = {
    free: "text-slate-200",
    starter: "text-amber-100",
    pro: "text-cyan-100",
    max: "text-purple-100",
    dev: "text-emerald-100",
  };

  // Border color map
  const borderColorMap: Record<PlanTier, string> = {
    free: "border-slate-500/30",
    starter: "border-amber-500/30",
    pro: "border-cyan-500/30",
    max: "border-purple-500/30",
    dev: "border-emerald-500/30",
  };

  // Shadow map for glow
  const shadowMap: Record<PlanTier, string> = {
    free: "shadow-slate-700/50",
    starter: "shadow-amber-500/50",
    pro: "shadow-cyan-500/50",
    max: "shadow-purple-500/50",
    dev: "shadow-emerald-500/50",
  };

  const gradient = gradientMap[plan];
  const textColor = textColorMap[plan];
  const borderColor = borderColorMap[plan];
  const shadowColor = shadowMap[plan];

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-xs font-semibold"
      : "px-3 py-1.5 text-sm font-semibold";

  return (
    <>
      <style>{`
        @keyframes badgeGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(0, 217, 255, 0.4), inset 0 0 8px rgba(0, 217, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 16px rgba(0, 217, 255, 0.6), inset 0 0 12px rgba(0, 217, 255, 0.2);
          }
        }

        .plan-badge-glow {
          animation: badgeGlow 2s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`inline-flex items-center rounded-lg bg-gradient-to-r ${gradient} border ${borderColor} ${sizeClasses} ${textColor} ${
          glow ? "plan-badge-glow" : ""
        } ${glow ? shadowColor : ""}`}
      >
        {planDef.name.toUpperCase()}
      </div>
    </>
  );
}
