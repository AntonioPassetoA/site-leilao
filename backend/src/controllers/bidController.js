const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const placeBid = async (req, res) => {
  try {
    const { propertyId, amount } = req.body;
    const userId = req.user.id;

    if (!propertyId || !amount) {
      return res.status(400).json({ error: 'Property ID and amount required' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if auction is active
    if (property.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Auction is not active' });
    }

    // Check if auction has started
    const now = new Date();
    if (now < property.auctionStart) {
      return res.status(400).json({ error: 'Auction has not started yet' });
    }

    // Check if auction has ended
    if (now > property.auctionEnd) {
      return res.status(400).json({ error: 'Auction has ended' });
    }

    // Calculate minimum bid
    const currentBid = property.currentBid ? parseFloat(property.currentBid) : 0;
    const minBid = parseFloat(property.minBid);
    const bidIncrement = parseFloat(property.bidIncrement);

    const minimumAllowed = currentBid > 0
      ? currentBid + bidIncrement
      : minBid;

    if (parseFloat(amount) < minimumAllowed) {
      return res.status(400).json({
        error: `Minimum bid is R$ ${minimumAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    }

    // Create bid and update property in a transaction
    const [bid, updatedProperty] = await prisma.$transaction([
      prisma.bid.create({
        data: {
          amount: parseFloat(amount),
          userId,
          propertyId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.property.update({
        where: { id: propertyId },
        data: { currentBid: parseFloat(amount) }
      })
    ]);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(`auction:${propertyId}`).emit('newBid', {
      bid: {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        user: {
          id: bid.user.id,
          name: bid.user.name
        }
      },
      currentBid: updatedProperty.currentBid
    });

    res.status(201).json({
      message: 'Bid placed successfully',
      bid
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ error: 'Error placing bid' });
  }
};

const getBidsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where: { propertyId },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.bid.count({ where: { propertyId } })
    ]);

    res.json({
      bids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Error fetching bids' });
  }
};

const getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              images: {
                take: 1,
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.bid.count({ where: { userId } })
    ]);

    res.json({
      bids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: 'Error fetching bids' });
  }
};

module.exports = {
  placeBid,
  getBidsByProperty,
  getUserBids
};
