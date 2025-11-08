// Security middleware

// Note: express-rate-limit and helmet need to be installed
// npm install express-rate-limit helmet

let rateLimit, helmet;

try {
  rateLimit = require('express-rate-limit');
  helmet = require('helmet');
} catch (err) {
  console.warn('⚠️  Security packages not installed. Run: npm install express-rate-limit helmet');
  // Fallback implementations
  rateLimit = () => (req, res, next) => next();
  helmet = () => (req, res, next) => next();
}

// Rate limiting
const createRateLimiter = (windowMs, max, message) => {
  if (typeof rateLimit === 'function' && rateLimit.default) {
    return rateLimit.default({
      windowMs: windowMs,
      max: max,
      message: { error: message },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
  // Fallback if package not installed
  return (req, res, next) => next();
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Stricter rate limiter for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many authentication attempts, please try again later.'
);

// Security headers
const securityHeaders = helmet ? helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}) : (req, res, next) => next();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  apiLimiter,
  authLimiter,
  securityHeaders,
  corsOptions,
};
