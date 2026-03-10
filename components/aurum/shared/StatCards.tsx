"use client";

import { type ReactNode } from "react";

export interface StatCard {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string; // border-left color
}

interface Props {
  cards: StatCard[];
}

export default function StatCards({ cards }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group relative flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 transition-all duration-300 hover:scale-105 hover:border-white/15 cursor-default"
            style={{
              borderLeftColor: card.color ?? "rgba(255,255,255,0.08)",
              borderLeftWidth: 2,
            }}
          >
            {/* Subtle glow on hover */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${card.color ?? "rgba(139, 92, 246, 0.1)"} 0%, transparent 70%)`,
              }}
            />

            <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-sm transition-colors duration-300 group-hover:bg-white/12">
              {card.icon}
            </div>

            <div className="relative z-10">
              {/* Value with sparkle effect */}
              <div
                className="text-xl font-bold transition-colors duration-300 group-hover:text-white/95"
                style={{
                  backgroundImage: `linear-gradient(135deg, currentColor 0%, currentColor 70%, ${card.color ?? "rgba(139, 92, 246, 0.4)"} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                }}
              >
                {card.value}
              </div>
              <div className="text-xs text-white/50 transition-colors duration-300 group-hover:text-white/60">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
