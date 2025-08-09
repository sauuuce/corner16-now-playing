# Spotify Now Playing API Integration

A complete serverless API solution for displaying your Spotify "Now Playing" status in Framer projects.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Spotify Refresh Token

Run the authorization script to get your refresh token:

```bash
npm run auth
```

This will:
- Start a local server at `http://localhost:3000`
- Open your browser and click "Authorize Spotify Access"
- Log in to your Spotify account (Client ID: `ea6a84cb94eb45dab4d99b30b9676051`)
- Copy the refresh token from the success page

### 3. Configure Environment Variables

Update `.env.local` with your refresh token:

```env
SPOTIFY_CLIENT_ID=ea6a84cb94eb45dab4d99b30b9676051
SPOTIFY_CLIENT_SECRET=427048c82e8442d3a1689eeccbb668ef
SPOTIFY_REFRESH_TOKEN=your_actual_refresh_token_here
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
npm run deploy
```

During deployment, add your environment variables:
- `SPOTIFY_CLIENT_ID`: `ea6a84cb94eb45dab4d99b30b9676051`
- `SPOTIFY_CLIENT_SECRET`: `427048c82e8442d3a1689eeccbb668ef`
- `SPOTIFY_REFRESH_TOKEN`: (the token you got from step 2)

### 5. Test Your API

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
- ✅ CORS headers configured for web access
- ✅ Rate limiting considerations (5-second polling interval)

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
- Check that your Vercel deployment has the correct CORS headers

## 📝 Your Spotify App Details

- **Client ID**: `ea6a84cb94eb45dab4d99b30b9676051`
- **Client Secret**: `427048c82e8442d3a1689eeccbb668ef` (keep secure!)
- **Required Scopes**: `user-read-currently-playing user-read-playback-state`
- **Redirect URI**: `http://localhost:3000/callback` (for authorization only)

## 🎯 Next Steps

1. Run `npm run auth` to get your refresh token
2. Update `.env.local` with the token
3. Deploy with `npm run deploy`
4. Update your Framer component with the deployed URL
5. Enjoy your live Spotify integration! 🎵