const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
      frameSrc: ["https://www.google.com"],
      connectSrc: ["'self'", "https://www.google.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// General rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

// Strict rate limiter for auth routes - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate limiter for registration - 3 per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Muitas contas criadas. Tente novamente em 1 hora.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for lead forms - 10 per hour per IP
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Muitos formulários enviados. Tente novamente mais tarde.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for scraper API - 5 per hour (admin only)
const scraperLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Limite de execuções do scraper atingido.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiter - 1000 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    error: 'Limite de API excedido. Tente novamente em alguns minutos.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Compression configuration
const compressionConfig = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
  threshold: 1024 // Only compress responses larger than 1KB
});

// XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential XSS patterns
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  registerLimiter,
  leadLimiter,
  scraperLimiter,
  apiLimiter,
  compressionConfig,
  sanitizeInput,
  hpp: hpp()
};
