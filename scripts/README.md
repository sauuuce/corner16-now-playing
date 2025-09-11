# Spotify Authentication Scripts

This directory contains the consolidated authentication system for the Spotify Now Playing application.

## Main Scripts

### spotify-auth.js
The main consolidated authentication script that provides multiple authentication flows:

```bash
# Interactive mode (presents menu)
npm run spotify-auth

# Server mode (automatic callback handling) - Recommended
npm run auth
npm run spotify-auth --server

# Simple mode (manual code paste)
npm run auth:simple
npm run spotify-auth --simple

# Manual mode (generates auth URL only)
npm run auth:manual
npm run spotify-auth --manual

# Exchange mode (exchange existing code for token)
npm run auth:exchange YOUR_CODE
npm run spotify-auth --exchange YOUR_CODE [REDIRECT_URI]
```

### auth-utils.js
Shared authentication utilities used by the main script:
- Environment variable validation
- Auth URL generation
- Token exchange functionality
- Token validation
- Automatic .env.local file management
- Error handling and user feedback

## Features

1. **Multiple Authentication Flows**
   - Server mode: Fully automated with local callback server
   - Simple mode: Web form for manual code paste
   - Manual mode: Command-line process for advanced users
   - Exchange mode: Direct code-to-token exchange

2. **Enhanced Functionality**
   - Interactive CLI with clear options
   - Automatic .env.local file updates
   - Token validation before saving
   - Comprehensive error handling
   - Browser auto-open support
   - Progress indicators

3. **Security**
   - Validates tokens before saving
   - Secure credential handling
   - Clear security warnings

## Quick Start

1. Ensure you have your Spotify app credentials in `.env`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

2. Run the authentication:
   ```bash
   npm run auth
   ```

3. Follow the prompts to authorize your Spotify account

4. The refresh token will be automatically saved to `.env.local`

## Legacy Scripts

The original individual authentication scripts have been moved to the `legacy/` folder for reference. See `legacy/README.md` for migration details.