"use client";

import { useState, useEffect, useCallback } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
}

const CATEGORIES = [
  { id: "destaques", label: "Destaques", icon: "🔥" },
  { id: "politica", label: "Política", icon: "🏛️" },
  { id: "economia", label: "Economia", icon: "📈" },
  { id: "tecnologia", label: "Tecnologia", icon: "💻" },
  { id: "mundo", label: "Mundo", icon: "🌍" },
  { id: "esportes", label: "Esportes", icon: "⚽" },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    destaques: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    politica: "bg-red-500/20 text-red-400 border-red-500/30",
    economia: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    tecnologia: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    mundo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    esportes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return colors[cat] || "bg-white/10 text-white/60 border-white/20";
}

export function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("destaques");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchNews = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      if (!res.ok) throw new Error("Erro ao buscar notícias");
      const data = await res.json();
      setNews(data.items || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Não foi possível carregar as notícias. Tente novamente.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchNews(activeCategory), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCategory, fetchNews]);

  const categoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label || "Notícias";

  return (
    <div className="flex h-full flex-col bg-[#050810]">
      {/* Header */}
      <div className="shrink-0 border-b border-white/8 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              📰 Notícias do Dia
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Atualizado {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={() => fetchNews(activeCategory)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Atualizar
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="shrink-0 flex gap-1 border-b border-white/8 px-4 pt-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-white/10 text-white border-b-2 border-cyan-400"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
            <p className="text-sm text-white/40">Carregando {categoryLabel.toLowerCase()}...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-3xl mb-3">⚠️</span>
            <p className="text-sm text-white/50">{error}</p>
            <button
              onClick={() => fetchNews(activeCategory)}
              className="mt-3 rounded-lg bg-cyan-500/20 px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-3xl mb-3">📭</span>
            <p className="text-sm text-white/50">Nenhuma notícia disponível no momento</p>
          </div>
        ) : (
          news.map((item, i) => (
            <a
              key={`${item.link}-${i}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/15"
            >
              <div className="flex items-start gap-3">
                {/* Number */}
                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/30">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-white leading-snug">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(item.category)}`}>
                      {CATEGORIES.find((c) => c.id === item.category)?.icon}{" "}
                      {CATEGORIES.find((c) => c.id === item.category)?.label}
                    </span>
                    <span className="text-[10px] text-white/30">{item.source}</span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-[10px] text-white/30">{timeAgo(item.pubDate)}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors">
                  ↗
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

export default NewsPage;
