import { NextRequest } from "next/server";

/**
 * TTS API Route — Multi-engine text-to-speech
 *
 * Priority:
 * 1. ElevenLabs (ultra-realistic Neural voices, free tier 10K chars/month)
 * 2. StreamElements (decent Neural voices, free, unlimited)
 * 3. Google Translate TTS (fallback)
 * 4. Web Speech API (client-side fallback)
 */

// ElevenLabs voices — multilingual v2 model supports pt-BR natively
const ELEVENLABS_VOICES: Record<string, string> = {
  // Brian — fast, clear, natural male voice (optimized for speed)
  "pt-BR": "nPczCjzI2devNBz1zQrb",
  // Adam — deep, conversational male
  "pt-BR-male": "pNInz6obpgDQGcFmaJgB",
  // Bella — soft, natural female
  "en-US": "EXAVITQu4vr4xnSDxMaL",
};

const SE_VOICE_MAP: Record<string, string> = {
  "pt-BR": "Joana",
  "en-US": "Brian",
  "es-ES": "Enrique",
  "fr-FR": "Mathieu",
  "de-DE": "Hans",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, lang, engine } = body as { text: string; lang?: string; engine?: string };

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanText = cleanForTTS(text);
    if (cleanText.length === 0) {
      return new Response(JSON.stringify({ error: "No speakable text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const language = lang ?? "pt-BR";

    // 1. Try ElevenLabs first (most realistic)
    if (engine !== "streamelements" && engine !== "google") {
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
      if (elevenLabsKey) {
        try {
          const audio = await elevenLabsTTS(cleanText, language, elevenLabsKey);
          if (audio) {
            return new Response(audio.buffer as ArrayBuffer, {
              headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audio.byteLength.toString(),
                "Cache-Control": "public, max-age=3600",
                "X-TTS-Engine": "elevenlabs",
              },
            });
          }
        } catch (e) {
          console.warn("[TTS] ElevenLabs failed:", e);
        }
      }
    }

    // 2. Try StreamElements (decent quality, free, unlimited)
    if (engine !== "google") {
      try {
        const audio = await streamElementsTTS(cleanText, language);
        if (audio) {
          return new Response(audio.buffer as ArrayBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audio.byteLength.toString(),
              "Cache-Control": "public, max-age=3600",
              "X-TTS-Engine": "streamelements",
            },
          });
        }
      } catch (e) {
        console.warn("[TTS] StreamElements failed:", e);
      }
    }

    // 3. Fallback: Google Translate TTS
    const audio = await googleTranslateTTS(cleanText, language);
    return new Response(audio.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "X-TTS-Engine": "google-translate",
      },
    });
  } catch (err) {
    console.error("[API /tts] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "TTS error",
        fallback: "web-speech",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ── ElevenLabs TTS (Ultra-realistic) ──
async function elevenLabsTTS(text: string, lang: string, apiKey: string): Promise<Uint8Array | null> {
  const voiceId = ELEVENLABS_VOICES[lang] ?? ELEVENLABS_VOICES["pt-BR"];

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      optimize_streaming_latency: 3,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.85,
        style: 0.55,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${errBody}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// ── StreamElements TTS (Neural voices) ──
async function streamElementsTTS(text: string, lang: string): Promise<Uint8Array | null> {
  const voice = SE_VOICE_MAP[lang] ?? "Brian";
  const chunks = splitTextIntoChunks(text, 280);
  const audioBuffers: ArrayBuffer[] = [];

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encoded}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    });
    if (!response.ok) throw new Error(`StreamElements error: ${response.status}`);
    audioBuffers.push(await response.arrayBuffer());
  }

  return concatBuffers(audioBuffers);
}

// ── Google Translate TTS (Fallback) ──
async function googleTranslateTTS(text: string, lang: string): Promise<Uint8Array> {
  const chunks = splitTextIntoChunks(text, 200);
  const audioBuffers: ArrayBuffer[] = [];

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://translate.google.com/",
      },
    });
    if (!response.ok) throw new Error(`Google TTS error: ${response.status}`);
    audioBuffers.push(await response.arrayBuffer());
  }

  return concatBuffers(audioBuffers);
}

// ── Helpers ──
function cleanForTTS(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[_~]/g, "")
    .replace(/⚠️/g, "")
    .trim();
}

function concatBuffers(buffers: ArrayBuffer[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return combined;
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?。]\s)/);
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());

  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxLen) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxLen) {
        result.push(chunk.slice(i, i + maxLen));
      }
    }
  }
  return result;
}

export async function GET() {
  return new Response(
    JSON.stringify({
      engines: [
        { name: "elevenlabs", description: "Ultra-realistic Neural (Brian pt-BR - fast & natural)", priority: 1, requiresKey: true },
        { name: "streamelements", description: "Neural voices (Joana pt-BR)", priority: 2 },
        { name: "google-translate", description: "Google Translate TTS", priority: 3 },
        { name: "web-speech", description: "Browser built-in (client fallback)", priority: 4 },
      ],
      hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
