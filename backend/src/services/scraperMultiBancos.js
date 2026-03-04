const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse Brazilian currency to number
function parseCurrency(value) {
  if (!value) return null;
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Detect property type from text
function detectPropertyType(text) {
  const t = text?.toLowerCase() || '';
  if (t.includes('apartamento') || t.includes('apto')) return 'APARTMENT';
  if (t.includes('casa')) return 'HOUSE';
  if (t.includes('terreno') || t.includes('lote')) return 'LAND';
  if (t.includes('sala') || t.includes('loja') || t.includes('galpão') || t.includes('prédio') || t.includes('comercial')) return 'COMMERCIAL';
  if (t.includes('fazenda') || t.includes('sítio') || t.includes('chácara') || t.includes('rural')) return 'RURAL';
  return 'HOUSE';
}

// Extract state from location
function extractState(location) {
  if (!location) return '';
  const states = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  for (const state of states) {
    if (location.toUpperCase().includes(state)) return state;
  }
  return '';
}

// Extract city from location
function extractCity(location) {
  if (!location) return '';
  return location.replace(/[-\/]\s*[A-Z]{2}\s*$/i, '').trim().split(',')[0].trim();
}

// Launch browser
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
}

// ==================== SANTANDER (RESALE) ====================
async function scrapeSantander() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'SANTANDER', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping SANTANDER (Resale) ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let hasMore = true;
    let consecutiveEmpty = 0;

    while (hasMore && pageNum <= 50 && consecutiveEmpty < 2) {
      const url = `https://www.resale.com.br/busca?pagina=${pageNum}&parceiro=santander`;
      console.log(`Acessando: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        // Wait for React to render - look for common elements
        await delay(5000);

        // Try to wait for property cards to appear
        try {
          await page.waitForSelector('a[href*="/imovel/"]', { timeout: 10000 });
        } catch (e) {
          console.log('Aguardando carregamento...');
          await delay(3000);
        }

        const properties = await page.evaluate(() => {
          const items = [];

          // Find all links to properties
          const propertyLinks = document.querySelectorAll('a[href*="/imovel/"]');
          const processedUrls = new Set();

          propertyLinks.forEach(link => {
            try {
              const href = link.href;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              // Find the card container (go up to find the parent card)
              let card = link.closest('div[class*="card"], div[class*="Card"], article, li');
              if (!card) card = link.parentElement?.parentElement;

              // Look for price anywhere in the card or link
              const priceMatch = (card?.textContent || link.textContent || '').match(/R\$\s*[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : '';

              // Get title and location from various possible elements
              const titleEl = card?.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || link.textContent?.trim() || '';

              // Get location info
              const locationEl = card?.querySelector('[class*="location"], [class*="cidade"], [class*="endereco"], [class*="address"]');
              const location = locationEl?.textContent?.trim() || '';

              // Get image
              const imgEl = card?.querySelector('img');
              const image = imgEl?.src || '';

              if (href && (price || title)) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          console.log(`Página ${pageNum}: Nenhum imóvel encontrado`);
          consecutiveEmpty++;
          pageNum++;
          await delay(2000);
        } else {
          console.log(`Página ${pageNum}: ${properties.length} imóveis`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
          pageNum++;
          await delay(3000);
        }
      } catch (err) {
        console.error(`Erro na página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    // Remove duplicates
    const uniqueProperties = [];
    const seenUrls = new Set();
    for (const prop of allProperties) {
      if (!seenUrls.has(prop.link)) {
        seenUrls.add(prop.link);
        uniqueProperties.push(prop);
      }
    }

    console.log(`Total Santander: ${uniqueProperties.length} imóveis únicos`);
    const result = await importProperties(uniqueProperties, 'SANTANDER', 'Santander', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: uniqueProperties.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: uniqueProperties.length, ...result };
  } catch (error) {
    console.error('Erro Santander:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== ITAÚ ====================
async function scrapeItau() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'ITAU', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping ITAÚ ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Itaú via Resale também tem imóveis do Itaú
    let pageNum = 1;
    let hasMore = true;
    let consecutiveEmpty = 0;

    while (hasMore && pageNum <= 30 && consecutiveEmpty < 2) {
      const url = `https://www.resale.com.br/busca?pagina=${pageNum}&parceiro=itau`;
      console.log(`Acessando: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        try {
          await page.waitForSelector('a[href*="/imovel/"]', { timeout: 10000 });
        } catch (e) {
          await delay(3000);
        }

        const properties = await page.evaluate(() => {
          const items = [];
          const propertyLinks = document.querySelectorAll('a[href*="/imovel/"]');
          const processedUrls = new Set();

          propertyLinks.forEach(link => {
            try {
              const href = link.href;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              let card = link.closest('div[class*="card"], div[class*="Card"], article, li');
              if (!card) card = link.parentElement?.parentElement;

              const priceMatch = (card?.textContent || link.textContent || '').match(/R\$\s*[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card?.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || link.textContent?.trim() || '';

              const locationEl = card?.querySelector('[class*="location"], [class*="cidade"], [class*="endereco"]');
              const location = locationEl?.textContent?.trim() || '';

              const imgEl = card?.querySelector('img');
              const image = imgEl?.src || '';

              if (href && (price || title)) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          console.log(`Página ${pageNum}: Nenhum imóvel encontrado`);
          consecutiveEmpty++;
          pageNum++;
          await delay(2000);
        } else {
          console.log(`Itaú página ${pageNum}: ${properties.length} imóveis`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
          pageNum++;
          await delay(3000);
        }
      } catch (err) {
        console.error(`Erro na página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    // Remove duplicates
    const uniqueProperties = [];
    const seenUrls = new Set();
    for (const prop of allProperties) {
      if (!seenUrls.has(prop.link)) {
        seenUrls.add(prop.link);
        uniqueProperties.push(prop);
      }
    }

    console.log(`Total Itaú: ${uniqueProperties.length} imóveis únicos`);
    const result = await importProperties(uniqueProperties, 'ITAU', 'Itaú Unibanco', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: uniqueProperties.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: uniqueProperties.length, ...result };
  } catch (error) {
    console.error('Erro Itaú:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== PORTAL ZUK ====================
async function scrapePortalZuk() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'PORTAL_ZUK', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping PORTAL ZUK ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let hasMore = true;
    let consecutiveEmpty = 0;

    while (hasMore && pageNum <= 50 && consecutiveEmpty < 2) {
      const url = `https://www.portalzuk.com.br/leilao-de-imoveis?pagina=${pageNum}`;
      console.log(`Acessando: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        // Wait for content
        try {
          await page.waitForSelector('a[href*="/lote/"], a[href*="/imovel/"], .card', { timeout: 10000 });
        } catch (e) {
          await delay(3000);
        }

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // Portal Zuk usa .card-property para os cards de imóveis
          const cards = document.querySelectorAll('.card-property');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/imovel/"]');
              if (!linkEl) return;

              const href = linkEl.href;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              // Imagem
              const imgEl = card.querySelector('img');
              const image = imgEl ? imgEl.src : '';

              // Localização
              const addressEl = card.querySelector('.card-property-address');
              const location = addressEl ? addressEl.innerText.trim() : '';

              // Preço - procurar no texto do card
              const cardText = card.innerText || '';
              const priceMatch = cardText.match(/R\$\s*[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : '';

              // Título - pegar do atributo title do link
              const titleEl = card.querySelector('[title]');
              const title = titleEl ? titleEl.getAttribute('title') : '';

              if (href) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          console.log(`Página ${pageNum}: Nenhum imóvel`);
          consecutiveEmpty++;
          pageNum++;
          await delay(2000);
        } else {
          console.log(`Página ${pageNum}: ${properties.length} imóveis`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
          pageNum++;
          await delay(3000);
        }
      } catch (err) {
        console.error(`Erro na página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    // Remove duplicates
    const uniqueProperties = [];
    const seenUrls = new Set();
    for (const prop of allProperties) {
      if (!seenUrls.has(prop.link)) {
        seenUrls.add(prop.link);
        uniqueProperties.push(prop);
      }
    }

    console.log(`Total Portal Zuk: ${uniqueProperties.length} imóveis únicos`);
    const result = await importProperties(uniqueProperties, 'PORTAL_ZUK', 'Portal Zuk', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: uniqueProperties.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: uniqueProperties.length, ...result };
  } catch (error) {
    console.error('Erro Portal Zuk:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== IMPORT HELPER ====================
async function importProperties(properties, source, bankName, logId) {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const prop of properties) {
    try {
      const price = parseCurrency(prop.price);
      if (!price || price <= 0) continue;

      const state = extractState(prop.location);
      const city = extractCity(prop.location);

      const urlMatch = prop.link?.match(/\/(?:imovel|lote|property)\/([a-zA-Z0-9-]+)/);
      const externalId = urlMatch ? urlMatch[1] : `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const title = prop.title || `Imóvel ${bankName} em ${city}/${state}`;

      const data = {
        title,
        description: title,
        address: '',
        city: city || 'Não informada',
        state: state || 'SP',
        zipCode: '',
        propertyType: detectPropertyType(prop.title),
        auctionType: 'EXTRAJUDICIAL',
        minBid: price,
        bidIncrement: Math.max(1000, Math.round(price * 0.01)),
        auctionStart: new Date(),
        auctionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        source: 'OTHER',
        externalId: externalId,
        externalUrl: prop.link || '',
        bank: bankName,
        modality: 'Leilão'
      };

      const existing = await prisma.property.findUnique({
        where: { source_externalId: { source: 'OTHER', externalId } }
      });

      let propertyId;

      if (existing) {
        await prisma.property.update({ where: { id: existing.id }, data: { ...data, status: existing.status } });
        propertyId = existing.id;
        updated++;
      } else {
        const created = await prisma.property.create({ data });
        propertyId = created.id;
        imported++;
      }

      // Save image if available
      if (prop.image && prop.image.startsWith('http') && propertyId) {
        const existingImages = await prisma.image.count({ where: { propertyId } });
        if (existingImages === 0) {
          await prisma.image.create({
            data: { url: prop.image, propertyId }
          });
        }
      }
    } catch (error) {
      errors++;
    }
  }

  if (logId) {
    await prisma.scrapingLog.update({
      where: { id: logId },
      data: { imported, updated, errors }
    });
  }

  return { imported, updated, errors };
}

// ==================== SCRAPE ALL ====================
async function scrapeAllBanks() {
  console.log('=== INICIANDO SCRAPING DE TODOS OS BANCOS ===');

  const results = {
    santander: null,
    itau: null,
    portalZuk: null
  };

  try {
    results.santander = await scrapeSantander();
  } catch (e) {
    results.santander = { error: e.message };
  }

  try {
    results.itau = await scrapeItau();
  } catch (e) {
    results.itau = { error: e.message };
  }

  try {
    results.portalZuk = await scrapePortalZuk();
  } catch (e) {
    results.portalZuk = { error: e.message };
  }

  console.log('=== SCRAPING COMPLETO ===', results);
  return results;
}

// ==================== STATS ====================
async function getMultiBankStats() {
  const stats = await prisma.property.groupBy({
    by: ['bank'],
    where: { bank: { not: null } },
    _count: { id: true }
  });

  return stats.reduce((acc, s) => {
    acc[s.bank || 'unknown'] = s._count.id;
    return acc;
  }, {});
}

module.exports = {
  scrapeSantander,
  scrapeItau,
  scrapePortalZuk,
  scrapeAllBanks,
  getMultiBankStats
};
