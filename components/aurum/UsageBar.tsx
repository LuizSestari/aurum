"use client";

import { useEffect, useState } from "react";

interface UsageBarProps {
  current: number;
  limit: number;
  label: string;
  color?: string;
}

export function UsageBar({
  current,
  limit,
  label,
  color,
}: UsageBarProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);

  // Determine color based on percentage
  let barColor = color;
  if (!barColor) {
    if (isUnlimited) {
      barColor = "from-amber-500 to-blue-500";
    } else if (percentage >= 85) {
      barColor = "from-red-500 to-rose-500";
    } else if (percentage >= 60) {
      barColor = "from-amber-500 to-orange-500";
    } else {
      barColor = "from-emerald-500 to-teal-500";
    }
  }

  // Determine if we need pulse animation
  const isPulsing = percentage >= 90 && percentage < 100;

  // Animate bar fill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <>
      <style>{`
        @keyframes barFill {
          from {
            width: 0;
          }
          to {
            width: var(--fill-percentage);
          }
        }

        @keyframes pulsing {
          0%, 100% {
            filter: brightness(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            filter: brightness(1.2);
            box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.3);
          }
        }

        .usage-bar-fill {
          animation: barFill 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .usage-bar-fill.pulsing {
          animation: barFill 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                    pulsing 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="space-y-1.5">
        {/* Label */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-300">{label}</span>
          <span className="text-slate-400">
            {isUnlimited ? (
              <span className="flex items-center gap-1">
                <span className="text-base">∞</span>
                <span>Ilimitado</span>
              </span>
            ) : (
              <span>
                <span className="text-white font-semibold">{current}</span>
                <span className="text-slate-500">/{limit}</span>
              </span>
            )}
          </span>
        </div>

        {/* Bar Container */}
        {!isUnlimited && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            {/* Fill */}
            <div
              className={`usage-bar-fill h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-200 ease-out ${
                isPulsing ? "pulsing" : ""
              }`}
              style={{
                "--fill-percentage": `${displayValue}%`,
              } as React.CSSProperties}
            />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />
          </div>
        )}

        {/* Status text for unlimited */}
        {isUnlimited && (
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-500/30 to-blue-500/30 border border-amber-500/30" />
        )}
      </div>
    </>
  );
}
