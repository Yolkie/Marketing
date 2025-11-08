// Global error handler middleware

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Cannot connect to database server. Check your database configuration.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'ETIMEDOUT') {
    return res.status(500).json({ 
      error: 'Database connection timeout',
      message: 'Database server did not respond in time. Check your network connection.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === '28P01') {
    return res.status(500).json({ 
      error: 'Database authentication failed',
      message: 'Invalid database credentials. Check your .env file.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === '3D000') {
    return res.status(500).json({ 
      error: 'Database not found',
      message: 'Database does not exist. Check your database name in .env file.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Database constraint errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};



