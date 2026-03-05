const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CAIXA_BASE = 'https://venda-imoveis.caixa.gov.br';
const CONCURRENT = 10; // Requisições paralelas
const DELAY_MS = 20;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkImageExists(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function processProperty(property) {
  const id = property.externalId;
  const mainUrl = `${CAIXA_BASE}/fotos/F${id}21.jpg`;

  try {
    if (await checkImageExists(mainUrl)) {
      await prisma.image.create({
        data: {
          propertyId: property.id,
          url: mainUrl
        }
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('=== BUSCANDO IMAGENS DA CAIXA ===\n');

  // Pegar TODOS os IDs primeiro para evitar problema de paginação
  console.log('Carregando lista de imóveis sem imagem...');
  const properties = await prisma.property.findMany({
    where: {
      bank: 'Caixa Econômica Federal',
      images: { none: {} }
    },
    select: { id: true, externalId: true }
  });

  const total = properties.length;
  console.log(`Total: ${total} imóveis\n`);

  let processed = 0;
  let withImages = 0;
  const startTime = Date.now();

  // Processar em chunks de CONCURRENT
  for (let i = 0; i < properties.length; i += CONCURRENT) {
    const chunk = properties.slice(i, i + CONCURRENT);
    const results = await Promise.all(chunk.map(p => processProperty(p)));

    for (const result of results) {
      processed++;
      if (result) withImages++;
    }

    // Progress a cada 500
    if (processed % 500 === 0 || processed === total) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = (total - processed) / rate;
      const pct = Math.round(processed / total * 100);

      console.log(`Progresso: ${processed}/${total} (${pct}%) - ${withImages} com imagens (${Math.round(withImages/processed*100)}%) - ETA: ${Math.round(remaining/60)}min`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = (Date.now() - startTime) / 1000;

  console.log(`\n=== RESULTADO ===`);
  console.log(`Processados: ${processed}`);
  console.log(`Com imagens: ${withImages} (${Math.round(withImages/processed*100)}%)`);
  console.log(`Tempo: ${Math.round(elapsed/60)} minutos`);

  await prisma.$disconnect();
}

main().catch(console.error);
