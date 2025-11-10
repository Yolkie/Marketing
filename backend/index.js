const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Import middleware
const { apiLimiter, authLimiter, securityHeaders, corsOptions } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requireAdmin, setPool: setAdminAuthPool } = require('./middleware/adminAuth');
const {
  validateLogin,
  validateUUIDParam,
  validateContentSync,
  validateCaptionCreation,
  validateCaptionUpdate,
} = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware (must be first)
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Validate required environment variables
const requiredEnvVars = ['DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these in your .env file');
  process.exit(1);
}

// PostgreSQL connection with connection pooling
// Support for remote databases (hosting services) with SSL
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'marketing_dashboard',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased timeout for remote databases (10 seconds)
};

// SSL configuration for remote databases
// Only enable SSL if explicitly requested OR if DB_HOST is clearly a remote host (not Docker service name)
const isDockerServiceName = process.env.DB_HOST === 'postgres' || process.env.DB_HOST === 'db';
const isLocalhost = !process.env.DB_HOST || 
                    process.env.DB_HOST === 'localhost' || 
                    process.env.DB_HOST === '127.0.0.1';
const isRemoteHost = process.env.DB_HOST && 
                     !isLocalhost && 
                     !isDockerServiceName &&
                     (process.env.DB_HOST.includes('.') || process.env.DB_HOST.includes('amazonaws.com') || process.env.DB_HOST.includes('rds.amazonaws.com'));

// Explicit SSL setting takes precedence
if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
  console.log('🔒 SSL enabled for database connection (explicit)');
} else if (process.env.DB_SSL === 'false' || process.env.DB_SSL === '0') {
  // Explicitly disable SSL
  poolConfig.ssl = false;
  console.log('🔓 SSL disabled for database connection (explicit)');
} else if (isDockerServiceName || isLocalhost) {
  // Docker Compose or localhost - disable SSL
  poolConfig.ssl = false;
  console.log('🔓 SSL disabled for local/Docker database connection');
} else if (isRemoteHost) {
  // Remote database (hosting service) - enable SSL
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
  console.log('🔒 SSL enabled for remote database connection');
}

const pool = new Pool(poolConfig);

// Set pool in adminAuth middleware
setAdminAuthPool(pool);

// Handle pool errors (connection errors, etc.)
pool.on('error', (err, client) => {
  console.error('❌ Unexpected database pool error:', {
    message: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
  });
  
  // Don't exit the process, just log the error
  // The pool will try to reconnect automatically
});

// Handle connection errors
pool.on('connect', (client) => {
  console.log('🔌 New database connection established');
});

