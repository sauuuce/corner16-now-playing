const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

async function getAccessToken() {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

async function getNowPlaying() {
  const { access_token } = await getAccessToken();

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.status === 204 || response.status > 400) {
    return { is_playing: false };
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.is_playing) {
    return { is_playing: false };
  }

  return {
    is_playing: true,
    progress_ms: data.progress_ms,
    item: {
      name: data.item.name,
      artists: data.item.artists.map(artist => artist.name),
      duration_ms: data.item.duration_ms,
      album: {
        name: data.item.album.name,
        images: data.item.album.images,
      },
      external_urls: data.item.external_urls,
    },
  };
}

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const nowPlaying = await getNowPlaying();
    
    // Set cache control
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    
    return res.status(200).json(nowPlaying);
  } catch (error) {
    console.error('Error fetching now playing:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      env_check: {
        has_client_id: !!SPOTIFY_CLIENT_ID,
        has_client_secret: !!SPOTIFY_CLIENT_SECRET,
        has_refresh_token: !!SPOTIFY_REFRESH_TOKEN,
        client_id_length: SPOTIFY_CLIENT_ID?.length,
        client_secret_length: SPOTIFY_CLIENT_SECRET?.length,
        refresh_token_length: SPOTIFY_REFRESH_TOKEN?.length,
      }
    });
    return res.status(500).json({ 
      error: 'Failed to fetch now playing',
      is_playing: false,
      debug: {
        message: error.message,
        has_client_id: !!SPOTIFY_CLIENT_ID,
        has_client_secret: !!SPOTIFY_CLIENT_SECRET,
        has_refresh_token: !!SPOTIFY_REFRESH_TOKEN,
        client_id_length: SPOTIFY_CLIENT_ID?.length,
        client_secret_length: SPOTIFY_CLIENT_SECRET?.length,
        refresh_token_length: SPOTIFY_REFRESH_TOKEN?.length,
      }
    });
  }
}