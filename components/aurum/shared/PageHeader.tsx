"use client";

import { type ReactNode, useState, useEffect } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export default function PageHeader({
  icon,
  iconBg,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 pb-6 pt-8">
      {/* Icon with gradient glow backdrop */}
      <div className="relative">
        {/* Glow background */}
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-40 transition-opacity duration-500"
          style={{
            background: iconBg,
            transform: "scale(1.2)",
          }}
        />

        {/* Icon container */}
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-2xl text-white shadow-lg transition-all duration-500"
          style={{
            background: iconBg,
            animation: mounted ? "fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        >
          {icon}
        </div>
      </div>

      {/* Title with fade-in animation */}
      <h1
        className="text-3xl font-bold tracking-tight transition-all duration-500"
        style={{
          animation: mounted
            ? "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both"
            : "none",
        }}
      >
        {title}
      </h1>

      {/* Subtitle with fade-in animation */}
      <p
        className="text-sm text-white/50 transition-all duration-500"
        style={{
          animation: mounted
            ? "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both"
            : "none",
        }}
      >
        {subtitle}
      </p>

      {/* Tabs with improved design */}
      {tabs && tabs.length > 0 && (
        <div
          className="mt-2 flex items-center gap-1 rounded-xl bg-white/5 p-1 transition-all duration-500"
          style={{
            animation: mounted
              ? "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both"
              : "none",
          }}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-300 outline-none"
              style={{
                color:
                  activeTab === tab.id
                    ? "rgba(255, 255, 255, 1)"
                    : "rgba(255, 255, 255, 0.5)",
              }}
            >
              {/* Pill background for active state */}
              {activeTab === tab.id && (
                <div
                  className="absolute inset-0 rounded-lg bg-white/10 -z-10"
                  style={{
                    animation: "pillIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              )}

              {/* Underline indicator for active state */}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(139, 92, 246, 0.6), rgba(59, 130, 246, 0.4))",
                    animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              )}

              {/* Tab content */}
              <span className="relative transition-all duration-300 hover:opacity-100">
                {tab.icon}
              </span>
              <span className="relative transition-all duration-300 hover:brightness-110">
                {tab.label}
              </span>

              {/* Hover effect */}
              <div
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 hover:opacity-100 -z-10"
                style={{
                  background: activeTab !== tab.id ? "rgba(255, 255, 255, 0.05)" : "transparent",
                }}
              />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pillIn {
          from {
            opacity: 0;
            transform: scaleX(0.8);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes slideIn {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
