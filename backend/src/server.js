require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Security middlewares
const {
  helmetConfig,
  generalLimiter,
  authLimiter,
  registerLimiter,
  leadLimiter,
  scraperLimiter,
  apiLimiter,
  compressionConfig,
  sanitizeInput,
  hpp
} = require('./middlewares/security');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const bidRoutes = require('./routes/bids');
const userRoutes = require('./routes/users');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const scraperRoutes = require('./routes/scraper');
const leadRoutes = require('./routes/leads');
const sitemapRoutes = require('./routes/sitemap');
const { startScheduler } = require('./services/scheduler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security Middleware (apply first)
app.use(helmetConfig);
app.use(compressionConfig);
app.use(hpp);
app.use(sanitizeInput);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting for all API routes
app.use('/api', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make io accessible in routes
app.set('io', io);

// Routes with specific rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/scraper', scraperLimiter, scraperRoutes);
app.use('/api/leads', leadLimiter, leadRoutes);

// SEO routes (sitemap.xml at root level for search engines)
app.use('/', sitemapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join auction room
  socket.on('joinAuction', (propertyId) => {
    socket.join(`auction:${propertyId}`);
    console.log(`User ${socket.id} joined auction ${propertyId}`);
  });

  // Leave auction room
  socket.on('leaveAuction', (propertyId) => {
    socket.leave(`auction:${propertyId}`);
    console.log(`User ${socket.id} left auction ${propertyId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start the scheduler for automatic updates
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    startScheduler();
    console.log('Automatic scheduler started');
  }
});

module.exports = { app, server, io };
