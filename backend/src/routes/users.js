const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middlewares/auth');

const prisma = new PrismaClient();

// Get user dashboard stats
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalBids, activeBids, favorites, winningBids] = await Promise.all([
      prisma.bid.count({ where: { userId } }),
      prisma.bid.count({
        where: {
          userId,
          property: { status: 'ACTIVE' }
        }
      }),
      prisma.favorite.count({ where: { userId } }),
      prisma.bid.findMany({
        where: {
          userId,
          property: { status: 'SOLD' }
        },
        include: {
          property: true
        }
      }).then(bids => {
        // Filter to only include bids that are the highest for sold properties
        return bids.filter(async bid => {
          const highestBid = await prisma.bid.findFirst({
            where: { propertyId: bid.propertyId },
            orderBy: { amount: 'desc' }
          });
          return highestBid && highestBid.userId === userId;
        });
      })
    ]);

    res.json({
      totalBids,
      activeBids,
      favorites,
      wonAuctions: winningBids.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// Get user's auction history
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all properties user has bid on
    const propertyIds = await prisma.bid.findMany({
      where: { userId },
      select: { propertyId: true },
      distinct: ['propertyId']
    });

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: {
          id: { in: propertyIds.map(p => p.propertyId) }
        },
        include: {
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' }
          },
          bids: {
            where: { userId },
            orderBy: { amount: 'desc' },
            take: 1
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { auctionEnd: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.property.count({
        where: {
          id: { in: propertyIds.map(p => p.propertyId) }
        }
      })
    ]);

    res.json({
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

module.exports = router;
