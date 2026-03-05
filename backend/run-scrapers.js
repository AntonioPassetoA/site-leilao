const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import scrapers
const { scrapeCaixa } = require('./src/services/scraper');
const { scrapeBB } = require('./src/services/scraperBB');
const { scrapeAllLeiloeiros } = require('./src/services/scraperLeiloeiros');

async function runAll() {
  console.log('=== INICIANDO SCRAPERS ===\n');
  console.log('Imóveis antes:', await prisma.property.count());

  // 1. Caixa
  console.log('\n1. Scraping Caixa...');
  try {
    const result = await scrapeCaixa();
    console.log('   Resultado:', result);
  } catch(e) {
    console.log('   Erro:', e.message);
  }

  // 2. Banco do Brasil
  console.log('\n2. Scraping Banco do Brasil...');
  try {
    const result = await scrapeBB();
    console.log('   Resultado:', result);
  } catch(e) {
    console.log('   Erro:', e.message);
  }

  // 3. Leiloeiros
  console.log('\n3. Scraping Leiloeiros...');
  try {
    const result = await scrapeAllLeiloeiros();
    console.log('   Resultado:', result);
  } catch(e) {
    console.log('   Erro:', e.message);
  }

  // Resultado final
  const total = await prisma.property.count();
  const withImages = await prisma.property.count({ where: { images: { some: {} } } });

  console.log('\n=== RESULTADO FINAL ===');
  console.log('Total de imóveis:', total);
  console.log('Com imagens:', withImages);

  await prisma.$disconnect();
}

runAll();
