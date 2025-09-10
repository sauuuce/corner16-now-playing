/**
 * Secure CORS configuration utility
 * Replaces wildcard CORS with configurable allowed origins
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NextFunction } from 'express';

// Parse allowed origins from environment variable
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [];

// Default origins for development
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === "development") {
    return [...ALLOWED_ORIGINS, ...DEFAULT_DEV_ORIGINS];
  }
  return ALLOWED_ORIGINS;
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Allow if origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // In development, allow localhost with any port
  if (
    process.env.NODE_ENV === "development" &&
    origin.match(/^https?:\/\/localhost:\d+$/)
  ) {
    return true;
  }

  // In development, allow 127.0.0.1 with any port
  if (
    process.env.NODE_ENV === "development" &&
    origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)
  ) {
    return true;
  }

  return false;
}

/**
 * Set CORS headers based on request origin
 */
function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  // const allowedOrigins = getAllowedOrigins();

  // Set default CORS headers
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle origin validation
  if (isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return true;
  } else if (process.env.NODE_ENV === "development" && origin) {
    // In development, allow the origin but log a warning
    console.warn(`CORS: Unallowed origin in development: ${origin}`);
    res.setHeader("Access-Control-Allow-Origin", origin);
    return true;
  } else {
    // In production, reject unallowed origins
    console.warn(`CORS: Blocked origin: ${origin}`);
    return false;
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCorsPreflight(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    const isAllowed = setCorsHeaders(req, res);
    if (isAllowed) {
      res.status(200).end();
    } else {
      res.status(403).json({
        error: "CORS policy violation",
        message: "Origin not allowed",
      });
    }
    return true; // Request handled
  }
  return false; // Continue processing
}

/**
 * CORS middleware for Express/Vercel functions
 */
function corsMiddleware(req: VercelRequest, res: VercelResponse, next?: NextFunction): void {
  // Handle preflight requests
  if (handleCorsPreflight(req, res)) {
    return;
  }

  // Set CORS headers for actual requests
  const isAllowed = setCorsHeaders(req, res);

  // In production, reject requests from unallowed origins
  if (process.env.NODE_ENV === "production" && !isAllowed) {
    res.status(403).json({
      error: "CORS policy violation",
      message: "Origin not allowed",
    });
    return;
  }

  // Continue to next middleware
  if (next) {
    next();
  }
}

export {
  corsMiddleware,
  setCorsHeaders,
  isOriginAllowed,
  getAllowedOrigins,
  handleCorsPreflight,
};
