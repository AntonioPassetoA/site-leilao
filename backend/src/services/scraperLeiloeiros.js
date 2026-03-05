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

  // Excluir veículos - retorna null para não importar
  if (t.includes('carro') || t.includes('veículo') || t.includes('veiculo') ||
      t.includes('moto') || t.includes('caminhão') || t.includes('caminhao') ||
      t.includes('ônibus') || t.includes('onibus') || t.includes('van') ||
      t.includes('utilitário') || t.includes('utilitario') || t.includes('trator') ||
      t.includes('máquina') || t.includes('maquina') || t.includes('equipamento') ||
      t.includes('fiat') || t.includes('volkswagen') || t.includes('chevrolet') ||
      t.includes('ford') || t.includes('honda') || t.includes('toyota') ||
      t.includes('hyundai') || t.includes('renault') || t.includes('peugeot') ||
      t.includes('citroen') || t.includes('jeep') || t.includes('bmw') ||
      t.includes('mercedes') || t.includes('audi') || t.includes('porsche') ||
      t.includes('yamaha') || t.includes('suzuki') || t.includes('kawasaki') ||
      t.includes('harley') || t.includes('scania') || t.includes('volvo') ||
      t.includes('iveco') || t.includes('man ') || t.includes('daf ')) {
    return null; // Não é imóvel
  }

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
  const upperLocation = location.toUpperCase();
  for (const state of states) {
    // Match state at end or with separators
    const patterns = [
      new RegExp(`[-/\\s]${state}$`),
      new RegExp(`[-/\\s]${state}[-/\\s]`),
      new RegExp(`^${state}[-/\\s]`),
    ];
    for (const pattern of patterns) {
      if (pattern.test(upperLocation)) return state;
    }
    if (upperLocation.includes(` ${state} `) || upperLocation.endsWith(` ${state}`)) return state;
  }
  return '';
}

// Extract city from location
function extractCity(location) {
  if (!location) return '';
  // Remove state suffix
  let city = location.replace(/[-\/]\s*[A-Z]{2}\s*$/i, '').trim();
  // Get first part if comma separated
  city = city.split(',')[0].trim();
  // Remove common prefixes
  city = city.replace(/^(cidade|município|cidade de|municipio de)\s*/i, '');
  return city;
}

// Launch browser with optimized settings
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
}

