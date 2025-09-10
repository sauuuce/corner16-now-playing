/**
 * Simple test endpoint to debug API and environment issues
 */

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check environment variables
    const envCheck = {
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REFRESH_TOKEN: !!process.env.SPOTIFY_REFRESH_TOKEN,
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV || "not set",
    };

    // Test basic fetch functionality
    let fetchTest = "success";
    try {
      const testResponse = await fetch("https://httpbin.org/json");
      if (!testResponse.ok) {
        fetchTest = `failed: ${testResponse.status}`;
      }
    } catch (error) {
      fetchTest = `error: ${error.message}`;
    }

    // Test Spotify token endpoint (without credentials)
    let spotifyTest = "not tested";
    if (envCheck.SPOTIFY_CLIENT_ID && envCheck.SPOTIFY_CLIENT_SECRET) {
      try {
        const tokenResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "HEAD", // Just test connectivity
          },
        );
        spotifyTest = `connectivity: ${tokenResponse.status}`;
      } catch (error) {
        spotifyTest = `error: ${error.message}`;
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      status: "ok",
      environment: envCheck,
      tests: {
        fetch: fetchTest,
        spotify_connectivity: spotifyTest,
      },
      request_info: {
        method: req.method,
        headers: Object.keys(req.headers),
        url: req.url,
        user_agent: req.headers["user-agent"] || "not provided",
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      error: "Test endpoint failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
