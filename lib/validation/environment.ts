/**
 * Environment Variable Validation Schemas
 * Uses Zod for type-safe environment variable validation
 */

import { z } from 'zod';

/**
 * Schema for Spotify environment variables
 * Ensures all required credentials are present and properly formatted
 */
export const spotifyEnvSchema = z.object({
  SPOTIFY_CLIENT_ID: z
    .string()
    .min(1, 'SPOTIFY_CLIENT_ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'SPOTIFY_CLIENT_ID must contain only alphanumeric characters'),
  
  SPOTIFY_CLIENT_SECRET: z
    .string()
    .min(1, 'SPOTIFY_CLIENT_SECRET is required')
    .regex(/^[a-zA-Z0-9]+$/, 'SPOTIFY_CLIENT_SECRET must contain only alphanumeric characters'),
  
  SPOTIFY_REFRESH_TOKEN: z
    .string()
    .min(1, 'SPOTIFY_REFRESH_TOKEN is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SPOTIFY_REFRESH_TOKEN has invalid format'),
});

export type SpotifyEnv = z.infer<typeof spotifyEnvSchema>;

/**
 * Validates environment variables and returns typed result
 * @throws {z.ZodError} If validation fails
 */
export function validateEnvironment(env: Record<string, string | undefined> = process.env): SpotifyEnv {
  try {
    return spotifyEnvSchema.parse({
      SPOTIFY_CLIENT_ID: env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: env.SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REFRESH_TOKEN: env.SPOTIFY_REFRESH_TOKEN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      
      console.error('Environment validation failed:', messages);
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}
