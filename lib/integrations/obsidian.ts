export async function saveToObsidian(
  content: string,
  tags: string[] = []
): Promise<boolean> {
  try {
    const note = `# ${new Date().toLocaleDateString()}

${content}

Tags: ${tags.join(', ')}
Source: Aurum
Created: ${new Date().toISOString()}`;

    const response = await fetch('http://localhost:27123/vault/create', {
      method: 'POST',
      body: JSON.stringify({
        path: `Aurum/${Date.now( )}.md`,
        content: note,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Obsidian error:', error);
    return false;
  }
}
