import { NextResponse } from "next/server";

interface RSSItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
}

// Google News RSS feeds for Brazil — category-specific
const FEEDS: Record<string, string> = {
  destaques: "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  politica: "https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtVnVLQUFQAQ?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  economia: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR2RtY0RFU0FtVnVLQUFQAQ?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  tecnologia: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR1ptZHpVU0FtVnVLQUFQAQ?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  esportes: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRFp1ZEdvU0FtVnVLQUFQAQ?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  mundo: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRGx1YlY4U0FtVnVLQUFQAQ?hl=pt-BR&gl=BR&ceid=BR:pt-419",
};

function extractSource(title: string): { cleanTitle: string; source: string } {
  // Google News format: "Article Title - Source Name"
  const lastDash = title.lastIndexOf(" - ");
  if (lastDash > 0) {
    return {
      cleanTitle: title.substring(0, lastDash).trim(),
      source: title.substring(lastDash + 3).trim(),
    };
  }
  return { cleanTitle: title, source: "Google News" };
}

async function fetchFeed(category: string, url: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Aurum/1.0" },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!res.ok) return [];

    const xml = await res.text();

    // Simple XML parsing — extract <item> blocks
    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const block = match[1];

      const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
      const linkMatch = block.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

      const rawTitle = titleMatch?.[1] || titleMatch?.[2] || "";
      const { cleanTitle, source } = extractSource(rawTitle);

      if (cleanTitle) {
        items.push({
          title: cleanTitle,
          link: linkMatch?.[1] || "",
          source,
          pubDate: pubDateMatch?.[1] || new Date().toISOString(),
          category,
        });
      }
    }

    return items;
  } catch (err) {
    console.error(`[News API] Failed to fetch ${category}:`, err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "destaques";

  // Fetch specific category or all
  if (category === "todos") {
    const results = await Promise.all(
      Object.entries(FEEDS).map(([cat, url]) => fetchFeed(cat, url))
    );
    const all = results.flat();
    // Sort by date descending
    all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return NextResponse.json({ items: all.slice(0, 40) });
  }

  const feedUrl = FEEDS[category];
  if (!feedUrl) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  const items = await fetchFeed(category, feedUrl);
  return NextResponse.json({ items });
}
