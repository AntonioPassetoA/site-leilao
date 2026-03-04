const axios = require('axios');
const iconv = require('iconv-lite');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

const CAIXA_BASE_URL = 'https://venda-imoveis.caixa.gov.br/listaweb';

// Parse Brazilian number format (1.234,56 -> 1234.56)
function parseBRNumber(value) {
  if (!value || value === '-') return null;
  const cleaned = value.toString().trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse discount percentage
function parseDiscount(value) {
  if (!value) return null;
  const num = parseBRNumber(value);
  return num ? num / 100 : null;
}

// Determine property type from description
function detectPropertyType(description) {
  const desc = description?.toLowerCase() || '';
  if (desc.includes('apartamento') || desc.includes('apto')) return 'APARTMENT';
  if (desc.includes('casa')) return 'HOUSE';
  if (desc.includes('terreno') || desc.includes('lote')) return 'LAND';
  if (desc.includes('comercial') || desc.includes('loja') || desc.includes('sala')) return 'COMMERCIAL';
  if (desc.includes('rural') || desc.includes('fazenda') || desc.includes('sítio') || desc.includes('chácara')) return 'RURAL';
  return 'HOUSE'; // default
}

// Determine auction type from modality
function detectAuctionType(modality) {
  const mod = modality?.toLowerCase() || '';
  if (mod.includes('judicial')) return 'JUDICIAL';
  return 'EXTRAJUDICIAL';
}

// Extract area from description
function extractArea(description) {
  const match = description?.match(/(\d+[.,]?\d*)\s*de\s*área\s*total/i);
  if (match) return parseBRNumber(match[1]);

  const matchPriv = description?.match(/(\d+[.,]?\d*)\s*de\s*área\s*privativa/i);
  if (matchPriv) return parseBRNumber(matchPriv[1]);

  return null;
}

// Extract bedrooms from description
function extractBedrooms(description) {
  const match = description?.match(/(\d+)\s*qto/i);
  return match ? parseInt(match[1]) : null;
}

// Extract parking spots from description
function extractParkingSpots(description) {
  const match = description?.match(/(\d+)\s*vaga/i);
  return match ? parseInt(match[1]) : null;
}

// Parse CSV line (handling quoted fields with semicolons)
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

// Download and parse CSV from Caixa
async function downloadCaixaCSV(estado) {
  const url = `${CAIXA_BASE_URL}/Lista_imoveis_${estado}.csv`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Convert from Latin1 to UTF-8
    const content = iconv.decode(Buffer.from(response.data), 'latin1');
    return content;
  } catch (error) {
    console.error(`Erro ao baixar CSV de ${estado}:`, error.message);
    throw error;
  }
}

// Parse Caixa CSV content
function parseCaixaCSV(content, estado) {
  const lines = content.split('\n').filter(line => line.trim());
  const properties = [];

  // Skip header lines (first 2 lines)
  for (let i = 2; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (fields.length < 12) continue;

    const [
      externalId,
      uf,
      cidade,
      bairro,
      endereco,
      preco,
      valorAvaliacao,
      desconto,
      financiamento,
      descricao,
      modalidade,
      link
    ] = fields;

    // Skip empty or invalid rows
    if (!externalId || !preco || externalId.includes('imóvel')) continue;

    const price = parseBRNumber(preco);
    if (!price || price <= 0) continue;

    const property = {
      externalId: externalId.trim(),
      state: uf?.trim() || estado,
      city: cidade?.trim() || '',
      neighborhood: bairro?.trim() || '',
      address: endereco?.trim() || '',
      price: price,
      evaluatedValue: parseBRNumber(valorAvaliacao),
      discount: parseDiscount(desconto),
      financing: financiamento?.toLowerCase().includes('sim'),
      description: descricao?.trim() || '',
      modality: modalidade?.trim() || '',
      externalUrl: link?.trim() || '',
      propertyType: detectPropertyType(descricao),
      auctionType: detectAuctionType(modalidade),
      area: extractArea(descricao),
      bedrooms: extractBedrooms(descricao),
      parkingSpots: extractParkingSpots(descricao)
    };

    properties.push(property);
  }

  return properties;
}

