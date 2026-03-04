const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new lead (interest form submission)
const createLead = async (req, res) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !propertyId) {
      return res.status(400).json({ error: 'Nome, email, telefone e imóvel são obrigatórios' });
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message: message || null,
        propertyId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            bank: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Interesse registrado com sucesso! Entraremos em contato em breve.',
      lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Erro ao registrar interesse' });
  }
};

// Get all leads (admin only)
const getAllLeads = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              state: true,
              bank: true,
              minBid: true,
              externalUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

// Get lead by ID (admin only)
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: { take: 1 }
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
};

// Update lead status (admin only)
const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'CONTACTED', 'CONVERTED', 'LOST'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            bank: true
          }
        }
      }
    });

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
};

// Delete lead (admin only)
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.lead.delete({
      where: { id }
    });

    res.json({ message: 'Lead removido com sucesso' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover lead' });
  }
};

// Get lead statistics (admin only)
const getLeadStats = async (req, res) => {
  try {
    const [total, byStatus, byBank, recent] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.lead.findMany({
        select: {
          property: { select: { bank: true } }
        }
      }).then(leads => {
        const bankCounts = {};
        leads.forEach(l => {
          const bank = l.property?.bank || 'Outros';
          bankCounts[bank] = (bankCounts[bank] || 0) + 1;
        });
        return Object.entries(bankCounts).map(([bank, count]) => ({ bank, count }));
      }),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      total,
      recentWeek: recent,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      byBank
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getLeadStats
};
