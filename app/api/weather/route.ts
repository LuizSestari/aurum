import { NextResponse } from "next/server";

// Free weather API — no key required
// Uses wttr.in which returns JSON weather data

interface WeatherData {
  location: string;
  temp: string;
  feelsLike: string;
  description: string;
  humidity: string;
  wind: string;
  icon: string;
}

function getWeatherIcon(code: string): string {
  const c = parseInt(code, 10);
  if (c === 113) return "☀️";
  if (c === 116) return "⛅";
  if (c === 119 || c === 122) return "☁️";
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(c)) return "🌧️";
  if ([200, 386, 389, 392, 395].includes(c)) return "⛈️";
  if ([179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(c)) return "❄️";
  if ([143, 248, 260].includes(c)) return "🌫️";
  return "🌤️";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Default to user's city or auto-detect via IP
  const city = searchParams.get("city") || "";

  try {
    const url = city
      ? `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=pt`
      : `https://wttr.in/?format=j1&lang=pt`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Aurum/1.0" },
      next: { revalidate: 1800 }, // Cache 30 min
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    if (!current) {
      return NextResponse.json({ error: "No weather data" }, { status: 502 });
    }

    const weather: WeatherData = {
      location: area?.areaName?.[0]?.value || city || "Local",
      temp: `${current.temp_C}°C`,
      feelsLike: `${current.FeelsLikeC}°C`,
      description: current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "",
      humidity: `${current.humidity}%`,
      wind: `${current.windspeedKmph} km/h`,
      icon: getWeatherIcon(current.weatherCode),
    };

    return NextResponse.json(weather);
  } catch (err) {
    console.error("[Weather API] Error:", err);
    return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
  }
}
