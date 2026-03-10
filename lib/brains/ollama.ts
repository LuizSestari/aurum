export async function generateResponseOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false,
      } ),
    });

    if (!response.ok) {
      throw new Error('Ollama não está rodando');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}
