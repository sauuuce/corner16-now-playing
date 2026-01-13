/**
 * Spotify API Response Validation Schemas
 * Validates responses from Spotify Web API endpoints
 */

import { z } from 'zod';

/**
 * Spotify image object schema
 */
const spotifyImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  height: z.number().int().positive().nullable(),
  width: z.number().int().positive().nullable(),
});

/**
 * Spotify artist object schema (simplified)
 */
const spotifyArtistSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
  id: z.string().optional(),
  uri: z.string().optional(),
  external_urls: z.object({
    spotify: z.string().url().optional(),
  }).optional(),
});

/**
 * Spotify album object schema (simplified)
 */
const spotifyAlbumSchema = z.object({
  name: z.string().min(1, 'Album name is required'),
  id: z.string().optional(),
  images: z.array(spotifyImageSchema).default([]),
  release_date: z.string().optional(),
  uri: z.string().optional(),
});

/**
 * Spotify track object schema
 */
const spotifyTrackSchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
  name: z.string().min(1, 'Track name is required'),
  type: z.literal('track'),
  duration_ms: z.number().int().positive('Duration must be positive'),
  artists: z.array(spotifyArtistSchema).min(1, 'At least one artist is required'),
  album: spotifyAlbumSchema,
  external_urls: z.object({
    spotify: z.string().url().optional(),
  }).optional(),
  uri: z.string().optional(),
  is_local: z.boolean().optional(),
  explicit: z.boolean().optional(),
});

/**
 * Currently playing context schema
 */
const spotifyContextSchema = z.object({
  type: z.enum(['album', 'artist', 'playlist', 'show']).optional(),
  uri: z.string().optional(),
  external_urls: z.object({
    spotify: z.string().url().optional(),
  }).optional(),
}).optional();

/**
 * Spotify currently playing response schema
 * Validates the response from /v1/me/player/currently-playing
 */
export const spotifyCurrentlyPlayingSchema = z.object({
  is_playing: z.boolean(),
  currently_playing_type: z.enum(['track', 'episode', 'ad', 'unknown']).optional(),
  progress_ms: z.number().int().nonnegative().optional().nullable(),
  timestamp: z.number().int().positive().optional(),
  context: spotifyContextSchema,
  item: z.union([spotifyTrackSchema, z.null()]).optional(),
});

/**
 * Spotify token response schema
 * Validates the response from token endpoint
 */
export const spotifyTokenResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive('Expires in must be positive'),
  scope: z.string().optional(),
  refresh_token: z.string().optional(),
});

/**
 * Spotify error response schema
 */
export const spotifyErrorResponseSchema = z.object({
  error: z.object({
    status: z.number().int(),
    message: z.string(),
  }),
});

export type SpotifyCurrentlyPlaying = z.infer<typeof spotifyCurrentlyPlayingSchema>;
export type SpotifyTokenResponse = z.infer<typeof spotifyTokenResponseSchema>;
export type SpotifyErrorResponse = z.infer<typeof spotifyErrorResponseSchema>;

/**
 * Validates Spotify currently playing response
 * @throws {z.ZodError} If validation fails
 */
export function validateSpotifyResponse(data: unknown): SpotifyCurrentlyPlaying {
  return spotifyCurrentlyPlayingSchema.parse(data);
}

/**
 * Validates Spotify token response
 * @throws {z.ZodError} If validation fails
 */
export function validateTokenResponse(data: unknown): SpotifyTokenResponse {
  return spotifyTokenResponseSchema.parse(data);
}

/**
 * Safe parse that returns error details instead of throwing
 */
export function safeValidateSpotifyResponse(data: unknown) {
  return spotifyCurrentlyPlayingSchema.safeParse(data);
}

/**
 * Safe parse for token response
 */
export function safeValidateTokenResponse(data: unknown) {
  return spotifyTokenResponseSchema.safeParse(data);
}
