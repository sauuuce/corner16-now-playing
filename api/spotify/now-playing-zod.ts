/**
 * Spotify Now Playing API - With Zod Validation
 * 
 * This version implements comprehensive input/output validation using Zod:
 * - Environment variables validation
 * - HTTP request validation
 * - Spotify API response validation
 * - Consistent error response format
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { 
  validateEnvironment,
  validateRequest,
  validateTokenResponse,
  safeValidateSpotifyResponse,
  createValidationErrorResponse,
  createErrorResponse,
  type SpotifyNowPlayingApiResponse,
} from "../../lib/validation";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

/**
 * Get access token from Spotify using refresh token
 * Validates the response using Zod
 */
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Token refresh error:", errorData);
      throw new Error(
        "Invalid refresh token - please re-authorize your Spotify account"
      );
    }
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  
  // Validate token response with Zod
  try {
    const validatedToken = validateTokenResponse(data);
    return validatedToken.access_token;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Token response validation failed:", error.errors);
      throw new Error("Invalid token response from Spotify");
    }
    throw error;
  }
}

/**
 * Get currently playing track from Spotify
 * Validates the response using Zod
 */
async function getNowPlaying(accessToken: string): Promise<SpotifyNowPlayingApiResponse> {
  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 204 = No content (nothing playing), this is normal
  if (response.status === 204) {
    return { is_playing: false };
  }

  // Handle client errors
  if (response.status >= 400 && response.status < 500) {
    if (response.status === 401) {
      throw new Error("Spotify access token expired - authentication issue");
    } else if (response.status === 403) {
      throw new Error("Insufficient Spotify permissions - check app scopes");
    } else if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") || "60";
      throw new Error(`Rate limited - retry after ${retryAfter} seconds`);
    }
    throw new Error(`Spotify API client error: ${response.status}`);
  }

  // Handle server errors
  if (response.status >= 500) {
    throw new Error("Spotify API temporarily unavailable");
  }

  if (!response.ok) {
    throw new Error(`Unexpected Spotify API error: ${response.status}`);
  }

  const data = await response.json();

  // Validate Spotify API response with Zod
  const validationResult = safeValidateSpotifyResponse(data);
  
  if (!validationResult.success) {
    console.error("Spotify response validation failed:", validationResult.error.errors);
    console.warn("Invalid Spotify API response structure, returning safe default");
    return { is_playing: false };
  }

  const validatedData = validationResult.data;

  // Handle not playing
  if (!validatedData.is_playing || !validatedData.item) {
    return { is_playing: false };
  }

  // Check if item is a track (not an episode/podcast)
  if (validatedData.item.type === "track") {
    const track = validatedData.item;
    
    // Return validated and transformed response
    return {
      is_playing: true,
      progress_ms: validatedData.progress_ms || 0,
      currently_playing_type: validatedData.currently_playing_type,
      item: {
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
        duration_ms: track.duration_ms,
        album: {
          name: track.album.name,
          images: track.album.images,
        },
        external_urls: track.external_urls,
        id: track.id,
        type: track.type,
      },
    };
  }

  // For episodes/podcasts, return not playing
  return { is_playing: false };
}

/**
 * Main API handler with Zod validation
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Set CORS and security headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Validate request using Zod
    validateRequest({
      method: req.method,
      query: req.query,
    });

    // Validate environment variables using Zod
    const env = validateEnvironment(process.env as Record<string, string | undefined>);

    // Get access token
    const accessToken = await getAccessToken(
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_CLIENT_SECRET,
      env.SPOTIFY_REFRESH_TOKEN
    );

    // Get currently playing track
    const nowPlaying = await getNowPlaying(accessToken);

    // Set cache control headers
    if (nowPlaying.is_playing) {
      res.setHeader("Cache-Control", "s-maxage=5, stale-while-revalidate");
    } else {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    }

    return res.status(200).json(nowPlaying);
  } catch (error) {
    // Handle Zod validation errors (400 - Bad Request)
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      const validationError = createValidationErrorResponse(error);
      return res.status(400).json(validationError);
    }

    // Handle other errors (500 - Internal Server Error)
    if (error instanceof Error) {
      console.error("API error:", error.message);

      // Network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return res.status(500).json(
          createErrorResponse(
            "Network error",
            "Unable to connect to Spotify API",
            undefined,
            "Check your internet connection and try again"
          )
        );
      }

      // Authentication errors
      if (error.message.includes("authentication") || error.message.includes("refresh token")) {
        return res.status(500).json(
          createErrorResponse(
            "Authentication failed",
            error.message,
            undefined,
            process.env.NODE_ENV !== "production"
              ? "Run npm run spotify-auth to refresh credentials"
              : undefined
          )
        );
      }

      // Rate limiting errors
      if (error.message.includes("Rate limited")) {
        const retryMatch = error.message.match(/retry after (\d+)/);
        const retryAfter = retryMatch && retryMatch[1] ? retryMatch[1] : "60";
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json(
          createErrorResponse(
            "Rate limited",
            error.message,
            { retryAfter: parseInt(retryAfter, 10) }
          )
        );
      }

      // Generic error with message
      return res.status(500).json(
        createErrorResponse(
          "Failed to fetch now playing",
          error.message
        )
      );
    }

    // Unknown error
    console.error("Unknown error:", error);
    return res.status(500).json(
      createErrorResponse("Failed to fetch now playing")
    );
  }
}
