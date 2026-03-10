"use client";

import { useEffect } from "react";
import { redetectProvider } from "@/lib/aurum-ai";

/**
 * Invisible component that loads API keys from the server on app startup.
 * Injects them into window.__AURUM_* so aurum-ai.ts can auto-detect providers.
 */
export default function ConfigLoader() {
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config");
        if (!response.ok) return;

        const config = await response.json();
        const win = window as unknown as Record<string, unknown>;

        if (config.anthropicKey) {
          win.__AURUM_ANTHROPIC_KEY = config.anthropicKey;
        }
        if (config.geminiKey) {
          win.__AURUM_GEMINI_KEY = config.geminiKey;
        }
        if (config.openaiKey) {
          win.__AURUM_OPENAI_KEY = config.openaiKey;
        }

        // Trigger re-detection in aurum-ai.ts
        redetectProvider();

        console.log(
          "[Aurum Config] Keys loaded:",
          config.hasAnthropic ? "Anthropic" : "",
          config.hasGemini ? "Gemini" : "",
          config.hasOpenai ? "OpenAI" : "",
        );
      } catch (err) {
        console.warn("[Aurum Config] Failed to load config:", err);
      }
    }

    loadConfig();
  }, []);

  return null; // Invisible component
}
