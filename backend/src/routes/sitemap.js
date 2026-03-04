const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SITE_URL = process.env.SITE_URL || 'https://www.seusite.com.br';

// GET /sitemap.xml - Generate dynamic sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Get all active properties
    const properties = await prisma.property.findMany({
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      select: {
        id: true,
        updatedAt: true,
        city: true,
        state: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 50000 // Limit to 50k URLs per sitemap
    });

    // Get unique states and cities for category pages
    const locations = await prisma.property.groupBy({
      by: ['state', 'city'],
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      _count: { id: true }
    });

    const states = [...new Set(locations.map(l => l.state))];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/buscar</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/como-funciona</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/termos-de-uso</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/politica-de-privacidade</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // State pages
    for (const state of states) {
      xml += `  <url>
    <loc>${SITE_URL}/buscar?state=${encodeURIComponent(state)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Property pages
    for (const property of properties) {
      const lastmod = property.updatedAt.toISOString().split('T')[0];
      xml += `  <url>
    <loc>${SITE_URL}/imovel/${property.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// GET /sitemap-index.xml - Sitemap index for large sites
router.get('/sitemap-index.xml', async (req, res) => {
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
});

module.exports = router;
