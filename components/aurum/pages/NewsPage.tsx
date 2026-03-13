"use client";

import { useState, useEffect, useCallback } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
  imageUrl: string;
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

function getCategoryGradient(cat: string): string {
  const gradients: Record<string, string> = {
    destaques: "from-orange-600/40 to-orange-900/60",
    politica: "from-red-600/40 to-red-900/60",
    economia: "from-emerald-600/40 to-emerald-900/60",
    tecnologia: "from-cyan-600/40 to-cyan-900/60",
    mundo: "from-blue-600/40 to-blue-900/60",
    esportes: "from-yellow-600/40 to-yellow-900/60",
  };
  return gradients[cat] || "from-gray-600/40 to-gray-900/60";
}

export function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("destaques");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const fetchNews = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    setImgErrors(new Set());
    try {
      const res = await fetch(`/api/news?category=${category}`);
      if (!res.ok) throw new Error("Erro ao buscar notícias");
      const data = await res.json();
      setNews(data.items || []);
      setLastRefresh(new Date());
    } catch {
      setError("Não foi possível carregar as notícias. Tente novamente.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  useEffect(() => {
    const interval = setInterval(() => fetchNews(activeCategory), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCategory, fetchNews]);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === activeCategory)?.label || "Notícias";

  const handleImgError = (index: number) => {
    setImgErrors((prev) => new Set(prev).add(index));
  };

  // First item with an image for the hero card
  const heroItem = news.length > 0 ? news[0] : null;
  const restItems = news.slice(1);

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
              Atualizado{" "}
              {lastRefresh.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
            <p className="text-sm text-white/40">
              Carregando {categoryLabel.toLowerCase()}...
            </p>
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
            <p className="text-sm text-white/50">
              Nenhuma notícia disponível no momento
            </p>
          </div>
        ) : (
          <>
            {/* Hero Card — first article */}
            {heroItem && (
              <a
                href={heroItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-2xl border border-white/10 transition-all hover:border-white/20"
              >
                {/* Image background */}
                <div className="relative h-52 w-full">
                  {heroItem.imageUrl && !imgErrors.has(0) ? (
                    <img
                      src={heroItem.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => handleImgError(0)}
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${getCategoryGradient(heroItem.category)}`}
                    />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                {/* Content over image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(heroItem.category)}`}
                    >
                      {CATEGORIES.find((c) => c.id === heroItem.category)?.icon}{" "}
                      {CATEGORIES.find((c) => c.id === heroItem.category)?.label}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {heroItem.source}
                    </span>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-[10px] text-white/50">
                      {timeAgo(heroItem.pubDate)}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                    {heroItem.title}
                  </h2>
                </div>
              </a>
            )}

            {/* Rest of the articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {restItems.map((item, i) => {
                const realIndex = i + 1;
                const hasImg = item.imageUrl && !imgErrors.has(realIndex);

                return (
                  <a
                    key={`${item.link}-${realIndex}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] transition-all hover:bg-white/[0.05] hover:border-white/15"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-auto w-28 shrink-0">
                      {hasImg ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() => handleImgError(realIndex)}
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${getCategoryGradient(item.category)} flex items-center justify-center text-2xl`}
                        >
                          {CATEGORIES.find((c) => c.id === item.category)?.icon}
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex flex-1 flex-col justify-center gap-1.5 p-3 min-w-0">
                      <h3 className="text-sm font-medium text-white/90 group-hover:text-white leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${getCategoryColor(item.category)}`}
                        >
                          {CATEGORIES.find((c) => c.id === item.category)?.label}
                        </span>
                        {item.source && (
                          <span className="text-[10px] text-white/30">
                            {item.source}
                          </span>
                        )}
                        <span className="text-[10px] text-white/20">•</span>
                        <span className="text-[10px] text-white/30">
                          {timeAgo(item.pubDate)}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewsPage;
