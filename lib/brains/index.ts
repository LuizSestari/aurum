import { generateResponseOllama } from './ollama.js';
import { generateResponseGemini } from './gemini.js';
import { generateResponseAnthropic } from './anthropic.js';

export type BrainType = 'ollama' | 'gemini' | 'anthropic' | 'auto';

/**
 * Generate a response using the specified brain.
 *
 * Priority chain:
 * - 'anthropic' → Anthropic Claude (best quality, paid)
 * - 'gemini' → Google Gemini (good quality, free tier)
 * - 'ollama' → Local Ollama (free, unlimited, requires local setup)
 * - 'auto' → Try Ollama first, then Gemini, then Anthropic
 */
export async function generateResponse(
  prompt: string,
  brain: BrainType = 'auto'
): Promise<string> {
  // Direct brain selection
  if (brain === 'anthropic') {
    return generateResponseAnthropic(prompt);
  }

  if (brain === 'gemini') {
    return generateResponseGemini(prompt);
  }

  if (brain === 'ollama') {
    return generateResponseOllama(prompt);
  }

  // Auto mode: try in order of cost-efficiency
  // 1. Ollama (free, local) → 2. Gemini (free tier) → 3. Anthropic (paid, best)
  try {
    return await generateResponseOllama(prompt);
  } catch (ollamaError) {
    console.warn('[Brain] Ollama indisponível, tentando Gemini...');
    try {
      return await generateResponseGemini(prompt);
    } catch (geminiError) {
      console.warn('[Brain] Gemini indisponível, tentando Anthropic...');
      try {
        return await generateResponseAnthropic(prompt);
      } catch (anthropicError) {
        console.error('[Brain] Todos os modelos falharam');
        throw new Error('Nenhum modelo de IA disponível. Verifique Ollama, Gemini ou Anthropic.');
      }
    }
  }
}

export { generateResponseOllama } from './ollama.js';
export { generateResponseGemini } from './gemini.js';
export { generateResponseAnthropic } from './anthropic.js';
