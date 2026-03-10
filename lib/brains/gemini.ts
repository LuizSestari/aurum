// Fallback para Gemini (quando Ollama estiver indisponível)
// Atualmente usando Ollama como padrão (grátis, ilimitado)

export async function generateResponseGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Usando Ollama como fallback.');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        } ),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini error: ${error.error.message}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
}
