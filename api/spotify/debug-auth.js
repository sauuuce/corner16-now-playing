/**
 * Debug API to test Spotify authentication step by step
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
    const result = {
      timestamp: new Date().toISOString(),
      status: "testing",
      steps: {}
    };

    // Step 1: Check environment variables
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

    result.steps.environment = {
      client_id_length: SPOTIFY_CLIENT_ID ? SPOTIFY_CLIENT_ID.length : 0,
      client_secret_length: SPOTIFY_CLIENT_SECRET ? SPOTIFY_CLIENT_SECRET.length : 0,
      refresh_token_length: SPOTIFY_REFRESH_TOKEN ? SPOTIFY_REFRESH_TOKEN.length : 0,
      all_present: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET && SPOTIFY_REFRESH_TOKEN)
    };

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
      result.status = "failed";
      result.error = "Missing environment variables";
      return res.status(500).json(result);
    }

    // Step 2: Test Basic Auth header creation
    try {
      const authString = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
      const authHeader = Buffer.from(authString).toString("base64");
      result.steps.auth_header = {
        auth_string_length: authString.length,
        base64_length: authHeader.length,
        success: true
      };
    } catch (error) {
      result.steps.auth_header = {
        success: false,
        error: error.message
      };
    }

    // Step 3: Test URLSearchParams for token request
    try {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: SPOTIFY_REFRESH_TOKEN
      });
      result.steps.url_params = {
        success: true,
        params_string_length: params.toString().length
      };
    } catch (error) {
      result.steps.url_params = {
        success: false,
        error: error.message
      };
    }

    // Step 4: Test Spotify token endpoint connectivity (without auth)
    try {
      const testResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "HEAD"
      });
      result.steps.spotify_connectivity = {
        success: true,
        status: testResponse.status,
        headers: Object.fromEntries(testResponse.headers.entries())
      };
    } catch (error) {
      result.steps.spotify_connectivity = {
        success: false,
        error: error.message
      };
    }

    // Step 5: Attempt actual token refresh
    try {
      const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
      });

      result.steps.token_request = {
        success: tokenResponse.ok,
        status: tokenResponse.status,
        status_text: tokenResponse.statusText
      };

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        result.steps.token_response = {
          has_access_token: !!tokenData.access_token,
          access_token_length: tokenData.access_token ? tokenData.access_token.length : 0,
          token_type: tokenData.token_type || "not provided",
          expires_in: tokenData.expires_in || "not provided"
        };

        // Step 6: Test Spotify API call with token
        if (tokenData.access_token) {
          try {
            const apiResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            });

            result.steps.api_request = {
              success: true,
              status: apiResponse.status,
              status_text: apiResponse.statusText,
              content_length: apiResponse.headers.get('content-length') || 'unknown'
            };

            if (apiResponse.status === 200) {
              const apiData = await apiResponse.json();
              result.steps.api_response = {
                is_playing: apiData.is_playing,
                has_item: !!apiData.item,
                item_type: apiData.item?.type || 'no item',
                track_name: apiData.item?.name || 'no track name'
              };
            } else if (apiResponse.status === 204) {
              result.steps.api_response = {
                message: "No content - nothing currently playing"
              };
            }

          } catch (error) {
            result.steps.api_request = {
              success: false,
              error: error.message
            };
          }
        }

      } else {
        // Try to get error details
        try {
          const errorData = await tokenResponse.text();
          result.steps.token_error = {
            error_text: errorData
          };
        } catch (e) {
          result.steps.token_error = {
            error: "Could not read error response"
          };
        }
      }

    } catch (error) {
      result.steps.token_request = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }

    result.status = "completed";
    return res.status(200).json(result);

  } catch (error) {
    console.error("Auth debug error:", error);

    return res.status(500).json({
      error: "Auth debug failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
