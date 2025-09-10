/**
 * Minimal debug API to isolate runtime errors
 */

module.exports = async (req, res) => {
  // Set basic headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Basic environment check
    const env = {
      node_version: process.version,
      spotify_client_id: !!process.env.SPOTIFY_CLIENT_ID,
      spotify_client_secret: !!process.env.SPOTIFY_CLIENT_SECRET,
      spotify_refresh_token: !!process.env.SPOTIFY_REFRESH_TOKEN,
      vercel_env: process.env.VERCEL_ENV
    };

    // Test 1: Basic response
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env
    };

    // Test 2: Try Buffer (used in auth)
    try {
      const testAuth = Buffer.from("test:test").toString("base64");
      response.buffer_test = "success";
    } catch (error) {
      response.buffer_test = `failed: ${error.message}`;
    }

    // Test 3: Try URLSearchParams (used in token request)
    try {
      const testParams = new URLSearchParams({ test: "value" });
      response.url_params_test = "success";
    } catch (error) {
      response.url_params_test = `failed: ${error.message}`;
    }

    // Test 4: Basic fetch test (without auth)
    try {
      const testFetch = await fetch("https://httpbin.org/status/200", {
        method: "GET",
        headers: { "User-Agent": "Vercel-Debug" }
      });
      response.fetch_test = `success: ${testFetch.status}`;
    } catch (error) {
      response.fetch_test = `failed: ${error.message}`;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("Minimal debug error:", error);

    return res.status(500).json({
      error: "Debug failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
