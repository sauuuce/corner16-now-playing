/**
 * API Request Validation Schemas
 * Validates incoming HTTP requests to the Spotify Now Playing API
 */

import { z } from 'zod';

/**
 * HTTP method validation schema
 * Only GET and OPTIONS methods are allowed
 */
export const httpMethodSchema = z.enum(['GET', 'OPTIONS'], {
  errorMap: () => ({ message: 'Method not allowed. Only GET requests are supported.' })
});

/**
 * Query parameter schema for now-playing endpoint
 * Currently no query params are required, but we validate the structure
 */
export const nowPlayingQuerySchema = z.object({
  // Optional cache control override
  cache: z.enum(['enabled', 'disabled']).optional(),
  // Optional format parameter (future use)
  format: z.enum(['json']).optional().default('json'),
}).strict(); // Reject unknown query parameters

/**
 * Headers schema for security validation
 */
export const securityHeadersSchema = z.object({
  'content-type': z.string().optional(),
  'authorization': z.string().optional(),
  'user-agent': z.string().optional(),
  'origin': z.string().optional(),
  'referer': z.string().optional(),
}).passthrough(); // Allow additional headers

/**
 * Complete request validation schema
 */
export const requestSchema = z.object({
  method: httpMethodSchema,
  query: nowPlayingQuerySchema.optional().default({}),
});

export type ValidatedRequest = z.infer<typeof requestSchema>;

/**
 * Validates incoming request and returns parsed data
 * @throws {z.ZodError} If validation fails
 */
export function validateRequest(req: {
  method?: string;
  query?: unknown;
}): ValidatedRequest {
  return requestSchema.parse({
    method: req.method,
    query: req.query || {},
  });
}
