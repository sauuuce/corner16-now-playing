/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for API endpoints using Upstash Redis (serverless-friendly)
 * Falls back to in-memory rate limiting for local development
 * 
 * Features:
 * - IP-based rate limiting for anonymous users
 * - Tier-based limits for authenticated users
 * - Proper HTTP headers (X-RateLimit-*)
 * - 429 status with Retry-After header
 * - Logging for monitoring
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier for the rate limit (e.g., 'anonymous', 'authenticated') */
  identifier: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * In-memory rate limiter for local development
 * This is a simple implementation and should NOT be used in production
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  check(identifier: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now();
    const key = identifier;
    
    // Clean up expired entries
    this.cleanup(now);
    
    const record = this.requests.get(key);
    
    if (!record || record.resetTime <= now) {
      // New window
      const resetTime = now + windowSeconds * 1000;
      this.requests.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: Math.ceil(resetTime / 1000),
      };
    }
    
    // Within current window
    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Math.ceil(record.resetTime / 1000),
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }
    
    // Increment counter
    record.count++;
    return {
      success: true,
      limit,
      remaining: limit - record.count,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  private cleanup(now: number) {
    for (const [key, record] of this.requests.entries()) {
      if (record.resetTime <= now) {
        this.requests.delete(key);
      }
    }
  }
}

// Singleton instance for in-memory rate limiter
const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Create a rate limiter instance based on available configuration
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Upstash credentials are not available, return null (will use in-memory)
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      "[Rate Limit] Upstash Redis not configured, using in-memory rate limiting. " +
      "This is NOT recommended for production."
    );
    return null;
  }

  try {
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      analytics: true,
      prefix: `ratelimit:${config.identifier}`,
    });
  } catch (error) {
    console.error("[Rate Limit] Failed to initialize Upstash Redis:", error);
    return null;
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(req: VercelRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const firstIP = forwarded.split(",")[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  
  const realIP = req.headers["x-real-ip"];
  if (typeof realIP === "string") {
    return realIP;
  }
  
  // Fallback to connection remote address
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Apply rate limiting to a request
 * 
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @param config - Rate limit configuration
 * @returns Promise<boolean> - true if request is allowed, false if rate limited
 */
export async function applyRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig
): Promise<boolean> {
  const clientIP = getClientIP(req);
  const identifier = `${config.identifier}:${clientIP}`;

  let result: RateLimitResult;

  // Try Upstash Redis first
  const rateLimiter = createRateLimiter(config);
  
  if (rateLimiter) {
    try {
      const upstashResult = await rateLimiter.limit(identifier);
      result = {
        success: upstashResult.success,
        limit: upstashResult.limit,
        remaining: upstashResult.remaining,
        reset: upstashResult.reset,
      };
      
      if (!upstashResult.success) {
        result.retryAfter = Math.ceil((upstashResult.reset - Date.now()) / 1000);
      }
    } catch (error) {
      console.error("[Rate Limit] Upstash check failed, falling back to in-memory:", error);
      result = inMemoryLimiter.check(identifier, config.limit, config.windowSeconds);
    }
  } else {
    // Use in-memory rate limiter
    result = inMemoryLimiter.check(identifier, config.limit, config.windowSeconds);
  }

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", result.limit.toString());
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
  res.setHeader("X-RateLimit-Reset", result.reset.toString());

  if (!result.success) {
    // Log rate limit hit for monitoring
    console.warn(
      `[Rate Limit] Request blocked - IP: ${clientIP}, Identifier: ${config.identifier}, ` +
      `Limit: ${config.limit}/${config.windowSeconds}s, Reset: ${new Date(result.reset * 1000).toISOString()}`
    );

    // Set Retry-After header
    if (result.retryAfter) {
      res.setHeader("Retry-After", result.retryAfter.toString());
    }

    res.status(429).json({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${result.retryAfter || 60} seconds.`,
      retryAfter: result.retryAfter,
    });

    return false;
  }

  return true;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /** Anonymous users: 5 requests per hour */
  ANONYMOUS: {
    limit: 5,
    windowSeconds: 3600, // 1 hour
    identifier: "anonymous",
  } as RateLimitConfig,

  /** Authenticated users (basic tier): 20 requests per hour */
  AUTHENTICATED_BASIC: {
    limit: 20,
    windowSeconds: 3600, // 1 hour
    identifier: "authenticated-basic",
  } as RateLimitConfig,

  /** Authenticated users (premium tier): 100 requests per hour */
  AUTHENTICATED_PREMIUM: {
    limit: 100,
    windowSeconds: 3600, // 1 hour
    identifier: "authenticated-premium",
  } as RateLimitConfig,

  /** For testing: More permissive limits */
  DEVELOPMENT: {
    limit: 100,
    windowSeconds: 60, // 1 minute
    identifier: "development",
  } as RateLimitConfig,
};

/**
 * Middleware wrapper for easier integration
 */
export function withRateLimit(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any>,
  config: RateLimitConfig = RateLimitPresets.ANONYMOUS
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Check rate limit
    const allowed = await applyRateLimit(req, res, config);
    
    if (!allowed) {
      // Response already sent by applyRateLimit
      return;
    }

    // Continue with the original handler
    return handler(req, res);
  };
}
