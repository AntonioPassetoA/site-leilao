const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BB_BASE_URL = 'https://www.seuimovelbb.com.br';
const CATEGORIES = ['urbanos', 'rurais'];

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse Brazilian currency to number
function parseCurrency(value) {
  if (!value) return null;
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Detect property type from title/description
function detectPropertyType(text) {
  const t = text?.toLowerCase() || '';
  if (t.includes('apartamento') || t.includes('apto')) return 'APARTMENT';
  if (t.includes('casa')) return 'HOUSE';
  if (t.includes('terreno') || t.includes('lote')) return 'LAND';
  if (t.includes('sala') || t.includes('loja') || t.includes('galpão') || t.includes('prédio')) return 'COMMERCIAL';
  if (t.includes('fazenda') || t.includes('sítio') || t.includes('chácara') || t.includes('rural')) return 'RURAL';
  return 'HOUSE';
}

// Extract state from location string
function extractState(location) {
  if (!location) return '';
  const match = location.match(/[-\/]\s*([A-Z]{2})\s*$/);
  if (match) return match[1];

  // Try to find state abbreviation anywhere
  const states = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  for (const state of states) {
    if (location.includes(state)) return state;
  }
  return '';
}

// Extract city from location string
function extractCity(location) {
  if (!location) return '';
  // Remove state abbreviation and clean up
  const cleaned = location.replace(/[-\/]\s*[A-Z]{2}\s*$/, '').trim();
  return cleaned;
}

// Launch browser with appropriate settings
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
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });
}

// Scrape a single category page
async function scrapeCategoryPage(page, category, pageNum = 1) {
  const url = `${BB_BASE_URL}/catalogo/categoria/${category}?page=${pageNum}`;
  console.log(`Acessando: ${url}`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for content to load
    await delay(3000);

    // Check if there are properties on the page
    const properties = await page.evaluate(() => {
      const items = [];

      // Try different selectors for property cards
      const cards = document.querySelectorAll('.card-imovel, .card, .property-card, [class*="imovel"], [class*="property"]');

      cards.forEach(card => {
        try {
          // Try to extract data from each card
          const linkEl = card.querySelector('a[href*="/imovel/"]') || card.querySelector('a');
          const priceEl = card.querySelector('[class*="preco"], [class*="price"], [class*="valor"], .price, .valor');
          const titleEl = card.querySelector('[class*="titulo"], [class*="title"], h2, h3, h4, .title');
          const locationEl = card.querySelector('[class*="local"], [class*="location"], [class*="cidade"], .location');
          const imgEl = card.querySelector('img');

          if (linkEl || priceEl) {
            items.push({
              link: linkEl?.href || '',
              price: priceEl?.textContent?.trim() || '',
              title: titleEl?.textContent?.trim() || '',
              location: locationEl?.textContent?.trim() || '',
              image: imgEl?.src || ''
            });
          }
        } catch (e) {
          console.error('Error extracting card:', e);
        }
      });

      return items;
    });

    return properties;
  } catch (error) {
    console.error(`Erro ao acessar ${url}:`, error.message);
    return [];
  }
}

// Scrape property details page
async function scrapePropertyDetails(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await delay(2000);

    const details = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      const getAll = (selector) => {
        return Array.from(document.querySelectorAll(selector)).map(el => el.textContent?.trim());
      };

      return {
        title: getText('h1') || getText('.titulo') || getText('[class*="title"]'),
        price: getText('[class*="preco"]') || getText('[class*="price"]') || getText('.valor'),
        description: getText('[class*="descricao"]') || getText('[class*="description"]') || getText('.description'),
        address: getText('[class*="endereco"]') || getText('[class*="address"]'),
        location: getText('[class*="cidade"]') || getText('[class*="local"]'),
        area: getText('[class*="area"]'),
        features: getAll('[class*="caracteristica"], [class*="feature"], li'),
        images: Array.from(document.querySelectorAll('img[src*="imovel"], img[src*="property"], .gallery img')).map(img => img.src)
      };
    });

    return details;
  } catch (error) {
    console.error(`Erro ao acessar detalhes ${url}:`, error.message);
    return null;
  }
}

// Check if there are more pages
async function hasMorePages(page) {
  return page.evaluate(() => {
    const nextBtn = document.querySelector('[class*="next"], [class*="proxim"], .pagination a:last-child');
    return nextBtn && !nextBtn.classList.contains('disabled');
  });
}

