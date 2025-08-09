const express = require('express');
const app = express();

const SPOTIFY_CLIENT_ID = 'ea6a84cb94eb45dab4d99b30b9676051';
const SPOTIFY_CLIENT_SECRET = '427048c82e8442d3a1689eeccbb668ef';
const REDIRECT_URI = 'http://localhost:8888/callback';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

app.get('/', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  })}`;
  
  res.send(`
    <h1>Spotify Now Playing - Authorization</h1>
    <p>Click the link below to authorize your Spotify account:</p>
    <a href="${authUrl}" target="_blank">Authorize Spotify Access</a>
    <p>After authorization, you'll be redirected back here with your refresh token.</p>
  `);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code not found');
  }
  
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
        redirect_uri: REDIRECT_URI,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
    }
    
    res.send(`
      <h1>Success!</h1>
      <p>Save this refresh token in your environment variables:</p>
      <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
SPOTIFY_REFRESH_TOKEN=${data.refresh_token}
      </pre>
      <p><strong>Important:</strong> Keep this token secure and never share it publicly!</p>
      <p>You can now close this tab and stop the server (Ctrl+C).</p>
      <hr>
      <h3>Complete Environment Variables:</h3>
      <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
SPOTIFY_CLIENT_ID=ea6a84cb94eb45dab4d99b30b9676051
SPOTIFY_CLIENT_SECRET=427048c82e8442d3a1689eeccbb668ef
SPOTIFY_REFRESH_TOKEN=${data.refresh_token}
      </pre>
    `);
    
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

const PORT = 8888;

app.listen(PORT, () => {
  console.log(`🎵 Spotify authorization server running at http://localhost:${PORT}`);
  console.log('📱 Open your browser and navigate to http://localhost:8888 to start the authorization process');
});

// Add fetch polyfill for Node.js versions that don't have it built-in
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}