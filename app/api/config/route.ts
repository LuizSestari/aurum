import { NextResponse } from "next/server";

/**
 * API route that exposes available API keys to the client.
 * The client calls this on load to auto-configure the AI provider.
 * Keys are read from .env.local on the server side.
 */
export async function GET() {
  const config: Record<string, string | boolean> = {
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasOpenai: !!process.env.OPENAI_API_KEY,
    hasGroq: !!process.env.GROQ_API_KEY,
  };

  // Pass the actual keys so the client can call the APIs directly
  // This is safe because Aurum runs locally on the user's own machine
  if (process.env.ANTHROPIC_API_KEY) {
    config.anthropicKey = process.env.ANTHROPIC_API_KEY;
  }
  if (process.env.GEMINI_API_KEY) {
    config.geminiKey = process.env.GEMINI_API_KEY;
  }
  if (process.env.OPENAI_API_KEY) {
    config.openaiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.GROQ_API_KEY) {
    config.groqKey = process.env.GROQ_API_KEY;
  }

  return NextResponse.json(config);
}
