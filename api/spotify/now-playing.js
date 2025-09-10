const { corsMiddleware } = require('../../utils/cors');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// Validate required environment variables
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  const missing = [];
  if (!SPOTIFY_CLIENT_ID) missing.push("SPOTIFY_CLIENT_ID");
  if (!SPOTIFY_CLIENT_SECRET) missing.push("SPOTIFY_CLIENT_SECRET");
  if (!SPOTIFY_REFRESH_TOKEN) missing.push("SPOTIFY_REFRESH_TOKEN");

  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing";

async function getAccessToken(retryCount = 0) {
  const maxRetries = 2;

  try {
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
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();

      if (response.status === 400) {
        throw new Error(
          "Invalid refresh token - please re-authorize your Spotify account",
        );
      } else if (response.status === 401) {
        throw new Error(
          "Invalid client credentials - check your Spotify app configuration",
        );
      } else if (response.status >= 500 && retryCount < maxRetries) {
        console.log(
          `Spotify token service temporarily unavailable, retrying... (${retryCount + 1}/${maxRetries})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
        );
        return getAccessToken(retryCount + 1);
      }

      throw new Error(`Token refresh failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to Spotify - network error");
    }
    throw error;
  }
}

async function getNowPlaying(retryCount = 0) {
  const maxRetries = 2;

  try {
    const { access_token } = await getAccessToken();

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // 204 = No content (nothing playing), this is normal
    if (response.status === 204) {
      return { is_playing: false };
    }

    // Handle client errors (400-499)
    if (response.status >= 400 && response.status < 500) {
      if (response.status === 401) {
        throw new Error("Spotify access token expired - authentication issue");
      } else if (response.status === 403) {
        throw new Error("Insufficient Spotify permissions - check app scopes");
      } else if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "1";
        throw new Error(
          `Spotify rate limit exceeded - retry after ${retryAfter}s`,
        );
      }
      throw new Error(`Spotify API client error: ${response.status}`);
    }

    // Handle server errors (500+) with retry logic
    if (response.status >= 500) {
      if (retryCount < maxRetries) {
        console.log(
          `Spotify API server error ${response.status}, retrying... (${retryCount + 1}/${maxRetries})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
        );
        return getNowPlaying(retryCount + 1);
      }
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

    return {
      is_playing: true,
      progress_ms: data.progress_ms || 0,
      item: {
        name: data.item.name || "Unknown Track",
        artists: data.item.artists?.map((artist) => artist.name) || [
          "Unknown Artist",
        ],
        duration_ms: data.item.duration_ms || 0,
        album: {
          name: data.item.album?.name || "Unknown Album",
          images: data.item.album?.images || [],
        },
        external_urls: data.item.external_urls || {},
      },
    };
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to Spotify - network error");
    }
    throw error;
  }
}

export default async function handler(req, res) {
  // Apply secure CORS middleware
  corsMiddleware(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const nowPlaying = await getNowPlaying();

    // Set cache control
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");

    return res.status(200).json(nowPlaying);
  } catch (error) {
    console.error("Error fetching now playing:", error.message);
    return res.status(500).json({
      error: "Failed to fetch now playing",
      is_playing: false,
    });
  }
}
