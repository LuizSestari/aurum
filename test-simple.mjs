import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

async function testOllama() {
  console.log('\n=== TESTE OLLAMA ===');
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: 'Qual é a capital da França?',
        stream: false,
      } ),
    });

    if (!response.ok) {
      console.log('❌ Ollama não está rodando em localhost:11434');
      return false;
    }

    const data = await response.json();
    console.log('✅ Ollama respondeu:');
    console.log(data.response.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Erro ao conectar Ollama:', error.message);
    return false;
  }
}

async function testClaude() {
  console.log('=== TESTE CLAUDE (Gemini 2.0 Flash) ===');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY não está configurada');
    return false;
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
              parts: [{ text: 'Qual é a capital da França?' }],
            },
          ],
        } ),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Erro na resposta:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('✅ Claude respondeu:');
    console.log(data.candidates[0].content.parts[0].text.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Erro ao conectar Claude:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 TESTANDO AURUM - Ollama + Claude (Gemini 2.0 Flash)\n');
  
  const ollamaOk = await testOllama();
  const claudeOk = await testClaude();

  console.log('=== RESULTADO ===');
  console.log(`Ollama: ${ollamaOk ? '✅ OK' : '❌ ERRO'}`);
  console.log(`Claude: ${claudeOk ? '✅ OK' : '❌ ERRO'}`);
  
  if (ollamaOk && claudeOk) {
    console.log('\n🎉 TUDO FUNCIONANDO! Ollama + Claude sincronizados!');
  }
}

main().catch(console.error);
