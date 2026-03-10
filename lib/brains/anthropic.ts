// Anthropic Claude brain for Aurum
// Used for complex tasks requiring high-quality reasoning

export async function generateResponseAnthropic(
  prompt: string,
  options: { model?: string; maxTokens?: number; systemPrompt?: string } = {}
): Promise<string> {
  // In Next.js client-side, env vars prefixed with NEXT_PUBLIC_ are available
  // For server-side API route, we use process.env directly
  const apiKey = typeof window !== 'undefined'
    ? (window as unknown as Record<string, unknown>).__AURUM_ANTHROPIC_KEY as string | undefined
    : process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada.');
  }

  const model = options.model ?? 'claude-sonnet-4-20250514';
  const maxTokens = options.maxTokens ?? 2048;
  const systemPrompt = options.systemPrompt ?? 'Você é Aurum, um assistente de IA pessoal avançado. Responda em português brasileiro de forma direta e útil.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => '');
      throw new Error(`Anthropic API ${response.status}: ${errorData || response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? 'Sem resposta do Claude.';
  } catch (error) {
    console.error('[Brain:Anthropic] Erro:', error);
    throw error;
  }
}