// Import properties to database
async function importBBProperties(properties, logId) {
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages = [];

  for (const prop of properties) {
    try {
      const price = parseCurrency(prop.price);
      if (!price || price <= 0) continue;

      const state = extractState(prop.location);
      const city = extractCity(prop.location);

      // Extract ID from URL
      const urlMatch = prop.link?.match(/\/imovel\/(\d+)/);
      const externalId = urlMatch ? urlMatch[1] : `bb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const title = prop.title || `Imóvel BB em ${city}/${state}`;

      const data = {
        title,
        description: prop.description || title,
        address: prop.address || '',
        city: city || 'Não informada',
        state: state || 'DF',
        zipCode: '',
        area: null,
        bedrooms: null,
        bathrooms: null,
        parkingSpots: null,
        propertyType: detectPropertyType(prop.title || prop.description),
        auctionType: 'EXTRAJUDICIAL',
        minBid: price,
        currentBid: null,
        bidIncrement: Math.max(1000, Math.round(price * 0.01)),
        auctionStart: new Date(),
        auctionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'ACTIVE',
        featured: false,
        source: 'BANCO_DO_BRASIL',
        externalId: externalId,
        externalUrl: prop.link || '',
        bank: 'Banco do Brasil',
        modality: 'Venda Direta',
        discount: null,
        evaluatedValue: null
      };

      // Upsert property
      const existing = await prisma.property.findUnique({
        where: {
          source_externalId: {
            source: 'BANCO_DO_BRASIL',
            externalId: externalId
          }
        }
      });

      let propertyId;

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            ...data,
            status: existing.status
          }
        });
        propertyId = existing.id;
        updated++;
      } else {
        const created = await prisma.property.create({ data });
        propertyId = created.id;
        imported++;
      }

      // Save images if available
      const images = prop.images || (prop.image ? [prop.image] : []);
      if (images.length > 0 && propertyId) {
        // Delete existing images for this property
        await prisma.image.deleteMany({ where: { propertyId } });

        // Add new images
        for (const imageUrl of images) {
          if (imageUrl && imageUrl.startsWith('http')) {
            await prisma.image.create({
              data: {
                url: imageUrl,
                propertyId
              }
            });
          }
        }
      }
    } catch (error) {
      errors++;
      errorMessages.push(`${prop.link}: ${error.message}`);
    }
  }

  // Update log if provided
  if (logId) {
    await prisma.scrapingLog.update({
      where: { id: logId },
      data: {
        imported,
        updated,
        errors,
        errorLog: errorMessages.length > 0 ? errorMessages.slice(0, 10).join('\n') : null
      }
    });
  }

  return { imported, updated, errors };
}

// Main scraping function for BB
async function scrapeBancoDoBrasil() {
  const log = await prisma.scrapingLog.create({
    data: {
      source: 'BANCO_DO_BRASIL',
      state: 'ALL',
      status: 'running'
    }
  });

  console.log('=== Iniciando scraping do Banco do Brasil ===');

  let browser;
  const allProperties = [];

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Scrape each category
    for (const category of CATEGORIES) {
      console.log(`\nScraping categoria: ${category}`);
      let pageNum = 1;
      let hasMore = true;

      while (hasMore && pageNum <= 50) { // Max 50 pages per category
        const properties = await scrapeCategoryPage(page, category, pageNum);

        if (properties.length === 0) {
          console.log(`Nenhum imóvel encontrado na página ${pageNum}`);
          break;
        }

        console.log(`Página ${pageNum}: ${properties.length} imóveis encontrados`);
        allProperties.push(...properties);

        hasMore = await hasMorePages(page);
        pageNum++;

        // Delay between pages to avoid rate limiting
        await delay(2000);
      }
    }

    console.log(`\nTotal de imóveis encontrados: ${allProperties.length}`);

    // Update log with total found
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { totalFound: allProperties.length }
    });

    // Import to database
    const result = await importBBProperties(allProperties, log.id);

    console.log(`Importados: ${result.imported}, Atualizados: ${result.updated}, Erros: ${result.errors}`);

    // Update log
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        finishedAt: new Date()
      }
    });

    return {
      totalFound: allProperties.length,
      ...result
    };

  } catch (error) {
    console.error('Erro no scraping do BB:', error);

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: {
        status: 'error',
        errorLog: error.message,
        finishedAt: new Date()
      }
    });

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Get BB scraping stats
async function getBBStats() {
  const [totalBB, lastLog] = await Promise.all([
    prisma.property.count({ where: { source: 'BANCO_DO_BRASIL' } }),
    prisma.scrapingLog.findFirst({
      where: { source: 'BANCO_DO_BRASIL', status: 'completed' },
      orderBy: { finishedAt: 'desc' }
    })
  ]);

  return {
    totalProperties: totalBB,
    lastScraping: lastLog?.finishedAt || null
  };
}

module.exports = {
  scrapeBancoDoBrasil,
  getBBStats
};
