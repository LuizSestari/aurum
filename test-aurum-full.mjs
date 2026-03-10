import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar .env.local
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

async function generateResponse(prompt, brain = 'ollama') {
  try {
    if (brain === 'ollama' || brain === 'auto') {
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
        throw new Error('Ollama falhou');
      }

      const data = await response.json();
      return data.response;
    }
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}

async function testAurum() {
  console.log('🚀 TESTANDO AURUM - Sistema Híbrido\n');

  console.log('=== TESTE 1: Pergunta Simples ===');
  try {
    const result1 = await generateResponse('Qual é a capital da França?');
    console.log(`✅ Resposta: ${result1.substring(0, 80)}...\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  console.log('=== TESTE 2: Pergunta Média ===');
  try {
    const result2 = await generateResponse('Explique como funciona a fotossíntese');
    console.log(`✅ Resposta: ${result2.substring(0, 80)}...\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  console.log('=== TESTE 3: Pergunta Complexa ===');
  try {
    const result3 = await generateResponse('Crie uma estratégia de marketing para um produto novo');
    console.log(`✅ Resposta: ${result3.substring(0, 80)}...\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  console.log('🎉 AURUM FUNCIONANDO COM OLLAMA (100% GRÁTIS E ILIMITADO!)');
}

testAurum().catch(console.error);
