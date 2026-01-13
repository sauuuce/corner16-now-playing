/**
 * Environment Validation Middleware with Zod
 * Validates environment variables before processing API requests
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { validateEnvironment, type SpotifyEnv } from '../lib/validation/environment';
import { createErrorResponse } from '../lib/validation/response';

/**
 * Extended request type with validated environment
 */
export interface ValidatedRequest extends VercelRequest {
  validatedEnv: SpotifyEnv;
}

/**
 * Handler type that expects validated environment
 */
export type ValidatedHandler = (
  req: ValidatedRequest,
  res: VercelResponse
) => Promise<VercelResponse | void> | VercelResponse | void;

/**
 * Middleware wrapper that validates environment variables using Zod
 * before passing control to the actual handler
 * 
 * @param handler - The API handler to wrap
 * @returns Wrapped handler with environment validation
 */
export function withEnvValidation(handler: ValidatedHandler) {
  return async (req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> => {
    try {
      // Validate environment variables using Zod
      const validatedEnv = validateEnvironment(process.env as Record<string, string | undefined>);
      
      // Attach validated environment to request
      (req as ValidatedRequest).validatedEnv = validatedEnv;
      
      // Call the actual handler
      return await handler(req as ValidatedRequest, res);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        console.error('Environment validation failed:', error.errors);
        
        return res.status(500).json(
          createErrorResponse(
            'Server configuration error',
            'Required environment variables are missing or invalid',
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            process.env.NODE_ENV !== 'production' 
              ? 'Please check your .env file and ensure all Spotify credentials are set'
              : undefined
          )
        );
      }
      
      // Handle other errors
      if (error instanceof Error) {
        console.error('Environment validation error:', error.message);
        
        return res.status(500).json(
          createErrorResponse(
            'Server configuration error',
            error.message,
            undefined,
            process.env.NODE_ENV !== 'production'
              ? 'Run npm run spotify-auth to set up credentials'
              : undefined
          )
        );
      }
      
      // Unknown error
      console.error('Unknown environment validation error:', error);
      return res.status(500).json(
        createErrorResponse('Server configuration error')
      );
    }
  };
}

/**
 * Legacy JavaScript version for backwards compatibility
 * @deprecated Use TypeScript version with withEnvValidation instead
 */
export const withEnvValidationLegacy = (handler: Function) => {
  return async (req: any, res: any) => {
    try {
      const validatedEnv = validateEnvironment(process.env as Record<string, string | undefined>);
      req.validatedEnv = validatedEnv;
      return await handler(req, res);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Environment validation failed:', error.message);
        return res.status(500).json({
          error: 'Server configuration error',
          message: error.message,
          is_playing: false,
        });
      }
      
      return res.status(500).json({
        error: 'Server configuration error',
        is_playing: false,
      });
    }
  };
};

// For CommonJS compatibility
module.exports = {
  withEnvValidation,
  withEnvValidationLegacy,
};
