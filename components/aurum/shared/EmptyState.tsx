"use client";

import { type ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-4xl opacity-30">{icon}</div>
      <div className="text-sm text-white/50">{title}</div>
      {subtitle && <div className="text-xs text-white/30">{subtitle}</div>}
    </div>
  );
}
