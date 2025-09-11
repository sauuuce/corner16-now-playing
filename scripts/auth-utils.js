const fs = require('fs');
const path = require('path');

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

/**
 * Validates required environment variables
 * @returns {Object} Environment variables
 */
function validateEnv() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Missing required environment variables: SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET');
    console.error('Please create a .env file with your Spotify credentials.');
    process.exit(1);
  }
  
  return { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET };
}

/**
 * Generates Spotify authorization URL
 * @param {string} clientId - Spotify client ID
 * @param {string} redirectUri - Redirect URI
 * @param {string} scopes - Space-separated list of scopes
 * @returns {string} Authorization URL
 */
function generateAuthUrl(clientId, redirectUri, scopes = 'user-read-currently-playing user-read-playback-state') {
  return `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: 'true'
  })}`;
}

/**
 * Exchanges authorization code for tokens
 * @param {string} code - Authorization code
 * @param {string} redirectUri - Redirect URI used in authorization
 * @param {Object} credentials - Client credentials
 * @returns {Promise<Object>} Token response
 */
async function exchangeCodeForToken(code, redirectUri, credentials) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = credentials;
  
  try {
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
    
    return data;
  } catch (error) {
    throw new Error(`Error exchanging code for token: ${error.message}`);
  }
}

/**
 * Validates a refresh token by attempting to get an access token
 * @param {string} refreshToken - Refresh token to validate
 * @param {Object} credentials - Client credentials
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
async function validateRefreshToken(refreshToken, credentials) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = credentials;
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Updates or creates .env.local file with refresh token
 * @param {string} refreshToken - Refresh token to save
 * @param {string} envFile - Path to env file (default: .env.local)
 */
function saveRefreshToken(refreshToken, envFile = '.env.local') {
  const envPath = path.resolve(process.cwd(), envFile);
  let envContent = '';
  
  // Read existing env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add SPOTIFY_REFRESH_TOKEN
  const lines = envContent.split('\n');
  const tokenLineIndex = lines.findIndex(line => line.startsWith('SPOTIFY_REFRESH_TOKEN='));
  
  if (tokenLineIndex >= 0) {
    lines[tokenLineIndex] = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`;
  } else {
    // Add token at the end, ensuring proper spacing
    if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
      lines.push('');
    }
    lines.push(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
  }
  
  // Write updated content
  fs.writeFileSync(envPath, lines.join('\n'));
  console.log(`\n✅ Refresh token saved to ${envFile}`);
}

/**
 * Displays success message with token and instructions
 * @param {string} refreshToken - Refresh token
 * @param {boolean} saveToFile - Whether to save to file
 */
function displaySuccessMessage(refreshToken, saveToFile = true) {
  console.log('\n✅ SUCCESS! Here\'s your refresh token:\n');
  console.log('='.repeat(80));
  console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
  console.log('='.repeat(80));
  
  if (!saveToFile) {
    console.log('\n📝 Copy the line above and add it to your .env.local file');
  }
  
  console.log('\n🔒 Keep this token secure and never share it publicly!');
  console.log('\n📋 Your complete .env.local should look like:');
  console.log('---');
  console.log('SPOTIFY_CLIENT_ID=your_client_id_here');
  console.log('SPOTIFY_CLIENT_SECRET=your_client_secret_here');
  console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
  console.log('---');
}

/**
 * Displays error message with helpful tips
 * @param {Error} error - Error object
 * @param {string} context - Context of the error
 */
function displayErrorMessage(error, context = 'authorization') {
  console.error(`\n❌ Error during ${context}:`, error.message);
  console.log('\n💡 Troubleshooting tips:');
  
  switch (context) {
    case 'token exchange':
      console.log('1. Make sure you used the authorization code immediately (they expire quickly)');
      console.log('2. Verify you copied the entire code from the URL');
      console.log('3. The code starts after "?code=" in the redirect URL');
      console.log('4. Ensure you\'re using the same redirect URI that you authorized with');
      break;
    case 'server':
      console.log('1. Make sure port 8888 is not already in use');
      console.log('2. Try running with sudo if you get permission errors');
      console.log('3. Check your firewall settings');
      break;
    default:
      console.log('1. Check your internet connection');
      console.log('2. Verify your Spotify app credentials are correct');
      console.log('3. Make sure your redirect URI is registered in your Spotify app');
  }
}

module.exports = {
  validateEnv,
  generateAuthUrl,
  exchangeCodeForToken,
  validateRefreshToken,
  saveRefreshToken,
  displaySuccessMessage,
  displayErrorMessage
};