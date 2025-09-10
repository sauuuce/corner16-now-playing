/**
 * Secure CORS configuration utility
 * Replaces wildcard CORS with configurable allowed origins
 */

// Parse allowed origins from environment variable
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];

// Default origins for development
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

/**
 * Get allowed origins based on environment
 * @returns {string[]} Array of allowed origins
 */
function getAllowedOrigins() {
  if (process.env.NODE_ENV === 'development') {
    return [...ALLOWED_ORIGINS, ...DEFAULT_DEV_ORIGINS];
  }
  return ALLOWED_ORIGINS;
}

/**
 * Check if an origin is allowed
 * @param {string} origin - The origin to check
 * @returns {boolean} Whether the origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Allow if origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // In development, allow localhost with any port
  if (process.env.NODE_ENV === 'development' && origin.match(/^https?:\/\/localhost:\d+$/)) {
    return true;
  }
  
  // In development, allow 127.0.0.1 with any port
  if (process.env.NODE_ENV === 'development' && origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)) {
    return true;
  }
  
  return false;
}

/**
 * Set CORS headers based on request origin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} Whether the origin is allowed
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  // Set default CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle origin validation
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow the origin but log a warning
    console.warn(`CORS: Unallowed origin in development: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  } else {
    // In production, reject unallowed origins
    console.warn(`CORS: Blocked origin: ${origin}`);
    return false;
  }
}

/**
 * Handle CORS preflight requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} Whether to continue processing the request
 */
function handleCorsPreflight(req, res) {
  if (req.method === 'OPTIONS') {
    const isAllowed = setCorsHeaders(req, res);
    if (isAllowed) {
      res.status(200).end();
    } else {
      res.status(403).json({ 
        error: 'CORS policy violation',
        message: 'Origin not allowed'
      });
    }
    return true; // Request handled
  }
  return false; // Continue processing
}

/**
 * CORS middleware for Express/Vercel functions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function (optional)
 */
function corsMiddleware(req, res, next) {
  // Handle preflight requests
  if (handleCorsPreflight(req, res)) {
    return;
  }
  
  // Set CORS headers for actual requests
  const isAllowed = setCorsHeaders(req, res);
  
  // In production, reject requests from unallowed origins
  if (process.env.NODE_ENV === 'production' && !isAllowed) {
    res.status(403).json({ 
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
    return;
  }
  
  // Continue to next middleware
  if (next) {
    next();
  }
}

module.exports = {
  corsMiddleware,
  setCorsHeaders,
  isOriginAllowed,
  getAllowedOrigins,
  handleCorsPreflight
};