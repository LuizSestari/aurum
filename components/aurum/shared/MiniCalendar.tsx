"use client";

import { useState, useMemo } from "react";

interface Props {
  accentColor?: string;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function MiniCalendar({ accentColor = "#3b82f6" }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const isToday = (d: number | null) =>
    d !== null &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">📅</span>
          <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prev} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10">&lt;</button>
          <button onClick={goToday} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">Hoje</button>
          <button onClick={next} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/40">
        {DAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) => (
          <div
            key={i}
            className={[
              "flex h-10 items-center justify-center rounded-lg text-xs",
              d === null ? "" : "cursor-pointer hover:bg-white/5",
              isToday(d) ? "font-bold" : "text-white/70",
            ].join(" ")}
            style={isToday(d) ? {
              border: `1px solid ${accentColor}`,
              background: `${accentColor}15`,
              color: accentColor,
            } : {}}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
