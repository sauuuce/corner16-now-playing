require('dotenv').config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ Missing required environment variables: SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET');
  console.error('Please create a .env file with your Spotify credentials.');
  process.exit(1);
}

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function exchangeCodeForToken(code, redirectUri) {
  try {
    console.log('🔄 Exchanging authorization code for refresh token...\n');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(data, null, 2)}`);
    }
    
    console.log('✅ SUCCESS! Here\'s your refresh token:\n');
    console.log('=' .repeat(80));
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('=' .repeat(80));
    console.log('\n📝 Copy the line above and add it to your .env.local file');
    console.log('\n🔒 Keep this token secure and never share it publicly!');
    console.log('\n📋 Your complete .env.local should look like:');
    console.log('---');
    console.log('SPOTIFY_CLIENT_ID=your_client_id_here');
    console.log('SPOTIFY_CLIENT_SECRET=your_client_secret_here');
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('---');
    
  } catch (error) {
    console.error('❌ Error exchanging code for token:', error.message);
    console.log('\n💡 Make sure you:');
    console.log('1. Used the authorization code immediately (they expire quickly)');
    console.log('2. Copied the entire code from the URL');
    console.log('3. The code starts after "?code=" in the redirect URL');
    console.log('4. Used the same redirect URI that you authorized with');
  }
}

// Get arguments
const code = process.argv[2];
const redirectUri = process.argv[3];

if (!code) {
  console.log('❌ No authorization code provided!');
  console.log('\nUsage: node scripts/exchange-token-flexible.js YOUR_CODE_HERE REDIRECT_URI');
  console.log('\nExample: node scripts/exchange-token-flexible.js AQC123... http://localhost:3000/callback');
  console.log('\nFirst run: npm run auth-manual');
  process.exit(1);
}

if (!redirectUri) {
  console.log('❌ No redirect URI provided!');
  console.log('\nUsage: node scripts/exchange-token-flexible.js YOUR_CODE_HERE REDIRECT_URI');
  console.log('\nExample: node scripts/exchange-token-flexible.js AQC123... http://localhost:3000/callback');
  process.exit(1);
}

exchangeCodeForToken(code, redirectUri);