#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const readline = require('readline');
const {
  validateEnv,
  generateAuthUrl,
  exchangeCodeForToken,
  validateRefreshToken,
  saveRefreshToken,
  displaySuccessMessage,
  displayErrorMessage
} = require('./auth-utils');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || '--server';

// Validate environment variables
const credentials = validateEnv();

// Configuration
const DEFAULT_REDIRECT_URIS = {
  server: 'http://localhost:8888/callback',
  simple: 'https://example.com/callback',
  manual: 'https://developer.spotify.com/callback'
};

const SCOPES = 'user-read-currently-playing user-read-playback-state';
const PORT = 8888;

/**
 * Interactive mode - presents menu and handles user selection
 */
async function interactiveMode() {
  console.log('🎵 Spotify Authentication Tool\n');
  console.log('Select an authentication method:\n');
  console.log('1. Server mode (automatic) - Recommended');
  console.log('2. Simple mode (manual paste)');
  console.log('3. Manual mode (command line)');
  console.log('4. Exchange existing code');
  console.log('5. Exit\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter your choice (1-5): ', async (choice) => {
    rl.close();
    
    switch (choice) {
      case '1':
        await serverMode();
        break;
      case '2':
        await simpleMode();
        break;
      case '3':
        await manualMode();
        break;
      case '4':
        await exchangeMode();
        break;
      case '5':
        console.log('Goodbye! 👋');
        process.exit(0);
      default:
        console.log('Invalid choice. Please run the script again.');
        process.exit(1);
    }
  });
}

/**
 * Server mode - Automatic callback handling
 */
