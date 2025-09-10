// Simple test script to verify the Spotify API works locally
require('dotenv').config({ path: '.env.local' });

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function getAccessToken() {
  console.log('🔄 Getting access token...');
  
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

  const data = await response.json();
  console.log('✅ Access token obtained successfully');
  return data;
}

async function getNowPlaying() {
  console.log('🎵 Fetching now playing...');
  
  const { access_token } = await getAccessToken();

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.status === 204 || response.status > 400) {
    console.log('📻 Nothing is currently playing');
    return { is_playing: false };
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.is_playing) {
    console.log('⏸️  Music is paused');
    return { is_playing: false };
  }

  console.log(`🎶 Now playing: ${data.item.name} by ${data.item.artists.map(a => a.name).join(', ')}`);
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

async function testAPI() {
  console.log('🧪 Testing Spotify Now Playing API...\n');
  
  console.log('📋 Environment check:');
  console.log(`CLIENT_ID: ${SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`CLIENT_SECRET: ${SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`REFRESH_TOKEN: ${SPOTIFY_REFRESH_TOKEN ? '✅ Set' : '❌ Missing'}\n`);
  
  try {
    const result = await getNowPlaying();
    
    console.log('\n📤 API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🎉 API test completed successfully!');
    console.log('🚀 Ready to deploy to Vercel!');
    
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Spotify is open and playing music');
    console.log('2. Verify your refresh token is still valid');
    console.log('3. Check that your Spotify app has the correct scopes');
  }
}

testAPI();