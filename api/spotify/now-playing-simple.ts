/**
 * Simplified TypeScript Spotify API based on working JavaScript debug version
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// Validate required environment variables
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  const missing = [];
  if (!SPOTIFY_CLIENT_ID) missing.push("SPOTIFY_CLIENT_ID");
  if (!SPOTIFY_CLIENT_SECRET) missing.push("SPOTIFY_CLIENT_SECRET");
  if (!SPOTIFY_REFRESH_TOKEN) missing.push("SPOTIFY_REFRESH_TOKEN");

  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

async function getAccessToken(): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN!,
    }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Invalid refresh token - please re-authorize your Spotify account");
    } else if (response.status === 401) {
      throw new Error("Invalid client credentials - check your Spotify app configuration");
    }
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getNowPlaying() {
  try {
    const access_token = await getAccessToken();

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
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
        throw new Error("Spotify rate limit exceeded - retry later");
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

    if (!data.is_playing) {
      return { is_playing: false };
    }

    // Validate response structure
    if (!data.item) {
      console.warn("Spotify API returned playing=true but no item data");
      return { is_playing: false };
    }

    // Check if item is a track (not an episode/podcast)
    if (data.item.type === "track") {
      const track = data.item;
      return {
        is_playing: true,
        progress_ms: data.progress_ms || 0,
        item: {
          name: track.name || "Unknown Track",
          artists: track.artists?.map((artist: any) => artist.name) || ["Unknown Artist"],
          duration_ms: track.duration_ms || 0,
          album: {
            name: track.album?.name || "Unknown Album",
            images: track.album?.images || [],
          },
          external_urls: track.external_urls || {},
        },
      };
    } else {
      // For episodes/podcasts, return not playing
      return { is_playing: false };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to Spotify - network error");
    }
    throw error;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  // Set CORS headers directly
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

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const nowPlaying = await getNowPlaying();

    // Set cache control
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");

    return res.status(200).json(nowPlaying);
  } catch (error) {
    console.error("Error fetching now playing:", error instanceof Error ? error.message : "Unknown error");
    return res.status(500).json({
      error: "Failed to fetch now playing",
      is_playing: false,
    });
  }
}
