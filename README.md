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
   - **Redirect URI**: `http://localhost:3000/callback`
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

This will:
- Start a local server at `http://localhost:3000`
- Open your browser and click "Authorize Spotify Access"
- Log in to your Spotify account
- Copy the refresh token from the success page and add it to your `.env.local` file

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

## 📱 Using with Framer

1. Copy the content from `components/SpotifyNowPlaying.jsx`
2. Create a new code component in Framer
3. Paste the code
4. Update the API endpoint URL to your deployed Vercel URL:

```javascript
// Change this line in the component:
const response = await fetch("/api/spotify/now-playing")

// To your deployed URL:
const response = await fetch("https://your-vercel-url.vercel.app/api/spotify/now-playing")
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
│       └── now-playing.js     # Main API endpoint
├── components/
│   └── SpotifyNowPlaying.jsx  # Framer component
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