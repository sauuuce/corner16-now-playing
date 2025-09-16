# Migration Example: Updating now-playing.js

This example shows how to migrate the existing `now-playing.js` API endpoint to use the new environment validation system.

## Current Implementation (now-playing.js)

The current implementation validates environment variables at runtime inside the handler:

```javascript
// Lines 25-41 of now-playing.js
try {
  // Environment variables
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

  // Validate environment variables
  if (
    !SPOTIFY_CLIENT_ID ||
    !SPOTIFY_CLIENT_SECRET ||
    !SPOTIFY_REFRESH_TOKEN
  ) {
    console.error("Missing Spotify environment variables");
    return res.status(500).json({
      error: "Server configuration error",
      is_playing: false,
    });
  }
```

## Updated Implementation (now-playing-validated.js)

The new implementation uses the validation middleware:

```javascript
const { withEnvValidation } = require('../../utils/envMiddleware');

async function nowPlayingHandler(req, res) {
  // ... CORS headers ...

  try {
    // Get validated environment variables from middleware
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = req.validatedEnv;
    
    // No need for manual validation - already done by middleware
    // Continue with the API logic...
```

## Migration Steps

1. **Import the validation wrapper:**
   ```javascript
   const { withEnvValidation } = require('../../utils/envMiddleware');
   ```

2. **Move the handler to a named function:**
   ```javascript
   async function nowPlayingHandler(req, res) {
     // Your existing handler code
   }
   ```

3. **Remove manual validation code:**
   - Delete the environment variable checks
   - Access variables from `req.validatedEnv` instead of `process.env`

4. **Export the wrapped handler:**
   ```javascript
   module.exports = withEnvValidation(nowPlayingHandler);
   ```

## Benefits of Migration

1. **Better Error Messages**: Users get detailed setup instructions instead of generic "Server configuration error"

2. **Early Failure Detection**: Validation happens before the handler runs, preventing partial execution

3. **Consistent Error Handling**: All endpoints can use the same validation approach

4. **Development-Friendly**: In development, you see exactly what's missing and how to fix it

5. **Production-Safe**: In production, sensitive details are hidden while still providing useful errors

## Testing the Migration

1. **Without environment variables:**
   ```bash
   # You'll see detailed error messages with setup instructions
   curl http://localhost:3000/api/spotify/now-playing
   ```

2. **With invalid format:**
   ```bash
   # You'll see format validation errors
   SPOTIFY_CLIENT_ID=invalid npm run dev
   ```

3. **With valid environment:**
   ```bash
   # API works as before
   npm run dev
   ```

## Full Migration Example

To use the migrated version, update your Vercel configuration or local imports to use `now-playing-validated.js` instead of `now-playing.js`. The API interface remains exactly the same - only the error handling improves.