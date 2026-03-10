import { AurumCore } from './lib/aurum-core.js';

async function testAurum() {
  const aurum = new AurumCore();
  await aurum.initialize();

  console.log('\n=== TESTE 1: Pergunta Simples ===');
  const result1 = await aurum.processUserMessage('Qual é a capital da França?');
  console.log(`Modelo: ${result1.model}`);
  console.log(`Resposta: ${result1.response}`);
  console.log(`Tempo: ${result1.executionTime}ms\n`);

  console.log('=== TESTE 2: Pergunta Complexa ===');
  const result2 = await aurum.processUserMessage(
    'Crie uma estratégia de marketing para um produto novo'
  );
  console.log(`Modelo: ${result2.model}`);
  console.log(`Resposta: ${result2.response}`);
  console.log(`Tempo: ${result2.executionTime}ms\n`);

  console.log('=== TESTE 3: Contexto Compartilhado ===');
  const context = aurum.getSharedContext();
  console.log(`Itens no contexto: ${context.length}`);
}

testAurum().catch(console.error);
