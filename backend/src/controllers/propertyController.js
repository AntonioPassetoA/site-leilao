const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      state,
      propertyType,
      auctionType,
      minPrice,
      maxPrice,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = state;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (auctionType) {
      where.auctionType = auctionType;
    }

    if (status) {
      where.status = status;
    } else {
      // By default, only show active properties
      where.status = 'ACTIVE';
    }

    if (minPrice || maxPrice) {
      where.minBid = {};
      if (minPrice) where.minBid.gte = parseFloat(minPrice);
      if (maxPrice) where.minBid.lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // Build orderBy
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.property.count({ where })
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
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Error fetching properties' });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { createdAt: 'asc' }
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { bids: true, favorites: true }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Error fetching property' });
  }
};

const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        featured: true,
        status: 'ACTIVE'
      },
      include: {
        images: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { auctionEnd: 'asc' },
      take: 8
    });

    res.json(properties);
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({ error: 'Error fetching featured properties' });
  }
};

const getEndingSoon = async (req, res) => {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        auctionEnd: {
          gte: now,
          lte: threeDaysLater
        }
      },
      include: {
        images: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { auctionEnd: 'asc' },
      take: 6
    });

    res.json(properties);
  } catch (error) {
    console.error('Get ending soon error:', error);
    res.status(500).json({ error: 'Error fetching properties' });
  }
};

const getStates = async (req, res) => {
  try {
    const states = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' }
    });

    res.json(states.map(s => s.state));
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Error fetching states' });
  }
};

const getCities = async (req, res) => {
  try {
    const { state } = req.query;

    const where = { status: 'ACTIVE' };
    if (state) where.state = state;

    const cities = await prisma.property.findMany({
      where,
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    });

    res.json(cities.map(c => c.city));
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Error fetching cities' });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getFeaturedProperties,
  getEndingSoon,
  getStates,
  getCities
};