async function serverMode() {
  const app = express();
  const redirectUri = DEFAULT_REDIRECT_URIS.server;
  const authUrl = generateAuthUrl(credentials.SPOTIFY_CLIENT_ID, redirectUri, SCOPES);
  
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Spotify Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .button { display: inline-block; background: #1DB954; color: white; padding: 12px 24px; 
                     text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #1ed760; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>🎵 Spotify Now Playing - Authorization</h1>
          <p>Click the button below to authorize your Spotify account:</p>
          <a href="${authUrl}" class="button">Authorize Spotify Access</a>
          <p><em>You'll be redirected back here automatically after authorization.</em></p>
        </body>
      </html>
    `);
  });
  
  app.get('/callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
      res.send(`
        <html>
          <head><title>Authorization Failed</title></head>
          <body>
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <a href="/">Try Again</a>
          </body>
        </html>
      `);
      return;
    }
    
    if (!code) {
      res.status(400).send('Authorization code not found');
      return;
    }
    
    try {
      const tokenData = await exchangeCodeForToken(code, redirectUri, credentials);
      
      // Validate the token
      const isValid = await validateRefreshToken(tokenData.refresh_token, credentials);
      if (!isValid) {
        throw new Error('Received refresh token is invalid');
      }
      
      // Save to .env.local
      saveRefreshToken(tokenData.refresh_token);
      
      res.send(`
        <html>
          <head>
            <title>Success!</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              pre { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
              .success { color: #1DB954; }
            </style>
          </head>
          <body>
            <h1 class="success">✅ Authorization Successful!</h1>
            <p>Your refresh token has been saved to <code>.env.local</code></p>
            <p><strong>You can now close this tab and stop the server (Ctrl+C in terminal).</strong></p>
            <hr>
            <details>
              <summary>View token details</summary>
              <pre>SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}</pre>
            </details>
          </body>
        </html>
      `);
      
      console.log('\n✅ Authorization successful! Token saved to .env.local');
      console.log('Press Ctrl+C to stop the server.');
      
    } catch (error) {
      displayErrorMessage(error, 'token exchange');
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>❌ Error</h1>
            <p>${error.message}</p>
            <a href="/">Try Again</a>
          </body>
        </html>
      `);
    }
  });
  
  const server = app.listen(PORT, () => {
    console.log(`\n🎵 Spotify authorization server running at http://localhost:${PORT}`);
    console.log('📱 Opening your browser...\n');
    
    // Try to open browser automatically
    const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${open} http://localhost:${PORT}`);
  });
  
  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use. Please close any other servers running on this port.`);
    } else {
      displayErrorMessage(err, 'server');
    }
    process.exit(1);
  });
}

/**
 * Simple mode - Manual code paste with web form
 */
async function simpleMode() {
  const app = express();
  const redirectUri = DEFAULT_REDIRECT_URIS.simple;
  const authUrl = generateAuthUrl(credentials.SPOTIFY_CLIENT_ID, redirectUri, SCOPES);
  
  app.use(express.urlencoded({ extended: true }));
  
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Spotify Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; }
            .button { display: inline-block; background: #1DB954; color: white; padding: 12px 24px; 
                     text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #1ed760; }
            input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; 
                                border-radius: 5px; font-family: monospace; }
            button[type="submit"] { padding: 10px 20px; background: #1DB954; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
            button[type="submit"]:hover { background: #1ed760; }
            .step { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>🎵 Spotify Now Playing - Authorization</h1>
          
          <div class="step">
            <h3>Step 1: Authorize Your Account</h3>
            <p>Click the button below to authorize your Spotify account:</p>
            <a href="${authUrl}" target="_blank" class="button">Authorize Spotify Access</a>
          </div>
          
          <div class="step">
            <h3>Step 2: Get Authorization Code</h3>
            <p>After authorizing, you'll be redirected to <code>example.com</code>.</p>
            <p>Don't worry about the error page - just look at the URL!</p>
          </div>
          
          <div class="step">
            <h3>Step 3: Paste Authorization Code</h3>
            <p>Copy the code from the URL (everything after <code>?code=</code>) and paste it here:</p>
            <form action="/exchange" method="post">
              <input type="text" name="code" placeholder="Paste your authorization code here" required>
              <button type="submit">Get Refresh Token</button>
            </form>
            <p><em>Example: If the URL is https://example.com/callback?code=AQC7X9Y2Z..., copy "AQC7X9Y2Z..."</em></p>
          </div>
        </body>
      </html>
    `);
  });
  
  app.post('/exchange', async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).send('Authorization code is required');
    }
    
    try {
      const tokenData = await exchangeCodeForToken(code.trim(), redirectUri, credentials);
      
      // Validate the token
      const isValid = await validateRefreshToken(tokenData.refresh_token, credentials);
      if (!isValid) {
        throw new Error('Received refresh token is invalid');
      }
      
      // Save to .env.local
      saveRefreshToken(tokenData.refresh_token);
      
      res.send(`
        <html>
          <head>
            <title>Success!</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              pre { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
              .success { color: #1DB954; }
            </style>
          </head>
          <body>
            <h1 class="success">✅ Success!</h1>
            <p>Your refresh token has been saved to <code>.env.local</code></p>
            <p><strong>You can now close this tab and stop the server (Ctrl+C in terminal).</strong></p>
            <hr>
            <h3>Complete Environment Variables for Vercel:</h3>
            <pre>SPOTIFY_CLIENT_ID=${credentials.SPOTIFY_CLIENT_ID}
SPOTIFY_CLIENT_SECRET=${credentials.SPOTIFY_CLIENT_SECRET}
SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}</pre>
          </body>
        </html>
      `);
      
      console.log('\n✅ Authorization successful! Token saved to .env.local');
      console.log('Press Ctrl+C to stop the server.');
      
    } catch (error) {
      displayErrorMessage(error, 'token exchange');
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>❌ Error</h1>
            <p>${error.message}</p>
            <a href="/">Try Again</a>
          </body>
        </html>
      `);
    }
  });
  
  app.listen(PORT, () => {
    console.log(`\n🎵 Spotify authorization server running at http://localhost:${PORT}`);
    console.log('📱 Open your browser and navigate to http://localhost:8888 to start');
  });
}

/**
 * Manual mode - Display auth URL and instructions
 */
