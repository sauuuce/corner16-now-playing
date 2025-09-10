const { corsMiddleware } = require('../utils/cors');

export default async function handler(req, res) {
  // Apply secure CORS middleware
  corsMiddleware(req, res);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers
  });
}