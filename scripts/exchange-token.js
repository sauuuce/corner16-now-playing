const SPOTIFY_CLIENT_ID = 'ea6a84cb94eb45dab4d99b30b9676051';
const SPOTIFY_CLIENT_SECRET = '427048c82e8442d3a1689eeccbb668ef';
const REDIRECT_URI = 'https://developer.spotify.com/callback';

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function exchangeCodeForToken(code) {
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
        redirect_uri: REDIRECT_URI,
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
    console.log('SPOTIFY_CLIENT_ID=ea6a84cb94eb45dab4d99b30b9676051');
    console.log('SPOTIFY_CLIENT_SECRET=427048c82e8442d3a1689eeccbb668ef');
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('---');
    
  } catch (error) {
    console.error('❌ Error exchanging code for token:', error.message);
    console.log('\n💡 Make sure you:');
    console.log('1. Used the authorization code immediately (they expire quickly)');
    console.log('2. Copied the entire code from the URL');
    console.log('3. The code starts after "?code=" in the redirect URL');
  }
}

// Get the authorization code from command line arguments
const code = process.argv[2];

if (!code) {
  console.log('❌ No authorization code provided!');
  console.log('\nUsage: node scripts/exchange-token.js YOUR_CODE_HERE');
  console.log('\nFirst run: node scripts/manual-auth.js');
  process.exit(1);
}

exchangeCodeForToken(code);