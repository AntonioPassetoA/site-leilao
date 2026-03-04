const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProperties,
      activeAuctions,
      totalUsers,
      totalBids,
      recentBids,
      topProperties
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.bid.count(),
      prisma.bid.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          property: { select: { title: true } }
        }
      }),
      prisma.property.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { currentBid: 'desc' },
        take: 5,
        include: {
          _count: { select: { bids: true } }
        }
      })
    ]);

    // Calculate total revenue from sold properties
    const soldProperties = await prisma.property.findMany({
      where: { status: 'SOLD' },
      select: { currentBid: true }
    });

    const totalRevenue = soldProperties.reduce((sum, p) => {
      return sum + (p.currentBid ? parseFloat(p.currentBid) : 0);
    }, 0);

    res.json({
      stats: {
        totalProperties,
        activeAuctions,
        totalUsers,
        totalBids,
        totalRevenue
      },
      recentBids,
      topProperties
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

// Property CRUD
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      area,
      bedrooms,
      bathrooms,
      parkingSpots,
      propertyType,
      auctionType,
      minBid,
      bidIncrement,
      auctionStart,
      auctionEnd,
      featured,
      images
    } = req.body;

    const property = await prisma.property.create({
      data: {
        title,
        description,
        address,
        city,
        state,
        zipCode,
        area: area ? parseFloat(area) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        parkingSpots: parkingSpots ? parseInt(parkingSpots) : null,
        propertyType,
        auctionType,
        minBid: parseFloat(minBid),
        bidIncrement: bidIncrement ? parseFloat(bidIncrement) : 1000,
        auctionStart: new Date(auctionStart),
        auctionEnd: new Date(auctionEnd),
        featured: featured || false,
        status: 'PENDING',
        images: {
          create: images?.map(url => ({ url })) || []
        }
      },
      include: {
        images: true
      }
    });

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Error creating property' });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      area,
      bedrooms,
      bathrooms,
      parkingSpots,
      propertyType,
      auctionType,
      minBid,
      bidIncrement,
      auctionStart,
      auctionEnd,
      featured,
      status
    } = req.body;

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(area !== undefined && { area: area ? parseFloat(area) : null }),
        ...(bedrooms !== undefined && { bedrooms: bedrooms ? parseInt(bedrooms) : null }),
        ...(bathrooms !== undefined && { bathrooms: bathrooms ? parseInt(bathrooms) : null }),
        ...(parkingSpots !== undefined && { parkingSpots: parkingSpots ? parseInt(parkingSpots) : null }),
        ...(propertyType && { propertyType }),
        ...(auctionType && { auctionType }),
        ...(minBid && { minBid: parseFloat(minBid) }),
        ...(bidIncrement && { bidIncrement: parseFloat(bidIncrement) }),
        ...(auctionStart && { auctionStart: new Date(auctionStart) }),
        ...(auctionEnd && { auctionEnd: new Date(auctionEnd) }),
        ...(featured !== undefined && { featured }),
        ...(status && { status })
      },
      include: {
        images: true
      }
    });

    res.json({
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Error updating property' });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property has bids
    const bidsCount = await prisma.bid.count({
      where: { propertyId: id }
    });

    if (bidsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete property with existing bids. Cancel the auction instead.'
      });
    }

    await prisma.property.delete({
      where: { id }
    });

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Error deleting property' });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { take: 1 },
          _count: { select: { bids: true } }
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('Get all properties error:', error);
    res.status(500).json({ error: 'Error fetching properties' });
  }
};

// Property images management
const addPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !images.length) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const createdImages = await prisma.image.createMany({
      data: images.map(url => ({
        url,
        propertyId: id
      }))
    });

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true }
    });

    res.json({
      message: 'Images added successfully',
      property
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(500).json({ error: 'Error adding images' });
  }
};

const deletePropertyImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    await prisma.image.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
};

// User management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          phone: true,
          role: true,
          verified: true,
          createdAt: true,
          _count: {
            select: { bids: true, favorites: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Error updating user role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
};

// Auction management
const activateAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    res.json({
      message: 'Auction activated successfully',
      property
    });
  } catch (error) {
    console.error('Activate auction error:', error);
    res.status(500).json({ error: 'Error activating auction' });
  }
};

const cancelAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Notify all users in the auction room
    const io = req.app.get('io');
    io.to(`auction:${id}`).emit('auctionCancelled', {
      propertyId: id,
      message: 'This auction has been cancelled'
    });

    res.json({
      message: 'Auction cancelled successfully',
      property
    });
  } catch (error) {
    console.error('Cancel auction error:', error);
    res.status(500).json({ error: 'Error cancelling auction' });
  }
};

const finalizeAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { status: 'SOLD' }
    });

    const winner = property.bids[0]?.user || null;

    // Notify all users in the auction room
    const io = req.app.get('io');
    io.to(`auction:${id}`).emit('auctionFinalized', {
      propertyId: id,
      winner: winner ? { name: winner.name } : null,
      finalBid: property.currentBid
    });

    res.json({
      message: 'Auction finalized successfully',
      property: updatedProperty,
      winner
    });
  } catch (error) {
    console.error('Finalize auction error:', error);
    res.status(500).json({ error: 'Error finalizing auction' });
  }
};

module.exports = {
  getDashboardStats,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  addPropertyImages,
  deletePropertyImage,
  getAllUsers,
  updateUserRole,
  deleteUser,
  activateAuction,
  cancelAuction,
  finalizeAuction
};