// Import properties to database
async function importProperties(properties, logId) {
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages = [];

  for (const prop of properties) {
    try {
      // Create title from property info
      const title = `${prop.propertyType === 'APARTMENT' ? 'Apartamento' :
                      prop.propertyType === 'HOUSE' ? 'Casa' :
                      prop.propertyType === 'LAND' ? 'Terreno' :
                      prop.propertyType === 'COMMERCIAL' ? 'Imóvel Comercial' :
                      'Imóvel Rural'} em ${prop.city}/${prop.state}`;

      // Set auction dates (default 30 days from now)
      const auctionStart = new Date();
      const auctionEnd = new Date();
      auctionEnd.setDate(auctionEnd.getDate() + 30);

      const data = {
        title,
        description: prop.description || `${title} - ${prop.address}`,
        address: `${prop.address}${prop.neighborhood ? ', ' + prop.neighborhood : ''}`,
        city: prop.city,
        state: prop.state,
        zipCode: '',
        area: prop.area,
        bedrooms: prop.bedrooms,
        bathrooms: null,
        parkingSpots: prop.parkingSpots,
        propertyType: prop.propertyType,
        auctionType: prop.auctionType,
        minBid: prop.price,
        currentBid: null,
        bidIncrement: Math.max(1000, Math.round(prop.price * 0.01)), // 1% or minimum 1000
        auctionStart,
        auctionEnd,
        status: 'ACTIVE',
        featured: false,
        source: 'CAIXA',
        externalId: prop.externalId,
        externalUrl: prop.externalUrl,
        bank: 'Caixa Econômica Federal',
        modality: prop.modality,
        discount: prop.discount,
        evaluatedValue: prop.evaluatedValue
      };

      // Upsert property
      const existing = await prisma.property.findUnique({
        where: {
          source_externalId: {
            source: 'CAIXA',
            externalId: prop.externalId
          }
        }
      });

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            ...data,
            status: existing.status // Keep existing status
          }
        });
        updated++;
      } else {
        await prisma.property.create({ data });
        imported++;
      }
    } catch (error) {
      errors++;
      errorMessages.push(`${prop.externalId}: ${error.message}`);
    }
  }

  // Update log
  if (logId) {
    await prisma.scrapingLog.update({
      where: { id: logId },
      data: {
        imported,
        updated,
        errors,
        errorLog: errorMessages.length > 0 ? errorMessages.join('\n') : null
      }
    });
  }

  return { imported, updated, errors };
}

// Main scraping function for a single state
async function scrapeState(estado, logId = null) {
  console.log(`Iniciando scraping de ${estado}...`);

  try {
    const content = await downloadCaixaCSV(estado);
    const properties = parseCaixaCSV(content, estado);

    console.log(`${estado}: ${properties.length} imóveis encontrados`);

    if (logId) {
      await prisma.scrapingLog.update({
        where: { id: logId },
        data: { totalFound: properties.length }
      });
    }

    const result = await importProperties(properties, logId);

    console.log(`${estado}: ${result.imported} importados, ${result.updated} atualizados, ${result.errors} erros`);

    return {
      estado,
      totalFound: properties.length,
      ...result
    };
  } catch (error) {
    console.error(`Erro no scraping de ${estado}:`, error.message);

    if (logId) {
      await prisma.scrapingLog.update({
        where: { id: logId },
        data: {
          status: 'error',
          errorLog: error.message,
          finishedAt: new Date()
        }
      });
    }

    throw error;
  }
}

// Scrape all states
async function scrapeAllStates() {
  const log = await prisma.scrapingLog.create({
    data: {
      source: 'CAIXA',
      state: 'ALL',
      status: 'running'
    }
  });

  const results = {
    totalFound: 0,
    imported: 0,
    updated: 0,
    errors: 0,
    states: []
  };

  for (const estado of ESTADOS) {
    try {
      const stateLog = await prisma.scrapingLog.create({
        data: {
          source: 'CAIXA',
          state: estado,
          status: 'running'
        }
      });

      const result = await scrapeState(estado, stateLog.id);

      await prisma.scrapingLog.update({
        where: { id: stateLog.id },
        data: {
          status: 'completed',
          finishedAt: new Date()
        }
      });

      results.totalFound += result.totalFound;
      results.imported += result.imported;
      results.updated += result.updated;
      results.errors += result.errors;
      results.states.push(result);
    } catch (error) {
      results.errors++;
      results.states.push({
        estado,
        error: error.message
      });
    }

    // Small delay between states to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update main log
  await prisma.scrapingLog.update({
    where: { id: log.id },
    data: {
      totalFound: results.totalFound,
      imported: results.imported,
      updated: results.updated,
      errors: results.errors,
      status: 'completed',
      finishedAt: new Date()
    }
  });

  return results;
}

// Get scraping logs
async function getScrapingLogs(limit = 20) {
  return prisma.scrapingLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit
  });
}

// Get scraping stats
async function getScrapingStats() {
  const [totalProperties, caixaProperties, lastLog] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { source: 'CAIXA' } }),
    prisma.scrapingLog.findFirst({
      where: { status: 'completed' },
      orderBy: { finishedAt: 'desc' }
    })
  ]);

  return {
    totalProperties,
    caixaProperties,
    lastScraping: lastLog?.finishedAt || null
  };
}

module.exports = {
  ESTADOS,
  scrapeState,
  scrapeAllStates,
  getScrapingLogs,
  getScrapingStats
};