// Test database connection with better error handling
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', {
      message: err.message,
      code: err.code,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
    });
    
    // Provide helpful error messages
    if (err.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused. Check:');
      console.error('   1. Database server is running');
      console.error('   2. Host and port are correct');
      console.error('   3. Firewall allows connections');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout. Check:');
      console.error('   1. Database server is accessible');
      console.error('   2. Network connection is stable');
      console.error('   3. Connection timeout is sufficient');
    } else if (err.code === '28P01') {
      console.error('💡 Authentication failed. Check:');
      console.error('   1. Username is correct');
      console.error('   2. Password is correct');
      console.error('   3. User has access to the database');
    } else if (err.code === '3D000') {
      console.error('💡 Database does not exist. Check:');
      console.error('   1. Database name is correct');
      console.error('   2. Database has been created');
    }
  } else {
    console.log('✅ Database connected successfully');
    console.log('   Host:', poolConfig.host);
    console.log('   Port:', poolConfig.port);
    console.log('   Database:', poolConfig.database);
    console.log('   User:', poolConfig.user);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware that accepts either JWT token OR webhook secret
// Useful for endpoints that need to work with both user authentication and service-to-service calls
const authenticateTokenOrWebhook = (req, res, next) => {
  // Check for webhook secret first (for n8n/service calls)
  const webhookSecret = req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && webhookSecret === process.env.WEBHOOK_SECRET) {
    // Valid webhook secret - treat as service call
    req.user = { userId: 'service', email: 'service@n8n', isService: true };
    return next();
  }

  // Fall back to JWT token authentication (for user calls)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token or webhook secret required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTHENTICATION ROUTES ====================

// Registration removed - users must be created by admin

// Login
app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, timestamp: new Date().toISOString() });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('📡 Querying database for user:', email);
    let result;
    
    try {
      // Use pool.query() which handles connection management automatically
      result = await pool.query(
        'SELECT id, email, password_hash, name FROM users WHERE email = $1',
        [email]
      );
      console.log('✅ Database query successful, found', result.rows.length, 'user(s)');
    } catch (dbError) {
      console.error('❌ Database query error:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
      });
      
      // Provide helpful error messages
      if (dbError.code === 'ECONNREFUSED' || dbError.message?.includes('ECONNREFUSED')) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Check your database configuration.',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code
          } : undefined
        });
      } else if (dbError.code === 'ETIMEDOUT' || dbError.message?.includes('timeout')) {
        return res.status(500).json({ 
          error: 'Database connection timeout',
          message: 'Database server did not respond in time. Check your network connection.',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code
          } : undefined
        });
      } else if (dbError.code === '28P01' || dbError.message?.includes('password authentication')) {
        return res.status(500).json({ 
          error: 'Database authentication failed',
          message: 'Invalid database credentials. Check your .env file.',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code
          } : undefined
        });
      } else if (dbError.code === '3D000' || dbError.message?.includes('does not exist')) {
        return res.status(500).json({ 
          error: 'Database not found',
          message: 'Database does not exist. Check your database name in .env file.',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code
          } : undefined
        });
      } else if (dbError.message?.includes('SSL') || dbError.code === '08006') {
        return res.status(500).json({ 
          error: 'SSL connection error',
          message: 'SSL connection required. Add DB_SSL=true to your .env file.',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code
          } : undefined
        });
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name });

    // Verify password
    console.log('🔒 Verifying password...');
    let validPassword;
    try {
      validPassword = await bcrypt.compare(password, user.password_hash);
      console.log('✅ Password verification:', validPassword ? 'success' : 'failed');
    } catch (bcryptError) {
      console.error('❌ Password verification error:', bcryptError);
      return res.status(500).json({ 
        error: 'Password verification failed',
        message: 'Error verifying password. Please try again.',
        details: process.env.NODE_ENV === 'development' ? bcryptError.message : undefined
      });
    }

    if (!validPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error', message: 'JWT_SECRET is not set' });
    }

    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for user:', email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return detailed error in development, generic in production
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during login. Please try again.',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        stack: error.stack
      } : undefined
    });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CONTENT ROUTES ====================

// Get all content items
app.get('/api/content', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const { status, fileType } = req.query;

    let query = `
      SELECT 
        c.*,
        c.drive_file_id,
        json_agg(
          json_build_object(
            'id', cap.id,
            'version', cap.version,
            'tone', cap.tone,
            'content', cap.content,
            'status', cap.status,
            'createdAt', cap.created_at,
            'approvedBy', cap.approved_by,
            'approvedAt', cap.approved_at
          )
        ) FILTER (WHERE cap.id IS NOT NULL) as captions
      FROM content_items c
      LEFT JOIN captions cap ON c.id = cap.content_item_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (fileType) {
      query += ` AND c.file_type = $${paramCount}`;
      params.push(fileType);
      paramCount++;
    }

    query += ` GROUP BY c.id ORDER BY c.uploaded_at DESC`;

    const result = await pool.query(query, params);

    // Transform results - generate thumbnail URL from drive_file_id if missing
    const contentItems = result.rows.map(row => {
      const driveFileId = row.drive_file_id;
      const isVideo = row.file_type === 'video';
      
      // Generate thumbnail URL from drive_file_id if thumbnail_url is missing or empty
      let thumbnailUrl = row.thumbnail_url;
      if (!thumbnailUrl && driveFileId) {
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
      }
      
      // Generate embed URL if missing
      let embedUrl = row.embed_url;
      if (!embedUrl && driveFileId) {
        embedUrl = isVideo 
          ? `https://drive.google.com/file/d/${driveFileId}/preview`
          : `https://drive.google.com/uc?export=view&id=${driveFileId}`;
      }
      
      return {
        id: row.id,
        filename: row.filename,
        fileType: row.file_type,
        uploadedAt: row.uploaded_at,
        status: row.status,
        driveUrl: row.drive_url,
        thumbnailUrl: thumbnailUrl,
        embedUrl: embedUrl,
        mimeType: row.mime_type,
        driveFileId: driveFileId, // Include for frontend fallback
        captions: row.captions || [],
      };
    });

    res.json({ content: contentItems });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single content item
