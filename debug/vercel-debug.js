require('dotenv').config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

async function getAccessToken() {
  console.log('🔄 Getting access token...');
  console.log('Client ID length:', SPOTIFY_CLIENT_ID?.length);
  console.log('Client Secret length:', SPOTIFY_CLIENT_SECRET?.length);
  console.log('Refresh Token length:', SPOTIFY_REFRESH_TOKEN?.length);
  
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

  console.log('Token response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Token refresh failed:', response.status, errorText);
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Token refresh successful, access token length:', data.access_token?.length);
  return data;
}

async function getNowPlaying() {
  try {
    const { access_token } = await getAccessToken();

    console.log('🎵 Calling Spotify now playing API...');
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log('Now playing response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 204 || response.status > 400) {
      console.log('ℹ️ No music playing or API error, returning is_playing: false');
      return { is_playing: false };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Spotify API error:', response.status, errorText);
      throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got data from Spotify API');
    console.log('Is playing:', data.is_playing);
    console.log('Item present:', !!data.item);
    
    if (!data.is_playing) {
      console.log('ℹ️ Music not playing according to response');
      return { is_playing: false };
    }

    console.log('🎶 Processing track data...');
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
    
  } catch (error) {
    console.error('💥 Error in getNowPlaying:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Simulate the Vercel handler
async function simulateVercelHandler() {
  try {
    console.log('🚀 Starting Vercel handler simulation...\n');
    
    const nowPlaying = await getNowPlaying();
    
    console.log('\n✅ Handler would return 200 with:');
    console.log(JSON.stringify(nowPlaying, null, 2));
    
  } catch (error) {
    console.error('\n❌ Handler would return 500 with error:', error.message);
    console.log('Error response:', JSON.stringify({ 
      error: 'Failed to fetch now playing',
      is_playing: false 
    }, null, 2));
  }
}

simulateVercelHandler();