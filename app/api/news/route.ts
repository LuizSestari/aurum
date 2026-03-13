import { NextResponse } from "next/server";

interface RSSItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
  imageUrl: string;
}

// Google News search-based RSS — much more reliable than topic IDs for pt-BR
const FEEDS: Record<string, string> = {
  destaques:
    "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",
  politica:
    "https://news.google.com/rss/search?q=pol%C3%ADtica+brasil+congresso+governo+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  economia:
    "https://news.google.com/rss/search?q=economia+mercado+financeiro+d%C3%B3lar+bolsa+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  tecnologia:
    "https://news.google.com/rss/search?q=tecnologia+intelig%C3%AAncia+artificial+IA+startup+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  esportes:
    "https://news.google.com/rss/search?q=futebol+esportes+brasileir%C3%A3o+NBA+UFC+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  mundo:
    "https://news.google.com/rss/search?q=mundo+internacional+EUA+Europa+guerra+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
};

function extractSource(title: string): { cleanTitle: string; source: string } {
  const lastDash = title.lastIndexOf(" - ");
  if (lastDash > 0) {
    return {
      cleanTitle: title.substring(0, lastDash).trim(),
      source: title.substring(lastDash + 3).trim(),
    };
  }
  return { cleanTitle: title, source: "" };
}

async function fetchFeed(category: string, url: string): Promise<RSSItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Aurum/1.0; +https://aurum-psi-jet.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: controller.signal,
      next: { revalidate: 600 },
    });

    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();

    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 12) {
      const block = match[1];

      const titleMatch = block.match(
        /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/
      );
      const linkMatch = block.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

      // Extract image from <media:content> or <enclosure>
      const mediaMatch = block.match(
        /url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i
      );
      const enclosureMatch = block.match(
        /<enclosure[^>]+url="(https?:\/\/[^"]+)"/i
      );

      const rawTitle = titleMatch?.[1] || titleMatch?.[2] || "";
      const { cleanTitle, source } = extractSource(rawTitle);

      if (cleanTitle) {
        items.push({
          title: cleanTitle,
          link: linkMatch?.[1] || "",
          source,
          pubDate: pubDateMatch?.[1] || new Date().toISOString(),
          category,
          imageUrl: mediaMatch?.[1] || enclosureMatch?.[1] || "",
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

  if (category === "todos") {
    const results = await Promise.all(
      Object.entries(FEEDS).map(([cat, url]) => fetchFeed(cat, url))
    );
    const all = results.flat();
    all.sort(
      (a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    return NextResponse.json({ items: all.slice(0, 50) });
  }

  const feedUrl = FEEDS[category];
  if (!feedUrl) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  const items = await fetchFeed(category, feedUrl);
  return NextResponse.json({ items });
}