async function manualMode() {
  const redirectUri = DEFAULT_REDIRECT_URIS.manual;
  const authUrl = generateAuthUrl(credentials.SPOTIFY_CLIENT_ID, redirectUri, SCOPES);
  
  console.log('\n🎵 Spotify Manual Authorization Process\n');
  console.log('━'.repeat(80));
  console.log('\n📋 PREPARATION - Add Redirect URI to Your Spotify App:\n');
  console.log('1. Go to https://developer.spotify.com/dashboard');
  console.log(`2. Click on your app (Client ID: ${credentials.SPOTIFY_CLIENT_ID})`);
  console.log('3. Click "Edit Settings"');
  console.log(`4. In "Redirect URIs" section, add: ${redirectUri}`);
  console.log('5. Click "Save"\n');
  console.log('━'.repeat(80));
  console.log('\n🔗 AUTHORIZATION URL:\n');
  console.log(authUrl);
  console.log('\n━'.repeat(80));
  console.log('\n📝 NEXT STEPS:\n');
  console.log('1. Copy and open the URL above in your browser');
  console.log('2. Authorize the application');
  console.log('3. You\'ll be redirected to an error page (this is normal!)');
  console.log('4. Copy the authorization code from the URL');
  console.log('   Example: https://developer.spotify.com/callback?code=AQC7X9Y2Z...');
  console.log('   Copy: AQC7X9Y2Z...\n');
  console.log('5. Run: npm run spotify-auth --exchange YOUR_CODE_HERE\n');
  
  // Ask if user wants to copy URL to clipboard
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Would you like to open this URL in your browser? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      require('child_process').exec(`${open} "${authUrl}"`);
      console.log('\n✅ Opening browser...');
    }
    rl.close();
  });
}

/**
 * Exchange mode - Exchange code for token
 */
async function exchangeMode() {
  let code, redirectUri;
  
  if (args.length > 1) {
    // Get from command line arguments
    code = args[1];
    redirectUri = args[2] || DEFAULT_REDIRECT_URIS.manual;
  } else {
    // Interactive prompt
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    code = await new Promise(resolve => {
      rl.question('\nEnter your authorization code: ', resolve);
    });
    
    redirectUri = await new Promise(resolve => {
      rl.question(`Enter redirect URI (or press Enter for default: ${DEFAULT_REDIRECT_URIS.manual}): `, 
        answer => resolve(answer || DEFAULT_REDIRECT_URIS.manual));
    });
    
    rl.close();
  }
  
  if (!code) {
    console.error('\n❌ No authorization code provided!');
    process.exit(1);
  }
  
  console.log('\n🔄 Exchanging authorization code for refresh token...\n');
  
  try {
    const tokenData = await exchangeCodeForToken(code.trim(), redirectUri, credentials);
    
    // Validate the token
    console.log('🔍 Validating refresh token...');
    const isValid = await validateRefreshToken(tokenData.refresh_token, credentials);
    if (!isValid) {
      throw new Error('Received refresh token is invalid');
    }
    
    // Ask if user wants to save to file
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nSave token to .env.local? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        saveRefreshToken(tokenData.refresh_token);
      }
      displaySuccessMessage(tokenData.refresh_token, answer.toLowerCase() === 'y');
      rl.close();
    });
    
  } catch (error) {
    displayErrorMessage(error, 'token exchange');
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.clear();
  
  switch (mode) {
    case '--server':
    case '-s':
      await serverMode();
      break;
      
    case '--simple':
    case '-p':
      await simpleMode();
      break;
      
    case '--manual':
    case '-m':
      await manualMode();
      break;
      
    case '--exchange':
    case '-e':
      await exchangeMode();
      break;
      
    case '--help':
    case '-h':
      console.log(`
🎵 Spotify Authentication Tool

Usage: npm run spotify-auth [options]

Options:
  --server, -s          Server mode with automatic callback (default)
  --simple, -p          Simple mode with manual code paste
  --manual, -m          Manual mode - displays auth URL only
  --exchange, -e        Exchange authorization code for token
  --help, -h            Show this help message

Examples:
  npm run spotify-auth                          # Interactive mode
  npm run spotify-auth --server                 # Server mode
  npm run spotify-auth --exchange CODE          # Exchange code
  npm run spotify-auth --exchange CODE URI      # Exchange with custom URI
      `);
      break;
      
    default:
      // Interactive mode if no valid option provided
      await interactiveMode();
  }
}

// Run the main function
main().catch(error => {
  displayErrorMessage(error, 'initialization');
  process.exit(1);
});