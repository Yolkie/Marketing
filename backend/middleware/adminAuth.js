// Admin authentication middleware
// Checks if the authenticated user has admin role

// We'll pass the pool from index.js
let pool;

// Function to set pool (called from index.js)
const setPool = (poolInstance) => {
  pool = poolInstance;
};

/**
 * Middleware to check if user is admin
 * Must be used after authenticateToken middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (from authenticateToken middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!pool) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Database pool not initialized'
      });
    }

    // Get user role from database
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = result.rows[0].role || 'user';

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin privileges required' 
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('❌ Admin check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify admin status'
    });
  }
};

module.exports = { requireAdmin, setPool };