app.get('/api/content/:id', apiLimiter, authenticateToken, validateUUIDParam('id'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        c.*,
        c.drive_file_id,
        json_agg(
          json_build_object(
            'id', cap.id,
            'version', cap.version,
            'tone', cap.tone,
            'content', cap.content,
            'status', cap.status,
            'createdAt', cap.created_at,
            'approvedBy', cap.approved_by,
            'approvedAt', cap.approved_at
          )
        ) FILTER (WHERE cap.id IS NOT NULL) as captions
      FROM content_items c
      LEFT JOIN captions cap ON c.id = cap.content_item_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const row = result.rows[0];
    const driveFileId = row.drive_file_id;
    const isVideo = row.file_type === 'video';
    
    // Generate thumbnail URL from drive_file_id if thumbnail_url is missing or empty
    let thumbnailUrl = row.thumbnail_url;
    if (!thumbnailUrl && driveFileId) {
      thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
    }
    
    // Generate embed URL if missing
    let embedUrl = row.embed_url;
    if (!embedUrl && driveFileId) {
      embedUrl = isVideo 
        ? `https://drive.google.com/file/d/${driveFileId}/preview`
        : `https://drive.google.com/uc?export=view&id=${driveFileId}`;
    }
    
    const contentItem = {
      id: row.id,
      filename: row.filename,
      fileType: row.file_type,
      uploadedAt: row.uploaded_at,
      status: row.status,
      driveUrl: row.drive_url,
      thumbnailUrl: thumbnailUrl,
      embedUrl: embedUrl,
      mimeType: row.mime_type,
      driveFileId: driveFileId, // Include for frontend fallback
      captions: row.captions || [],
    };

    res.json({ content: contentItem });
  } catch (error) {
    console.error('Get content item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch files from Google Drive (backend endpoint to avoid CORS)
// Fetch files from Google Drive using database settings
app.post('/api/drive/fetch', apiLimiter, authenticateToken, async (req, res) => {
  try {
    // Load settings from database
    const settingsResult = await pool.query(
      'SELECT key, value FROM settings WHERE key IN ($1, $2)',
      ['google_drive_folder_id', 'google_drive_api_key']
    );

    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    const folderId = settings.google_drive_folder_id;
    const apiKey = settings.google_drive_api_key;

    if (!folderId || !apiKey) {
      return res.status(400).json({ 
        error: 'Google Drive settings not configured. Please configure Folder ID and API Key in Admin Settings.' 
      });
    }

    // Validate inputs
    if (!folderId.trim() || !apiKey.trim()) {
      return res.status(400).json({ error: 'Folder ID and API Key cannot be empty' });
    }

    // Validate API key format
    const trimmedApiKey = apiKey.trim();
    if (trimmedApiKey.startsWith('GOCSPX-')) {
      return res.status(400).json({ 
        error: '❌ You provided a Client Secret (OAuth 2.0), not an API Key!\n\n' +
          'Client Secrets start with "GOCSPX-..." (OAuth 2.0)\n' +
          'API Keys start with "AIzaSy..." (for Google Drive API)\n\n' +
          'To fix this:\n' +
          '1. Go to Google Cloud Console → APIs & Services → Credentials\n' +
          '2. Click "+ CREATE CREDENTIALS" → "API key"\n' +
          '3. Copy the new API key (starts with AIzaSy...)\n' +
          '4. Enable Google Drive API if not already enabled\n' +
          '5. Use the API key (not the client secret) in Settings\n\n' +
          'See GET_API_KEY.md for detailed instructions.'
      });
    }
    
    if (!trimmedApiKey.startsWith('AIzaSy')) {
      return res.status(400).json({ 
        error: '❌ Invalid API Key format!\n\n' +
          'API Keys should start with "AIzaSy..."\n' +
          'Your key starts with: "' + trimmedApiKey.substring(0, 6) + '..."\n\n' +
          'Please check:\n' +
          '1. You copied the correct API key (not client secret)\n' +
          '2. No extra spaces before or after the key\n' +
          '3. The API key is from Google Cloud Console → Credentials\n\n' +
          'See GET_API_KEY.md for help creating an API key.'
      });
    }

    // Build query with proper URL encoding
    const query = `'${folderId.trim()}' in parents and (mimeType contains 'video/' or mimeType contains 'image/')`;
    const fields = 'files(id,name,mimeType,createdTime,thumbnailLink,webViewLink)';
    
    // Construct URL with proper encoding
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', fields);
    url.searchParams.set('key', apiKey.trim());

    // Log the request (hide API key)
    const logUrl = url.toString().replace(apiKey.trim(), 'API_KEY_HIDDEN');
    console.log('📡 Fetching from Google Drive API:');
    console.log('   URL:', logUrl);
    console.log('   Folder ID:', folderId.trim());
    console.log('   API Key length:', apiKey.trim().length);
    console.log('   API Key starts with:', apiKey.trim().substring(0, 6) + '...');

    // Make request from backend (no CORS issues)
    const driveResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📥 Google Drive API Response:');
    console.log('   Status:', driveResponse.status);
    console.log('   Status Text:', driveResponse.statusText);

    if (!driveResponse.ok) {
      let errorMessage = 'Failed to fetch files from Google Drive';
      let errorDetails = null;
      let rawErrorText = null;

      try {
        // Clone the response to read it as both text and JSON
        const responseClone = driveResponse.clone();
        rawErrorText = await responseClone.text();
        console.log('   Raw Error Response:', rawErrorText);
        
        // Try to parse as JSON
        try {
          errorDetails = await driveResponse.json();
        } catch (parseErr) {
          console.log('   Could not parse error as JSON, trying to parse raw text...');
          try {
            errorDetails = JSON.parse(rawErrorText);
          } catch (e) {
            console.log('   Could not parse error as JSON');
          }
        }
        
        if (errorDetails && errorDetails.error) {
          errorMessage = errorDetails.error.message || errorMessage;
          
          // Log full error details
          console.error('❌ Google Drive API Error Details:', JSON.stringify(errorDetails, null, 2));
          
          // Provide helpful error messages
          if (errorMessage.includes('API key not valid') || 
              errorMessage.includes('invalid API key') || 
              errorMessage.includes('API_KEY_INVALID') ||
              errorMessage.includes('Bad Request')) {
            errorMessage = 'API key is not valid. Please check:\n\n' +
              '1. ✅ The API key is correct (no extra spaces before/after)\n' +
              '2. ✅ Google Drive API is enabled in your Google Cloud project\n' +
              '3. ✅ The API key restrictions allow Google Drive API\n' +
              '4. ✅ The API key has not been deleted or regenerated\n' +
              '5. ✅ API key format: Should start with "AIzaSy..."\n\n' +
              `Current API key length: ${apiKey.trim().length} characters\n` +
              `Current API key starts with: ${apiKey.trim().substring(0, 6)}...`;
          } else if (errorMessage.includes('permission denied') || 
                     errorMessage.includes('403') ||
                     errorMessage.includes('Forbidden')) {
            errorMessage = 'Permission denied. Please check:\n\n' +
              '1. ✅ The folder is shared (set to "Anyone with the link")\n' +
              '2. ✅ The folder ID is correct\n' +
              '3. ✅ The API key has proper permissions\n' +
              '4. ✅ The folder is accessible';
          } else if (errorMessage.includes('not found') || 
                     errorMessage.includes('404')) {
            errorMessage = 'Folder not found. Please check:\n\n' +
              '1. ✅ The folder ID is correct (from the URL: drive.google.com/drive/folders/FOLDER_ID)\n' +
              '2. ✅ The folder exists and is accessible\n' +
              `Current Folder ID: ${folderId.trim()}`;
          } else {
            // Show the actual error message
            errorMessage = `Google Drive API Error: ${errorMessage}\n\n` +
              `Status: ${driveResponse.status} ${driveResponse.statusText}\n` +
              `Full error: ${rawErrorText}`;
          }
        } else {
          errorMessage = `HTTP ${driveResponse.status}: ${driveResponse.statusText}\n\n` +
            `Response: ${rawErrorText}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        errorMessage = `HTTP ${driveResponse.status}: ${driveResponse.statusText}`;
      }

      console.error('❌ Google Drive API Error Summary:', {
        status: driveResponse.status,
        statusText: driveResponse.statusText,
        error: errorDetails,
        rawResponse: rawErrorText,
      });

      return res.status(driveResponse.status).json({ 
        error: errorMessage,
        details: errorDetails,
        status: driveResponse.status,
        statusText: driveResponse.statusText,
      });
    }

    const driveData = await driveResponse.json();
    const files = driveData.files || [];

    // Transform files to our format
    const transformedFiles = files.map((file) => {
      const isVideo = file.mimeType?.startsWith('video/') || false;
      const isImage = file.mimeType?.startsWith('image/') || false;
      
      if (!isVideo && !isImage) return null;

      return {
        id: file.id,
        filename: file.name,
        fileType: isVideo ? 'video' : 'image',
        uploadedAt: file.createdTime || new Date().toISOString(),
        status: 'pending_review',
        driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
        thumbnailUrl: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
        embedUrl: isVideo 
          ? `https://drive.google.com/file/d/${file.id}/preview`
          : `https://drive.google.com/uc?export=view&id=${file.id}`,
        mimeType: file.mimeType,
      };
    }).filter(Boolean);

    console.log(`Successfully fetched ${transformedFiles.length} file(s) from Google Drive`);

    res.json({ 
      files: transformedFiles,
      count: transformedFiles.length 
    });
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching from Google Drive',
      message: error.message 
    });
  }
});

// Sync content from Google Drive
app.post('/api/content/sync', apiLimiter, validateContentSync, async (req, res) => {
  try {
    // This endpoint accepts content items to sync (settings loaded from database)
    const { contentItems } = req.body;

    if (!contentItems || !Array.isArray(contentItems)) {
      return res.status(400).json({ error: 'Content items array is required' });
    }

    const syncedItems = [];

    for (const item of contentItems) {
      // Check if item already exists
      const existing = await pool.query(
        'SELECT id FROM content_items WHERE drive_file_id = $1',
        [item.id]
      );

      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          `UPDATE content_items 
           SET filename = $1, file_type = $2, drive_url = $3, thumbnail_url = $4, 
               embed_url = $5, mime_type = $6, updated_at = NOW()
           WHERE drive_file_id = $7`,
          [
            item.filename,
            item.fileType,
            item.driveUrl,
            item.thumbnailUrl,
            item.embedUrl,
            item.mimeType,
            item.id,
          ]
        );
        syncedItems.push(existing.rows[0].id);
      } else {
        // Insert new
        const result = await pool.query(
          `INSERT INTO content_items 
           (drive_file_id, filename, file_type, drive_url, thumbnail_url, embed_url, mime_type, status, uploaded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_review', NOW())
           RETURNING id`,
          [
            item.id,
            item.filename,
            item.fileType,
            item.driveUrl,
            item.thumbnailUrl,
            item.embedUrl,
            item.mimeType,
          ]
        );
        syncedItems.push(result.rows[0].id);
      }
    }

    res.json({ 
      message: 'Content synced successfully',
      syncedCount: syncedItems.length,
      syncedIds: syncedItems,
    });
  } catch (error) {
    console.error('Sync content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CAPTION ROUTES ====================

// Create captions for content item
app.post('/api/content/:contentId/captions', apiLimiter, authenticateToken, validateUUIDParam('contentId'), validateCaptionCreation, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { captions } = req.body;

    if (!captions || !Array.isArray(captions)) {
      return res.status(400).json({ error: 'Captions array is required' });
    }

    const createdCaptions = [];

    for (const caption of captions) {
      const result = await pool.query(
        `INSERT INTO captions (content_item_id, tone, content, status, created_at)
         VALUES ($1, $2, $3, 'pending', NOW())
         RETURNING id, version, tone, content, status, created_at`,
        [contentId, caption.tone, caption.content]
      );
      createdCaptions.push(result.rows[0]);
    }

    res.status(201).json({ captions: createdCaptions });
  } catch (error) {
    console.error('Create captions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update caption
app.put('/api/captions/:id', apiLimiter, authenticateToken, validateUUIDParam('id'), validateCaptionUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get current version
    const current = await pool.query(
      'SELECT version FROM captions WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Caption not found' });
    }

    const newVersion = current.rows[0].version + 1;

    // Update caption
    const result = await pool.query(
      `UPDATE captions 
       SET content = $1, version = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, version, tone, content, status, created_at, updated_at`,
      [content, newVersion, id]
    );

    res.json({ caption: result.rows[0] });
  } catch (error) {
    console.error('Update caption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve caption and trigger webhook
app.post('/api/captions/:id/approve', apiLimiter, authenticateToken, validateUUIDParam('id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get caption with content item info
    const captionResult = await pool.query(
      `SELECT c.*, ci.drive_file_id, ci.filename, ci.file_type, ci.drive_url, ci.embed_url
       FROM captions c
       JOIN content_items ci ON c.content_item_id = ci.id
       WHERE c.id = $1`,
      [id]
    );

    if (captionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Caption not found' });
    }

    const caption = captionResult.rows[0];

    // Update caption status
    await pool.query(
      `UPDATE captions 
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [req.user.userId, id]
    );

    // Update content item status
    await pool.query(
      `UPDATE content_items 
       SET status = 'approved', updated_at = NOW()
       WHERE id = $1`,
      [caption.content_item_id]
    );

    // Trigger webhook for n8n (if configured)
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'caption_approved',
            captionId: id,
            contentItemId: caption.content_item_id,
            caption: {
              tone: caption.tone,
              content: caption.content,
              version: caption.version,
            },
            content: {
              filename: caption.filename,
              fileType: caption.file_type,
              driveUrl: caption.drive_url,
              embedUrl: caption.embed_url,
            },
            approvedBy: req.user.userId,
            approvedAt: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    res.json({
      message: 'Caption approved successfully',
      captionId: id,
      webhookTriggered: !!process.env.N8N_WEBHOOK_URL,
    });
  } catch (error) {
    console.error('Approve caption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Re-caption: Trigger n8n workflow to generate new captions
app.post('/api/content/:contentId/recaption', apiLimiter, authenticateToken, validateUUIDParam('contentId'), async (req, res) => {
  try {
    const { contentId } = req.params;

    // Get content item info
    const contentResult = await pool.query(
      `SELECT id, drive_file_id, filename, file_type, drive_url, embed_url, thumbnail_url, mime_type
       FROM content_items
       WHERE id = $1`,
      [contentId]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const contentItem = contentResult.rows[0];

    // Use N8N_RECAPTION_WEBHOOK_URL if available, otherwise fall back to N8N_WEBHOOK_URL
    const webhookUrl = process.env.N8N_RECAPTION_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    // Trigger webhook for n8n (if configured)
    if (webhookUrl) {
      try {
        const webhookPayload = {
          event: 'recaption_requested',
          contentItemId: contentItem.id,
          driveFileId: contentItem.drive_file_id,
          content: {
            filename: contentItem.filename,
            fileType: contentItem.file_type,
            driveUrl: contentItem.drive_url,
            embedUrl: contentItem.embed_url,
            thumbnailUrl: contentItem.thumbnail_url,
            mimeType: contentItem.mime_type,
          },
          requestedBy: req.user.userId,
          requestedAt: new Date().toISOString(),
        };

        console.log('Triggering re-caption webhook:', {
          webhookUrl,
          contentItemId: contentItem.id,
          driveFileId: contentItem.drive_file_id,
          filename: contentItem.filename,
        });

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Webhook error response:', {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
            body: errorText,
          });
          // Don't fail the request, but log the error
        } else {
          console.log('Re-caption webhook triggered successfully');
        }
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError);
        // Don't fail the request if webhook fails
      }
    } else {
      console.warn('No n8n webhook URL configured. Set N8N_RECAPTION_WEBHOOK_URL or N8N_WEBHOOK_URL environment variable.');
    }

    res.json({
      message: 'Re-caption request sent successfully',
      contentItemId: contentItem.id,
      webhookTriggered: !!webhookUrl,
    });
  } catch (error) {
    console.error('Re-caption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== WEBHOOK ROUTES ====================

// Webhook endpoint for Google Drive notifications
app.post('/api/webhooks/drive', async (req, res) => {
  try {
    // Verify webhook secret if configured
    const webhookSecret = req.headers['x-webhook-secret'];
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const { event, fileId, fileName, fileType, mimeType } = req.body;

    console.log('Drive webhook received:', { event, fileId, fileName });

    // Handle different webhook events
    if (event === 'file_created' || event === 'file_updated') {
      // You can trigger caption generation here
      // For now, just log it
      console.log('File event:', { fileId, fileName, fileType });
    }

    res.json({ received: true, event });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for n8n to send data back
app.post('/api/webhooks/n8n', async (req, res) => {
  try {
    // Authentication removed for testing
    // TODO: Re-enable authentication in production
    
    const { event, data } = req.body;

    console.log('n8n webhook received:', { event, data });

    // Handle n8n webhook events
    if (event === 'captions_generated') {
      // Store generated captions
      // Support both contentItemId (UUID) and driveFileId (Google Drive file ID)
      const { contentItemId, driveFileId, captions } = data;
      
      if (!captions || !Array.isArray(captions)) {
        return res.status(400).json({ error: 'Captions array is required' });
      }

      let finalContentItemId = contentItemId;

      // If driveFileId is provided instead of contentItemId, look it up
      if (driveFileId && !contentItemId) {
        // Validate driveFileId format (Google Drive IDs are typically alphanumeric, 20-50 chars)
        if (typeof driveFileId !== 'string' || driveFileId.trim().length < 10) {
          return res.status(400).json({ 
            error: 'Invalid driveFileId format',
            message: 'driveFileId must be a valid Google Drive file ID (string, min 10 characters)'
          });
        }

        const trimmedDriveFileId = driveFileId.trim();
        
        const contentResult = await pool.query(
          'SELECT id, drive_file_id, filename FROM content_items WHERE drive_file_id = $1',
          [trimmedDriveFileId]
        );

        if (contentResult.rows.length === 0) {
          console.error(`❌ Content item lookup failed for drive_file_id: ${trimmedDriveFileId}`);
          return res.status(404).json({ 
            error: 'Content item not found',
            message: `No content item found with drive_file_id: ${trimmedDriveFileId}. Make sure the content was stored first.`,
            driveFileId: trimmedDriveFileId
          });
        }

        // Verify we got exactly one match (should be unique due to UNIQUE constraint)
        if (contentResult.rows.length > 1) {
          console.error(`⚠️ Multiple content items found for drive_file_id: ${trimmedDriveFileId}`, contentResult.rows);
        }

        const contentItem = contentResult.rows[0];
        finalContentItemId = contentItem.id;
        
        // Enhanced logging with verification
        console.log(`✅ Content item lookup successful:`, {
          driveFileId: trimmedDriveFileId,
          contentItemId: finalContentItemId,
          filename: contentItem.filename,
          timestamp: new Date().toISOString()
        });
      }
      
      // If both are provided, verify they match
      if (driveFileId && contentItemId) {
        const verifyResult = await pool.query(
          'SELECT id, drive_file_id, filename FROM content_items WHERE id = $1 AND drive_file_id = $2',
          [contentItemId, driveFileId.trim()]
        );
        
        if (verifyResult.rows.length === 0) {
          console.error(`❌ Mismatch detected: contentItemId ${contentItemId} does not match driveFileId ${driveFileId}`);
          return res.status(400).json({ 
            error: 'Content item mismatch',
            message: `The provided contentItemId (${contentItemId}) does not match the driveFileId (${driveFileId}). This prevents incorrect caption linking.`,
            contentItemId,
            driveFileId: driveFileId.trim()
          });
        }
        
        console.log(`✅ Verified contentItemId matches driveFileId:`, {
          contentItemId,
          driveFileId: driveFileId.trim(),
          filename: verifyResult.rows[0].filename
        });
      }

      if (!finalContentItemId) {
        return res.status(400).json({ 
          error: 'Content item identifier required',
          message: 'Either contentItemId (UUID) or driveFileId (Google Drive file ID) must be provided'
        });
      }

      // Validate captions
      const validCaptions = captions.filter(cap => 
        cap.tone && cap.content && 
        ['Professional', 'Casual', 'Engaging'].includes(cap.tone) &&
        cap.content.trim().length >= 10
      );

      if (validCaptions.length === 0) {
        return res.status(400).json({ 
          error: 'No valid captions provided',
          message: 'Captions must have tone (Professional/Casual/Engaging) and content (min 10 characters)'
        });
      }

      // Get content item details for verification and response
      const contentItemResult = await pool.query(
        'SELECT id, drive_file_id, filename, file_type FROM content_items WHERE id = $1',
        [finalContentItemId]
      );
      
      if (contentItemResult.rows.length === 0) {
        console.error(`❌ Content item ${finalContentItemId} not found during caption insertion`);
        return res.status(404).json({ 
          error: 'Content item not found',
          message: `Content item ${finalContentItemId} was not found. This should not happen.`
        });
      }
      
      const contentItem = contentItemResult.rows[0];
      const verifiedDriveFileId = contentItem.drive_file_id;
      
      // Final verification: ensure the driveFileId matches (if provided)
      if (driveFileId && driveFileId.trim() !== verifiedDriveFileId) {
        console.error(`❌ CRITICAL: driveFileId mismatch during insertion:`, {
          provided: driveFileId.trim(),
          actual: verifiedDriveFileId,
          contentItemId: finalContentItemId
        });
        return res.status(400).json({ 
          error: 'Drive file ID mismatch',
          message: `The driveFileId provided (${driveFileId.trim()}) does not match the content item's drive_file_id (${verifiedDriveFileId}). Captions were not stored to prevent data corruption.`,
          providedDriveFileId: driveFileId.trim(),
          actualDriveFileId: verifiedDriveFileId
        });
      }

      // Store/Update captions with transaction for atomicity
      // Use UPSERT to update existing captions by tone, keeping exactly 3 captions (one per tone)
      const updatedCaptions = [];
      
      try {
        // Use a transaction to ensure all captions are updated/inserted or none
        await pool.query('BEGIN');
        
        for (const caption of validCaptions) {
          // Check if a caption with this tone already exists
          const existingResult = await pool.query(
            `SELECT id, version FROM captions 
             WHERE content_item_id = $1 AND tone = $2`,
            [finalContentItemId, caption.tone]
          );
          
          if (existingResult.rows.length > 0) {
            // Update existing caption - increment version and update content
            // Preserve approval status and metadata if caption is already approved
            const existing = existingResult.rows[0];
            const newVersion = existing.version + 1;
            
            // When updating, reset approved captions to pending so user can review new content
            // Clear approval metadata when resetting to pending
            const result = await pool.query(
              `UPDATE captions 
               SET content = $1, 
                   version = $2, 
                   updated_at = NOW(),
                   created_at = CASE 
                     WHEN status = 'approved' THEN created_at 
                     ELSE NOW() 
                   END,
                   status = 'pending',
                   approved_by = NULL,
                   approved_at = NULL
               WHERE id = $3
               RETURNING id, version, tone, content, status, created_at, updated_at, approved_by, approved_at`,
              [caption.content.trim(), newVersion, existing.id]
            );
            updatedCaptions.push(result.rows[0]);
          } else {
            // Insert new caption if tone doesn't exist yet
            const result = await pool.query(
              `INSERT INTO captions (content_item_id, tone, content, status, created_at)
               VALUES ($1, $2, $3, 'pending', NOW())
               RETURNING id, version, tone, content, status, created_at, updated_at`,
              [finalContentItemId, caption.tone, caption.content.trim()]
            );
            updatedCaptions.push(result.rows[0]);
          }
        }
        
        await pool.query('COMMIT');
        
        // Enhanced logging with full verification details
        console.log(`✅ Successfully updated/stored ${updatedCaptions.length} caption(s):`, {
          contentItemId: finalContentItemId,
          driveFileId: verifiedDriveFileId,
          filename: contentItem.filename,
          fileType: contentItem.file_type,
          captionCount: updatedCaptions.length,
          captions: updatedCaptions.map(c => ({ id: c.id, tone: c.tone, version: c.version })),
          timestamp: new Date().toISOString()
        });
      } catch (updateError) {
        await pool.query('ROLLBACK');
        console.error('❌ Error storing/updating captions, transaction rolled back:', {
          error: updateError.message,
          code: updateError.code,
          detail: updateError.detail,
          hint: updateError.hint,
          stack: updateError.stack,
          finalContentItemId,
          captionCount: validCaptions.length
        });
        throw updateError;
      }

      res.json({ 
        received: true, 
        event,
        message: `Successfully updated/stored ${updatedCaptions.length} caption(s)`,
        contentItemId: finalContentItemId,
        driveFileId: verifiedDriveFileId, // Return for verification
        filename: contentItem.filename,     // Return for verification
        fileType: contentItem.file_type,   // Return for verification
        captions: updatedCaptions,
        verification: {
          driveFileId: verifiedDriveFileId,
          contentItemId: finalContentItemId,
          captionCount: updatedCaptions.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.json({ received: true, event });
    }
  } catch (error) {
    console.error('❌ n8n webhook error:', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      body: req.body
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || 'An error occurred processing the webhook';
    
    // Check for common database errors
    if (error.code === '42703') {
      errorMessage = `Database column error: ${error.message}. Please check your database schema matches the expected structure. Run the fix_captions_table.sql script if needed.`;
    } else if (error.code === '42P01') {
      errorMessage = `Database table error: ${error.message}. Please ensure all required tables exist.`;
    } else if (error.code === '23503') {
      errorMessage = `Foreign key constraint error: ${error.message}. The referenced content item may not exist.`;
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage,
      code: error.code,
      detail: process.env.NODE_ENV === 'development' ? error.detail : undefined
    });
  }
});

// ==================== USER MANAGEMENT ROUTES (Admin Only) ====================

// Get all users (admin only)
app.get('/api/users', apiLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
app.post('/api/users', apiLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate role
    const validRoles = ['admin', 'user'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, passwordHash, name, userRole]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', apiLimiter, authenticateToken, requireAdmin, validateUUIDParam('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      // Check if email is already taken by another user
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (role !== undefined) {
      const validRoles = ['admin', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
      }
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, email, name, role, created_at`;
    
    const result = await pool.query(query, values);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', apiLimiter, authenticateToken, requireAdmin, validateUUIDParam('id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SETTINGS ROUTES (Admin Only) ====================

// Get all settings (admin only)
app.get('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value, description, updated_at FROM settings ORDER BY key'
    );

    // Convert array to object for easier frontend use
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    });

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings (admin only)
app.put('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { google_drive_folder_id, google_drive_api_key } = req.body;

    if (google_drive_folder_id !== undefined) {
      await pool.query(
        'UPDATE settings SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $3',
        [google_drive_folder_id || '', req.user.userId, 'google_drive_folder_id']
      );
    }

    if (google_drive_api_key !== undefined) {
      await pool.query(
        'UPDATE settings SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $3',
        [google_drive_api_key || '', req.user.userId, 'google_drive_api_key']
      );
    }

    // Return updated settings
    const result = await pool.query(
      'SELECT key, value, description, updated_at FROM settings WHERE key IN ($1, $2)',
      ['google_drive_folder_id', 'google_drive_api_key']
    );

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    });

    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  // Check database connection
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      return res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'marketing_dashboard'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production mode: Security features enabled');
  }
});

