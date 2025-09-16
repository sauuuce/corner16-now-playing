# Spotify Now Playing API Integration

A complete serverless API solution for displaying your Spotify "Now Playing" status in Framer projects.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app with these settings:
   - **Redirect URIs** (add one or more depending on your auth method):
     - `http://localhost:8888/callback` (for server mode)
     - `https://example.com/callback` (for simple mode)
     - `https://developer.spotify.com/callback` (for manual mode)
   - **Required Scopes**: `user-read-currently-playing user-read-playback-state`
3. Note your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Spotify app credentials:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### 4. Get Your Spotify Refresh Token

Run the authorization script to get your refresh token:

```bash
npm run auth
```

This will start an interactive authentication process. You can also use specific modes:

```bash
# Interactive mode (recommended) - presents menu of options
npm run spotify-auth

# Server mode - automatic callback handling
npm run auth

# Simple mode - manual code paste
npm run auth:simple

# Manual mode - command line process
npm run auth:manual

# Exchange existing code
npm run auth:exchange YOUR_CODE
```

The script will:
- Guide you through the authorization process
- Automatically save your refresh token to `.env.local`
- Validate the token before saving
- Provide clear instructions at each step

### 5. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
npm run deploy
```

During deployment, add your environment variables:
- `SPOTIFY_CLIENT_ID`: Your Spotify app's Client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app's Client Secret  
- `SPOTIFY_REFRESH_TOKEN`: The token you got from step 4

### 6. Test Your API

After deployment, test your endpoint:
- `https://your-vercel-url.vercel.app/api/spotify/now-playing`

## 🛡️ Environment Variable Validation

This project includes comprehensive environment variable validation to catch configuration errors early:

### Features:
- **Build-time validation**: Prevents deployment with missing variables
- **Detailed error messages**: Clear instructions on how to fix issues
- **Format validation**: Ensures credentials are in the correct format
- **Early failure detection**: Catches errors before runtime

### Usage:

#### Validate Environment:
```bash
npm run validate:env
```

#### Automatic Validation:
Environment variables are automatically validated:
- During `npm run deploy`
- When API endpoints are called (with helpful error messages)
- In CI/CD pipelines

#### Error Messages:
If variables are missing or invalid, you'll see detailed instructions:
```
❌ CONFIGURATION ERROR
========================
The following required environment variables are missing:

📍 SPOTIFY_CLIENT_ID
   Description: Spotify application client ID
   How to get: Get from https://developer.spotify.com/dashboard/applications
   
[Additional setup instructions...]
```

See [Environment Validation Guide](docs/ENVIRONMENT_VALIDATION_GUIDE.md) for detailed documentation.

## 📱 Using with Framer

### Component Options (Choose One):

#### Option 1: JavaScript Version (Recommended for Framer)

1. Copy the content from `components/SpotifyNowPlayingFramer.jsx`
2. Create a new code component in Framer
3. Paste the code - **should work immediately** ✅

**Why this version works best:**
- ✅ **Pure JavaScript** - No TypeScript compilation issues
- ✅ **Maximum compatibility** - Works in all Framer environments  
- ✅ **Simplified architecture** - No complex features that could cause issues
- ✅ **Direct prop access** - Uses simple prop destructuring pattern
- ✅ **Battle-tested** - Based on patterns known to work in Framer

#### Option 2: Simplified TypeScript Version

1. Copy the content from `components/SpotifyNowPlayingSimple.tsx`
2. Create a new code component in Framer
3. Paste the code

**Features:**
- ✅ **Simplified TypeScript** - Minimal typing for better compatibility
- ✅ **Reduced complexity** - No error boundaries or lazy loading
- ✅ **Self-contained** - All definitions inline

#### Option 3: Full-Featured TypeScript Version

1. Copy the content from `components/SpotifyNowPlaying.tsx`
2. Create a new code component in Framer
3. May require additional troubleshooting in some Framer environments

### Component Integration:

All versions come pre-configured with the deployment URL. The `apiUrl` prop is set by default:

```javascript
// Default API URL in all components
apiUrl = "https://corner16-now-playing-135s3pi0h-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing"

// Update to your deployed URL via the component properties panel
// Or modify the default value in the code
```

## 🎵 Component Features

