const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const addFavorite = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID required' });
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Property already in favorites' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId
      }
    });

    res.status(201).json({
      message: 'Added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Error adding favorite' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Error removing favorite' });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              images: {
                take: 1,
                orderBy: { createdAt: 'asc' }
              },
              _count: {
                select: { bids: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.favorite.count({ where: { userId } })
    ]);

    res.json({
      favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Error fetching favorites' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Error checking favorite' });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite
};
