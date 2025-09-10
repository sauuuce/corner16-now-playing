require('dotenv').config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

async function testAuth() {
  try {
    console.log('🔄 Testing Spotify API authentication...\n');
    
    // Test token refresh
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });
    
    console.log('Token refresh status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Token refresh failed:', error);
      return;
    }
    
    const tokenData = await response.json();
    console.log('✅ Token refresh successful!\n');
    
    // Test now playing API
    console.log('🎵 Testing Now Playing API...');
    const nowPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    console.log('Now Playing API status:', nowPlayingResponse.status);
    
    if (nowPlayingResponse.status === 204) {
      console.log('✅ API working perfectly! No music currently playing (this is normal when nothing is playing)');
    } else if (nowPlayingResponse.status === 200) {
      console.log('✅ Music is playing!');
      const data = await nowPlayingResponse.json();
      console.log('🎶 Currently playing:', data.item?.name, 'by', data.item?.artists?.map(a => a.name).join(', '));
    } else {
      const errorText = await nowPlayingResponse.text();
      console.error('❌ Now Playing API error:', nowPlayingResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();