- **Progress Bar**: Shows real-time playback progress when music is playing
- **Nothing Playing**: Displays "Nothing playing atm" when Spotify is paused/stopped
- **Customizable Text**: Change the "not playing" message via props
- **Track Info**: Optional track name and artist display
- **All Original Props**: Maintains all your existing Framer property controls

### New Props Added:
- `showTrackName`: Toggle to show track and artist name
- `notPlayingText`: Customize the "nothing playing" message

## 🔧 API Response Format

### When Playing:
```json
{
  "is_playing": true,
  "progress_ms": 123456,
  "item": {
    "name": "Song Name",
    "artists": ["Artist Name"],
    "duration_ms": 240000,
    "album": {
      "name": "Album Name",
      "images": [...]
    },
    "external_urls": {...}
  }
}
```

### When Not Playing:
```json
{
  "is_playing": false
}
```

## 🛠️ Development

### Local Development

```bash
# Start local development server
npm run dev
```

Your API will be available at: `http://localhost:3000/api/spotify/now-playing`

### Re-authorizing

If you need a new refresh token:

```bash
npm run auth
```

## 🔐 Security Notes

- ✅ Client credentials are handled server-side only
- ✅ Refresh token is stored securely in environment variables
- ✅ No sensitive data exposed to client-side code
- ✅ **Secure CORS policy with configurable origins** (replaces wildcard)
- ✅ Rate limiting considerations (5-second polling interval)
- ✅ Additional security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

## 📦 File Structure

```
├── api/
│   └── spotify/
│       └── now-playing.js           # Main API endpoint
├── components/
│   ├── SpotifyNowPlayingFramer.jsx  # JavaScript version (recommended for Framer)
│   ├── SpotifyNowPlayingSimple.tsx  # Simplified TypeScript version  
│   └── SpotifyNowPlaying.tsx        # Full-featured TypeScript version
├── scripts/
│   └── get-refresh-token.js   # Authorization helper
├── .env.local                 # Your environment variables
├── .env.example              # Environment template
├── package.json              # Dependencies
├── vercel.json              # Vercel configuration
└── README.md                # This file
```

## 🚀 Deployment Platforms

### Vercel (Recommended)
- Perfect for this use case
- Automatic environment variable management
- Built-in serverless functions
- Easy custom domain support

### Alternative Platforms
This API can also be deployed to:
- Netlify Functions
- AWS Lambda
- Railway
- Render

## 🐛 Troubleshooting

### "Token refresh failed"
- Verify your `SPOTIFY_CLIENT_SECRET` is correct
- Re-run the authorization script to get a new refresh token

### "Nothing playing" always shows
- Check if you're actually playing music on Spotify
- Verify your refresh token is valid and properly set
- Ensure you have the correct scopes: `user-read-currently-playing user-read-playback-state`

### CORS errors in Framer
- Make sure you're using the full deployed URL (not localhost)
- **Configure ALLOWED_ORIGINS environment variable** with your domain(s)
- Check that your domain is included in the allowed origins list
- In development, localhost origins are automatically allowed

## 🔒 CORS Configuration

This API now uses a secure CORS policy instead of wildcard origins. Configure allowed domains:

### Environment Variables

Add to your `.env` file:

```bash
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# Environment (development allows localhost automatically)
NODE_ENV=production
```

### Development vs Production

- **Development**: Localhost origins are automatically allowed
- **Production**: Only origins in `ALLOWED_ORIGINS` are permitted
- **Security**: Unallowed origins receive 403 Forbidden response

### Example Configuration

```bash
# For a single domain
ALLOWED_ORIGINS=https://myframer.site

# For multiple domains
ALLOWED_ORIGINS=https://myframer.site,https://www.myframer.site,https://app.myframer.site

# For subdomains
ALLOWED_ORIGINS=https://*.myframer.site
```

## 📝 Spotify App Configuration

When creating your Spotify app, use these settings:

- **Required Scopes**: `user-read-currently-playing user-read-playback-state`
- **Redirect URI**: `http://localhost:3000/callback` (for authorization only)

## 🎯 Next Steps

1. Create your Spotify app on the Developer Dashboard
2. Copy `.env.example` to `.env.local` and add your credentials
3. Run `npm run auth` to get your refresh token
4. Deploy with `npm run deploy`
5. Update your Framer component with the deployed URL
6. Enjoy your live Spotify integration! 🎵

## 📚 Additional Documentation

For technical implementation details, agent workflows, and development guidelines, see [agents.md](./agents.md).