// Import properties helper
async function importProperties(properties, source, bankName, logId, sourceType = 'OTHER') {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const prop of properties) {
    try {
      const price = parseCurrency(prop.price);
      if (!price || price <= 0) continue;

      // Verificar se é imóvel (não veículo)
      const propType = detectPropertyType(prop.title || prop.description);
      if (!propType) continue; // Pular veículos e outros não-imóveis

      const state = prop.state || extractState(prop.location);
      const city = prop.city || extractCity(prop.location);

      // Generate external ID from URL or create unique one
      let externalId = prop.externalId;
      if (!externalId && prop.link) {
        const urlMatch = prop.link.match(/\/(?:imovel|lote|property|produto|item|leilao)\/([a-zA-Z0-9-_]+)/i);
        externalId = urlMatch ? `${source.toLowerCase()}-${urlMatch[1]}` : null;
      }
      if (!externalId) {
        externalId = `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      const title = prop.title || `Imóvel ${bankName} em ${city}/${state}`;

      const data = {
        title: title.substring(0, 255),
        description: prop.description || title,
        address: prop.address || '',
        city: city || 'Não informada',
        state: state || 'SP',
        zipCode: prop.zipCode || '',
        propertyType: propType,
        auctionType: prop.auctionType || 'EXTRAJUDICIAL',
        minBid: price,
        evaluatedValue: prop.evaluatedPrice ? parseCurrency(prop.evaluatedPrice) : null,
        bidIncrement: Math.max(1000, Math.round(price * 0.01)),
        auctionStart: prop.auctionStart || new Date(),
        auctionEnd: prop.auctionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        source: sourceType,
        externalId: externalId,
        externalUrl: prop.link || '',
        bank: bankName,
        modality: prop.modality || 'Leilão'
      };

      const existing = await prisma.property.findUnique({
        where: { source_externalId: { source: sourceType, externalId } }
      });

      let propertyId;

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: { ...data, status: existing.status }
        });
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
      console.error(`Erro ao importar imóvel:`, error.message);
      errors++;
    }
  }

  if (logId) {
    await prisma.scrapingLog.update({
      where: { id: logId },
      data: { imported, updated, errors }
    });
  }

  console.log(`${bankName}: ${imported} importados, ${updated} atualizados, ${errors} erros`);
  return { imported, updated, errors };
}

// ==================== BRADESCO ====================
async function scrapeBradesco() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'BRADESCO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping BRADESCO ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Bradesco usa a plataforma Resale
    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.resale.com.br/busca?pagina=${pageNum}`;
      console.log(`Resale/Bradesco página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // Resale usa [class*="property"] para cards e links a[href*="/imovel/"]
          const links = document.querySelectorAll('a[href*="/imovel/"]');

          links.forEach(link => {
            try {
              const href = link.href;
              if (!href || processedUrls.has(href)) return;
              processedUrls.add(href);

              // Encontrar card pai
              let card = link.closest('[class*="property"], [class*="card"], article') || link.parentElement?.parentElement;
              const text = card?.textContent || link.textContent || '';

              const priceMatch = text.match(/R\$\s*[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : '';
              if (!price) return;

              const titleEl = card?.querySelector('h1, h2, h3, h4, [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationEl = card?.querySelector('[class*="cidade"], [class*="local"], [class*="endereco"], [class*="address"]');
              const location = locationEl?.textContent?.trim() || '';

              const imgEl = card?.querySelector('img');
              const image = imgEl?.src || '';

              items.push({ link: href, price, title, location, image });
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }

        pageNum++;
        await delay(2000);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    // Remove duplicates
    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Bradesco: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'BRADESCO', 'Bradesco', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Bradesco:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== SOLD LEILÕES ====================
async function scrapeSold() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'SOLD', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping SOLD LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 50 && consecutiveEmpty < 3) {
      // Sold - página principal com scroll infinito
      const url = pageNum === 1 ? 'https://www.sold.com.br/' : `https://www.sold.com.br/?page=${pageNum}`;
      console.log(`Sold página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        // Scroll para carregar mais conteúdo
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(2000);

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // Sold usa cards com classe card-*
          const cards = document.querySelectorAll('[class*="card-"], .card');

          cards.forEach(card => {
            try {
              // Buscar link do lote
              const linkEl = card.querySelector('a[href]');
              if (!linkEl) return;

              const href = linkEl.href;
              if (!href || !href.includes('sold.com.br')) return;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              const text = card.textContent || '';

              // Extract price (lance mínimo ou valor)
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';
              if (!price) return;

              // Title
              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              // Location
              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              // Image
              const imgEl = card.querySelector('img');
              const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

              items.push({ link: href, price, title, location, image });
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }

        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Sold: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'SOLD', 'Sold Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Sold:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== MEGA LEILÕES ====================
async function scrapeMegaLeiloes() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'MEGA_LEILOES', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping MEGA LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 50 && consecutiveEmpty < 3) {
      const url = `https://www.megaleiloes.com.br/imoveis?page=${pageNum}`;
      console.log(`Mega Leilões página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="produto"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/produto/"], a[href*="/imovel/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href || !href.includes('megaleiloes')) return;

              const text = card.textContent || '';

              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="nome"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }

        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Mega Leilões: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'MEGA_LEILOES', 'Mega Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Mega Leilões:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== LANCE NO LEILÃO ====================
async function scrapeLanceNoLeilao() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'LANCE_NO_LEILAO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping LANCE NO LEILÃO ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 40 && consecutiveEmpty < 3) {
      const url = `https://www.lancenoleilao.com.br/leilao/imoveis?pagina=${pageNum}`;
      console.log(`Lance no Leilão página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item-leilao');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"], a[href*="/imovel/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';

              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="nome"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }

        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Lance no Leilão: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'LANCE_NO_LEILAO', 'Lance no Leilão', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Lance no Leilão:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== SUPERBID ====================
async function scrapeSuperbid() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'SUPERBID', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping SUPERBID ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 40 && consecutiveEmpty < 3) {
      // Superbid - categoria imóveis
      const url = `https://www.superbid.net/categorias/imoveis?page=${pageNum}`;
      console.log(`Superbid página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="produto"], [class*="lote"], article, .auction-item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/produto/"], a[href*="superbid"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';

              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="nome"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });

          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }

        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Superbid: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'SUPERBID', 'Superbid', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Superbid:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== BIASI LEILÕES ====================
async function scrapeBiasi() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'BIASI', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping BIASI LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.biasileiloes.com.br/leiloes/imoveis?page=${pageNum}`;
      console.log(`Biasi página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/imovel/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Biasi: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'BIASI', 'Biasi Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Biasi:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== FRAZÃO LEILÕES ====================
async function scrapeFrazao() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'FRAZAO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping FRAZÃO LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.frazaoleiloes.com.br/leiloes?categoria=imoveis&page=${pageNum}`;
      console.log(`Frazão página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Frazão: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'FRAZAO', 'Frazão Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Frazão:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== VIP LEILÕES ====================
async function scrapeVipLeiloes() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'VIP_LEILOES', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping VIP LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      // VIP Leilões - página principal
      const url = pageNum === 1 ? 'https://www.vipleiloes.com.br/' : `https://www.vipleiloes.com.br/?page=${pageNum}`;
      console.log(`VIP Leilões página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // VIP usa .card para cards
          const cards = document.querySelectorAll('.card, [class*="card-"]');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href]');
              if (!linkEl) return;

              const href = linkEl.href;
              if (!href || !href.includes('vipleiloes')) return;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';
              if (!price) return;

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              items.push({ link: href, price, title, location, image });
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total VIP Leilões: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'VIP_LEILOES', 'VIP Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro VIP Leilões:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== PESTANA LEILÕES ====================
async function scrapePestana() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'PESTANA', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping PESTANA LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      // Pestana - página principal com leilões
      const url = pageNum === 1 ? 'https://www.pestanaleiloes.com.br/' : `https://www.pestanaleiloes.com.br/?page=${pageNum}`;
      console.log(`Pestana página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // Pestana usa .card para cards
          const cards = document.querySelectorAll('.card, [class*="card-"]');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href]');
              if (!linkEl) return;

              const href = linkEl.href;
              if (!href || !href.includes('pestanaleiloes')) return;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';
              if (!price) return;

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              items.push({ link: href, price, title, location, image });
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Pestana: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'PESTANA', 'Pestana Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Pestana:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== KRONBERG LEILÕES ====================
async function scrapeKronberg() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'KRONBERG', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping KRONBERG LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.kronbergleiloes.com.br/busca?tipo=imovel&pagina=${pageNum}`;
      console.log(`Kronberg página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Kronberg: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'KRONBERG', 'Kronberg Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Kronberg:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== SATO LEILÕES ====================
async function scrapeSato() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'SATO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping SATO LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      // Sato Leilões - satoleiloes.com.br
      const url = pageNum === 1 ? 'https://satoleiloes.com.br/' : `https://satoleiloes.com.br/?page=${pageNum}`;
      console.log(`Sato página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(5000);

        const properties = await page.evaluate(() => {
          const items = [];
          const processedUrls = new Set();

          // Sato usa [class*="item-"] para cards
          const cards = document.querySelectorAll('[class*="item-"], .item, [class*="card"]');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href]');
              if (!linkEl) return;

              const href = linkEl.href;
              if (!href || !href.includes('satoleiloes')) return;
              if (processedUrls.has(href)) return;
              processedUrls.add(href);

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';
              if (!price) return;

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              items.push({ link: href, price, title, location, image });
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Sato: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'SATO', 'Sato Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Sato:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== LUT LEILÕES ====================
async function scrapeLut() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'LUT', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping LUT LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.lutleiloes.com.br/leiloes/imoveis?pagina=${pageNum}`;
      console.log(`Lut página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Lut: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'LUT', 'Lut Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Lut:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== SODRÉ SANTORO ====================
async function scrapeSodreSantoro() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'SODRE_SANTORO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping SODRÉ SANTORO ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Sodré Santoro - página principal com carousel de lotes
    const url = 'https://www.sodresantoro.com.br/';
    console.log(`Acessando Sodré Santoro: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await delay(5000);

      const properties = await page.evaluate(() => {
        const items = [];
        const processedUrls = new Set();

        // Encontrar links de lote e subir até o container correto
        document.querySelectorAll('a[href*="/lote/"]').forEach(link => {
          const href = link.href;
          if (processedUrls.has(href)) return;
          processedUrls.add(href);

          // Subir até encontrar o container com preço e imagem
          let card = link.parentElement;
          while (card && card.tagName !== 'BODY') {
            const text = card.textContent || '';
            const cardLinks = card.querySelectorAll('a[href*="/lote/"]');

            // O card ideal tem apenas 1 link de lote e contém um preço
            if (cardLinks.length === 1 && text.match(/R\$\s*[\d.,]+/)) {
              const priceMatch = text.match(/R\$\s*[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : '';

              // Extrair título
              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], [class*="title"]');
              const title = titleEl?.textContent?.trim() || '';

              // Extrair localização - evitar pegar tipo de imóvel como cidade
              const badWords = ['imóvel', 'imovel', 'apartamento', 'casa', 'terreno', 'lote', 'galpão', 'galpao', 'sala', 'loja', 'prédio', 'predio', 'comercial', 'residencial', 'industrial', 'rural', 'edificações', 'edificacoes', 'direitos', 'duplex', 'cobertura', 'kitnet'];
              const locationMatches = [...text.matchAll(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/gi)];
              let location = '';
              for (const match of locationMatches) {
                const possibleCity = match[1].trim().toLowerCase();
                if (!badWords.some(w => possibleCity.includes(w)) && possibleCity.length > 2) {
                  location = `${match[1].trim()} - ${match[2]}`;
                  break;
                }
              }

              // Extrair imagem
              const imgEl = card.querySelector('img');
              let image = imgEl?.src || '';
              if (image && !image.startsWith('http')) {
                image = '';
              }

              items.push({ link: href, price, title, location, image });
              break;
            }
            card = card.parentElement;
          }
        });

        return items;
      });

      console.log(`Sodré Santoro: ${properties.length} imóveis encontrados`);
      allProperties.push(...properties);
    } catch (err) {
      console.error('Erro Sodré Santoro:', err.message);
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Sodré Santoro: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'SODRE_SANTORO', 'Sodré Santoro', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Sodré Santoro:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== ZUKERMAN LEILÕES ====================
async function scrapeZukerman() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'ZUKERMAN', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping ZUKERMAN LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.zfreiloes.com.br/busca?tipo=imovel&pagina=${pageNum}`;
      console.log(`Zukerman página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Zukerman: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'ZUKERMAN', 'Zukerman Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Zukerman:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== BRADO LEILÕES ====================
async function scrapeBrado() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'BRADO', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping BRADO LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.bradoleiloes.com.br/leiloes?categoria=imoveis&page=${pageNum}`;
      console.log(`Brado página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Brado: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'BRADO', 'Brado Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Brado:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== FREITAG LEILÕES ====================
async function scrapeFreitag() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'FREITAG', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping FREITAG LEILÕES ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      const url = `https://www.freitagleiloes.com.br/leiloes/imoveis?pagina=${pageNum}`;
      console.log(`Freitag página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="lote"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/lote/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Freitag: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'FREITAG', 'Freitag Leilões', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Freitag:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== BRB (BANCO DE BRASÍLIA) ====================
async function scrapeBRB() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'BRB', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping BRB ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 20 && consecutiveEmpty < 3) {
      // BRB pode usar portal próprio ou parceiros
      const url = `https://www.brb.com.br/imoveis/leilao?page=${pageNum}`;
      console.log(`BRB página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="imovel"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/imovel/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total BRB: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'BRB', 'BRB', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro BRB:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== BANRISUL ====================
async function scrapeBanrisul() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'BANRISUL', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping BANRISUL ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 20 && consecutiveEmpty < 3) {
      const url = `https://www.banrisul.com.br/imoveis?tipo=leilao&pagina=${pageNum}`;
      console.log(`Banrisul página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="imovel"], article, .item');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/imovel/"], a[href*="/leilao/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"]');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Banrisul: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'BANRISUL', 'Banrisul', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Banrisul:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== EMGEA ====================
async function scrapeEmgea() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'EMGEA', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping EMGEA ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let pageNum = 1;
    let consecutiveEmpty = 0;

    while (pageNum <= 30 && consecutiveEmpty < 3) {
      // EMGEA - Empresa Gestora de Ativos (Imóveis da União)
      const url = `https://www.emgea.gov.br/imoveis?page=${pageNum}`;
      console.log(`EMGEA página ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await delay(4000);

        const properties = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('[class*="card"], [class*="imovel"], article, .item, tr');

          cards.forEach(card => {
            try {
              const linkEl = card.querySelector('a[href*="/imovel/"], a[href*="/detalhe/"]');
              const href = linkEl?.href || card.querySelector('a')?.href;
              if (!href) return;

              const text = card.textContent || '';
              const priceMatch = text.match(/R\$\s*[\d.,]+/g);
              const price = priceMatch ? priceMatch[0] : '';

              const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="titulo"], td:first-child');
              const title = titleEl?.textContent?.trim() || '';

              const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
              const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

              const imgEl = card.querySelector('img');
              const image = imgEl?.src || '';

              if (href && price) {
                items.push({ link: href, price, title, location, image });
              }
            } catch (e) {}
          });
          return items;
        });

        if (properties.length === 0) {
          consecutiveEmpty++;
        } else {
          console.log(`  -> ${properties.length} imóveis encontrados`);
          allProperties.push(...properties);
          consecutiveEmpty = 0;
        }
        pageNum++;
        await delay(2500);
      } catch (err) {
        console.error(`Erro página ${pageNum}:`, err.message);
        consecutiveEmpty++;
        pageNum++;
      }
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total EMGEA: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'EMGEA', 'EMGEA', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro EMGEA:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== RECEITA FEDERAL ====================
async function scrapeReceitaFederal() {
  const log = await prisma.scrapingLog.create({
    data: { source: 'RECEITA_FEDERAL', state: 'ALL', status: 'running' }
  });

  console.log('=== Iniciando scraping RECEITA FEDERAL ===');
  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Receita Federal usa sistema de leilões eletrônicos
    const url = 'https://www25.receita.fazenda.gov.br/sle-sociedade/portal/leiloes';
    console.log(`Receita Federal: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await delay(5000);

      // A Receita pode ter paginação diferente - tentar scroll infinito
      for (let scroll = 0; scroll < 10; scroll++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await delay(2000);
      }

      const properties = await page.evaluate(() => {
        const items = [];
        const rows = document.querySelectorAll('tr, [class*="leilao"], [class*="item"], article');

        rows.forEach(row => {
          try {
            const linkEl = row.querySelector('a[href*="leilao"], a[href*="edital"]');
            const href = linkEl?.href;
            if (!href) return;

            const text = row.textContent || '';

            // Buscar imóveis especificamente
            if (!text.toLowerCase().includes('imóvel') && !text.toLowerCase().includes('imovel') &&
                !text.toLowerCase().includes('apartamento') && !text.toLowerCase().includes('casa') &&
                !text.toLowerCase().includes('terreno')) return;

            const priceMatch = text.match(/R\$\s*[\d.,]+/g);
            const price = priceMatch ? priceMatch[0] : '';

            const title = text.substring(0, 200).trim();

            const locationMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\s*[-\/]\s*([A-Z]{2})/);
            const location = locationMatch ? `${locationMatch[1].trim()} - ${locationMatch[2]}` : '';

            if (href && price) {
              items.push({
                link: href,
                price,
                title,
                location,
                image: '',
                auctionType: 'JUDICIAL'
              });
            }
          } catch (e) {}
        });
        return items;
      });

      if (properties.length > 0) {
        console.log(`  -> ${properties.length} imóveis encontrados`);
        allProperties.push(...properties);
      }
    } catch (err) {
      console.error(`Erro Receita Federal:`, err.message);
    }

    const unique = [...new Map(allProperties.map(p => [p.link, p])).values()];
    console.log(`Total Receita Federal: ${unique.length} imóveis únicos`);

    const result = await importProperties(unique, 'RECEITA_FEDERAL', 'Receita Federal', log.id);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: unique.length, ...result, status: 'completed', finishedAt: new Date() }
    });

    return { totalFound: unique.length, ...result };
  } catch (error) {
    console.error('Erro Receita Federal:', error);
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorLog: error.message, finishedAt: new Date() }
    });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// ==================== SCRAPE ALL LEILOEIROS ====================
async function scrapeAllLeiloeiros() {
  console.log('=== INICIANDO SCRAPING DE TODOS OS LEILOEIROS ===');
  console.log('Data/Hora:', new Date().toLocaleString('pt-BR'));

  const scrapers = [
    { name: 'bradesco', fn: scrapeBradesco },
    { name: 'sold', fn: scrapeSold },
    { name: 'megaLeiloes', fn: scrapeMegaLeiloes },
    { name: 'lanceNoLeilao', fn: scrapeLanceNoLeilao },
    { name: 'superbid', fn: scrapeSuperbid },
    { name: 'biasi', fn: scrapeBiasi },
    { name: 'frazao', fn: scrapeFrazao },
    { name: 'vipLeiloes', fn: scrapeVipLeiloes },
    { name: 'pestana', fn: scrapePestana },
    { name: 'kronberg', fn: scrapeKronberg },
    { name: 'sato', fn: scrapeSato },
    { name: 'lut', fn: scrapeLut },
    { name: 'sodreSantoro', fn: scrapeSodreSantoro },
    { name: 'zukerman', fn: scrapeZukerman },
    { name: 'brado', fn: scrapeBrado },
    { name: 'freitag', fn: scrapeFreitag }
  ];

  const results = {};

  for (let i = 0; i < scrapers.length; i++) {
    const { name, fn } = scrapers[i];
    try {
      console.log(`\n[${i + 1}/${scrapers.length}] ${name}...`);
      results[name] = await fn();
    } catch (e) {
      console.error(`Erro em ${name}:`, e.message);
      results[name] = { error: e.message };
    }
  }

  console.log('\n=== SCRAPING DE LEILOEIROS COMPLETO ===');
  console.log('Resultados:', JSON.stringify(results, null, 2));

  return results;
}

// ==================== SCRAPE BANCOS ADICIONAIS ====================
async function scrapeAllBancosAdicionais() {
  console.log('=== INICIANDO SCRAPING DE BANCOS ADICIONAIS ===');

  const scrapers = [
    { name: 'brb', fn: scrapeBRB },
    { name: 'banrisul', fn: scrapeBanrisul }
  ];

  const results = {};

  for (let i = 0; i < scrapers.length; i++) {
    const { name, fn } = scrapers[i];
    try {
      console.log(`\n[${i + 1}/${scrapers.length}] ${name}...`);
      results[name] = await fn();
    } catch (e) {
      console.error(`Erro em ${name}:`, e.message);
      results[name] = { error: e.message };
    }
  }

  return results;
}

// ==================== SCRAPE GOVERNAMENTAIS ====================
async function scrapeAllGovernamentais() {
  console.log('=== INICIANDO SCRAPING DE FONTES GOVERNAMENTAIS ===');

  const scrapers = [
    { name: 'emgea', fn: scrapeEmgea },
    { name: 'receitaFederal', fn: scrapeReceitaFederal }
  ];

  const results = {};

  for (let i = 0; i < scrapers.length; i++) {
    const { name, fn } = scrapers[i];
    try {
      console.log(`\n[${i + 1}/${scrapers.length}] ${name}...`);
      results[name] = await fn();
    } catch (e) {
      console.error(`Erro em ${name}:`, e.message);
      results[name] = { error: e.message };
    }
  }

  return results;
}

// Get stats for all leiloeiros
async function getLeiloeirosStats() {
  const sources = [
    'Bradesco', 'Sold Leilões', 'Mega Leilões', 'Lance no Leilão', 'Superbid',
    'Biasi Leilões', 'Frazão Leilões', 'VIP Leilões', 'Pestana Leilões',
    'Kronberg Leilões', 'Sato Leilões', 'Lut Leilões', 'Sodré Santoro',
    'Zukerman Leilões', 'Brado Leilões', 'Freitag Leilões',
    'BRB', 'Banrisul', 'EMGEA', 'Receita Federal'
  ];

  const stats = {};
  for (const source of sources) {
    const count = await prisma.property.count({
      where: { bank: source, status: 'ACTIVE' }
    });
    stats[source] = count;
  }

  // Total
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);

  return stats;
}

module.exports = {
  // Leiloeiros principais
  scrapeBradesco,
  scrapeSold,
  scrapeMegaLeiloes,
  scrapeLanceNoLeilao,
  scrapeSuperbid,
  // Leiloeiros adicionais
  scrapeBiasi,
  scrapeFrazao,
  scrapeVipLeiloes,
  scrapePestana,
  scrapeKronberg,
  scrapeSato,
  scrapeLut,
  scrapeSodreSantoro,
  scrapeZukerman,
  scrapeBrado,
  scrapeFreitag,
  // Bancos adicionais
  scrapeBRB,
  scrapeBanrisul,
  // Governamentais
  scrapeEmgea,
  scrapeReceitaFederal,
  // Batch scrapers
  scrapeAllLeiloeiros,
  scrapeAllBancosAdicionais,
  scrapeAllGovernamentais,
  // Stats
  getLeiloeirosStats
};
