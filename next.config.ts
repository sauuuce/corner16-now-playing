import type { NextConfig } from 'next';

/**
 * Next.js Security Headers Configuration
 * 
 * This configuration file is prepared for future Next.js migration.
 * Currently, this project uses Vercel Serverless Functions, so security headers
 * are configured in vercel.json instead.
 * 
 * When migrating to Next.js, these headers will be automatically applied to all routes.
 * 
 * Security headers included:
 * - Content-Security-Policy (CSP): Prevents XSS, code injection, and other attacks
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - Referrer-Policy: Controls referrer information sent with requests
 * - Permissions-Policy: Restricts browser features and APIs
 * - Strict-Transport-Security (HSTS): Enforces HTTPS connections
 * 
 * Score Target: A+ on https://securityheaders.com
 */

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Security headers configuration
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: Only allow resources from same origin
              "default-src 'self'",
              
              // Scripts: Allow self, inline scripts (needed for Framer), and trusted domains
              // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Framer compatibility
              // In production, consider using nonces or hashes instead
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.framer.com https://*.framerusercontent.com",
              
              // Styles: Allow self and inline styles (needed for Framer Motion)
              "style-src 'self' 'unsafe-inline' https://*.framer.com https://*.framerusercontent.com",
              
              // Images: Allow self, data URIs, HTTPS, and Spotify CDN
              "img-src 'self' data: https: https://i.scdn.co https://*.spotifycdn.com https://*.scdn.co",
              
              // Fonts: Allow self, data URIs, and Framer domains
              "font-src 'self' data: https://*.framer.com https://*.framerusercontent.com",
              
              // Connect: API calls allowed to Spotify, Vercel, and Framer
              "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.vercel.app https://*.framer.com",
              
              // Frame ancestors: Prevent embedding in iframes (anti-clickjacking)
              "frame-ancestors 'none'",
              
              // Base URI: Restrict base tag to same origin
              "base-uri 'self'",
              
              // Form actions: Only allow form submissions to same origin
              "form-action 'self'",
              
              // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            // X-Frame-Options: Prevent clickjacking by blocking iframe embedding
            // DENY = Cannot be embedded in any iframe
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            // X-Content-Type-Options: Prevent MIME type sniffing
            // Forces browser to respect Content-Type header
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            // Referrer-Policy: Control referrer information
            // strict-origin-when-cross-origin = Send full URL for same-origin, only origin for cross-origin HTTPS
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Permissions-Policy: Disable unnecessary browser features
            // Reduces attack surface by blocking unused APIs
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
          },
          {
            // X-XSS-Protection: Enable browser's XSS filter (legacy but still useful)
            // 1; mode=block = Enable XSS filter and block page if attack detected
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            // Strict-Transport-Security (HSTS): Force HTTPS connections
            // max-age=31536000 = Remember for 1 year
            // includeSubDomains = Apply to all subdomains
            // Only applies in production (Vercel automatically adds in production)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            // X-DNS-Prefetch-Control: Enable DNS prefetching for better performance
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  },

  // Environment-specific configurations
  env: {
    // Make environment type available to client-side code
    NEXT_PUBLIC_ENV: process.env.NODE_ENV || 'development'
  }
};

export default nextConfig;
