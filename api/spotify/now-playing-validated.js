/**
 * Spotify Now Playing API - With Environment Validation
 * 
 * This version uses the environment validation middleware to ensure
 * all required variables are present before processing requests.
 */

const { withEnvValidation } = require('../../utils/envMiddleware');

/**
 * Main API handler for Spotify Now Playing
 */
async function nowPlayingHandler(req, res) {
  // Set CORS headers
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
    // Get validated environment variables from middleware
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = req.validatedEnv;

    // Get access token
    const authHeader = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
      },
    );

    if (!tokenResponse.ok) {
      console.error(`Token refresh failed: ${tokenResponse.status}`);
      
      // Check if it's an authentication error
      if (tokenResponse.status === 400 || tokenResponse.status === 401) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('Token refresh error:', errorData);
        
        return res.status(500).json({
          error: "Authentication failed",
          message: "Failed to refresh access token. The refresh token may be expired.",
          hint: process.env.NODE_ENV !== 'production' ? "Run 'npm run spotify-auth' to generate a new refresh token" : undefined,
          is_playing: false,
        });
      }
      
      return res.status(500).json({
        error: "Authentication failed",
        is_playing: false,
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("No access token received");
      return res.status(500).json({
        error: "Authentication failed",
        is_playing: false,
      });
    }

    // Get currently playing track
    const apiResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    // Handle 204 - nothing playing (this is normal and expected)
    if (apiResponse.status === 204) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
      return res.status(200).json({ is_playing: false });
    }

    // Handle 401 - Access token expired (shouldn't happen as we just refreshed)
    if (apiResponse.status === 401) {
      console.error("Access token expired immediately after refresh");
      return res.status(500).json({
        error: "Authentication error",
        is_playing: false,
      });
    }

    // Handle rate limiting
    if (apiResponse.status === 429) {
      const retryAfter = apiResponse.headers.get('Retry-After') || '60';
      console.error(`Rate limited. Retry after: ${retryAfter}s`);
      
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: "Rate limited",
        retryAfter: parseInt(retryAfter),
        is_playing: false,
      });
    }

    // Handle other client errors
    if (apiResponse.status >= 400 && apiResponse.status < 500) {
      console.error(`Spotify API client error: ${apiResponse.status}`);
      return res.status(500).json({
        error: "Spotify API error",
        is_playing: false,
      });
    }

    // Handle server errors
    if (apiResponse.status >= 500) {
      console.error(`Spotify API server error: ${apiResponse.status}`);
      return res.status(500).json({
        error: "Spotify API temporarily unavailable",
        is_playing: false,
      });
    }

    if (!apiResponse.ok) {
      console.error(`Unexpected Spotify API error: ${apiResponse.status}`);
      return res.status(500).json({
        error: "Spotify API error",
        is_playing: false,
      });
    }

    const apiData = await apiResponse.json();

    // Handle not playing
    if (!apiData.is_playing) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
      return res.status(200).json({ is_playing: false });
    }

    // Handle missing item data
    if (!apiData.item) {
      console.warn("Spotify API returned playing=true but no item data");
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
      return res.status(200).json({ is_playing: false });
    }

    // Handle podcasts/episodes - return not playing
    if (apiData.item.type !== "track") {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
      return res.status(200).json({ is_playing: false });
    }

    // Extract track data
    const track = apiData.item;
    const nowPlaying = {
      is_playing: true,
      progress_ms: apiData.progress_ms || 0,
      currently_playing_type: apiData.currently_playing_type || "track",
      item: {
        name: track.name || "Unknown Track",
        artists: track.artists?.map((artist) => artist.name) || [
          "Unknown Artist",
        ],
        duration_ms: track.duration_ms || 0,
        album: {
          name: track.album?.name || "Unknown Album",
          images: track.album?.images || [],
        },
        external_urls: track.external_urls || {},
        id: track.id || null,
        type: track.type || "track",
      },
    };

    // Set cache headers - shorter cache when playing
    res.setHeader("Cache-Control", "s-maxage=5, stale-while-revalidate");

    return res.status(200).json(nowPlaying);
  } catch (error) {
    console.error("Spotify API error:", error.message);

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return res.status(500).json({
        error: "Network error connecting to Spotify",
        is_playing: false,
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Failed to fetch now playing",
      is_playing: false,
    });
  }
}

// Export the handler wrapped with environment validation
module.exports = withEnvValidation(nowPlayingHandler);