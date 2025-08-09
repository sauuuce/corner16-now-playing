const express = require('express');
const app = express();

const SPOTIFY_CLIENT_ID = 'ea6a84cb94eb45dab4d99b30b9676051';
const SPOTIFY_CLIENT_SECRET = '427048c82e8442d3a1689eeccbb668ef';

// Use Spotify's standard redirect URI for testing
const REDIRECT_URI = 'https://example.com/callback';
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
    <p><strong>Step 1:</strong> Click the link below to authorize your Spotify account:</p>
    <a href="${authUrl}" target="_blank" style="display: inline-block; background: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 20px 0;">Authorize Spotify Access</a>
    
    <p><strong>Step 2:</strong> After clicking authorize, you'll be redirected to your Spotify dashboard.</p>
    <p><strong>Step 3:</strong> Copy the authorization code from the URL (after "?code=") and paste it below:</p>
    
    <form action="/exchange" method="post" style="margin: 20px 0;">
      <input type="text" name="code" placeholder="Paste authorization code here" style="width: 400px; padding: 10px; margin-right: 10px;" required>
      <button type="submit" style="padding: 10px 20px; background: #1DB954; color: white; border: none; border-radius: 5px;">Get Refresh Token</button>
    </form>
    
    <p><em>The authorization code will look like: AQC7X9Y2Z...</em></p>
  `);
});

app.use(express.urlencoded({ extended: true }));

app.post('/exchange', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).send('Authorization code is required');
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
      <p>Save this refresh token in your Vercel environment variables:</p>
      <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all;">
SPOTIFY_REFRESH_TOKEN=${data.refresh_token}
      </pre>
      <p><strong>Important:</strong> Keep this token secure and never share it publicly!</p>
      <p>You can now close this tab and stop the server (Ctrl+C).</p>
      <hr>
      <h3>Complete Environment Variables for Vercel:</h3>
      <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
SPOTIFY_CLIENT_ID=ea6a84cb94eb45dab4d99b30b9676051
SPOTIFY_CLIENT_SECRET=427048c82e8442d3a1689eeccbb668ef
SPOTIFY_REFRESH_TOKEN=${data.refresh_token}
      </pre>
    `);
    
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send(`
      <h1>Error</h1>
      <p>${error.message}</p>
      <p>Make sure you copied the complete authorization code from the URL.</p>
      <a href="/">Try Again</a>
    `);
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