/**
 * API Response Validation Schemas
 * Defines schemas for API responses sent to clients
 */

import { z } from 'zod';

/**
 * Base error response schema
 * Ensures consistent error formatting across all endpoints
 */
export const errorResponseSchema = z.object({
  error: z.string().min(1, 'Error message is required'),
  message: z.string().optional(),
  details: z.unknown().optional(),
  hint: z.string().optional(),
  is_playing: z.literal(false).optional(), // For compatibility with now-playing responses
});

/**
 * Validation error response schema (400 errors)
 */
export const validationErrorResponseSchema = z.object({
  error: z.literal('Validation failed'),
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
  })),
  is_playing: z.literal(false).optional(),
});

/**
 * Not playing response schema
 */
export const notPlayingResponseSchema = z.object({
  is_playing: z.literal(false),
});

/**
 * Now playing response schema (when music is playing)
 */
export const nowPlayingResponseSchema = z.object({
  is_playing: z.literal(true),
  progress_ms: z.number().int().nonnegative(),
  currently_playing_type: z.enum(['track', 'episode', 'ad', 'unknown']).optional(),
  item: z.object({
    name: z.string().min(1),
    artists: z.array(z.string().min(1)).min(1),
    duration_ms: z.number().int().positive(),
    album: z.object({
      name: z.string().min(1),
      images: z.array(z.object({
        url: z.string().url(),
        height: z.number().int().positive().nullable(),
        width: z.number().int().positive().nullable(),
      })),
    }),
    external_urls: z.object({
      spotify: z.string().url().optional(),
    }).optional(),
    id: z.string().nullable().optional(),
    type: z.string().optional(),
  }),
});

/**
 * Combined now playing response (either playing or not playing)
 */
export const spotifyNowPlayingApiResponseSchema = z.union([
  nowPlayingResponseSchema,
  notPlayingResponseSchema,
]);

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;
export type NotPlayingResponse = z.infer<typeof notPlayingResponseSchema>;
export type NowPlayingResponse = z.infer<typeof nowPlayingResponseSchema>;
export type SpotifyNowPlayingApiResponse = z.infer<typeof spotifyNowPlayingApiResponseSchema>;

/**
 * Helper function to create consistent validation error responses
 */
export function createValidationErrorResponse(errors: z.ZodError): ValidationErrorResponse {
  return {
    error: 'Validation failed',
    message: 'Request validation failed. Please check the provided data.',
    details: errors.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
    is_playing: false,
  };
}

/**
 * Helper function to create consistent error responses
 */
export function createErrorResponse(
  error: string,
  message?: string,
  details?: unknown,
  hint?: string
): ErrorResponse {
  return {
    error,
    message,
    details,
    hint,
    is_playing: false,
  };
}
