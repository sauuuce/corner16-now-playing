# Environment Variable Validation Guide

This guide explains how to use the new environment variable validation system that provides early error detection and helpful error messages.

## Overview

The new validation system addresses the following issues:
- ✅ Early detection of missing environment variables (before deployment)
- ✅ Clear, actionable error messages with setup instructions
- ✅ Format validation for credentials
- ✅ Build-time validation to prevent failed deployments
- ✅ Graceful error handling with detailed debugging information

## Key Components

### 1. Environment Validation Utility (`utils/validateEnvironment.js`)

Provides comprehensive validation with detailed error messages:

```javascript
const { validateEnvironment, ConfigurationError } = require('./utils/validateEnvironment');

try {
  const results = validateEnvironment();
  // results.spotify contains validated Spotify credentials
  // results.warnings contains any warnings about optional variables
  // results.optional contains optional variables with defaults
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(error.details.errorMessage);
    // Detailed setup instructions are included
  }
}
```

### 2. Environment Middleware (`utils/envMiddleware.js`)

Wraps API handlers with automatic validation:

```javascript
const { withEnvValidation } = require('./utils/envMiddleware');

// Wrap your handler
module.exports = withEnvValidation(async (req, res) => {
  // Access validated environment through req.validatedEnv
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = req.validatedEnv;
  
  // Your API logic here...
});
```

### 3. Build-time Validation Script (`scripts/validate-env.js`)

Run during build/deployment to catch errors early:

```bash
npm run validate:env
```

## Migration Guide

### Step 1: Update Your API Endpoints

Replace runtime validation with the middleware approach:

**Before:**
```javascript
// api/spotify/now-playing.js
module.exports = async (req, res) => {
  // Manual validation
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }
  
  // API logic...
};
```

**After:**
```javascript
// api/spotify/now-playing.js
const { withEnvValidation } = require('../../utils/envMiddleware');

module.exports = withEnvValidation(async (req, res) => {
  // Environment already validated
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = req.validatedEnv;
  
  // API logic...
});
```

### Step 2: Update Package Scripts

Add validation to your deployment process:

```json
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js",
    "deploy": "npm run validate:env && vercel --prod",
    "predeploy": "npm run validate:env"
  }
}
```

### Step 3: Create Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Spotify credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_32_char_client_id_here
   SPOTIFY_CLIENT_SECRET=your_32_char_client_secret_here
   SPOTIFY_REFRESH_TOKEN=your_long_refresh_token_here
   ```

3. Generate a refresh token if needed:
   ```bash
   npm run spotify-auth
   ```

## Error Messages

The validation system provides detailed error messages:

### Missing Variables
```
❌ CONFIGURATION ERROR
========================

The following required environment variables are missing:

📍 SPOTIFY_CLIENT_ID
   Description: Spotify application client ID
   Example: your_spotify_client_id_here
   How to get: Get from https://developer.spotify.com/dashboard/applications

[Detailed setup instructions follow...]
```

### Invalid Format
```
❌ Invalid SPOTIFY_CLIENT_ID format
   Message: Spotify Client ID should be a 32-character alphanumeric string
   Received: 15 characters
   Instructions: Check your Spotify app dashboard for the correct Client ID
```

## Deployment

### Vercel Deployment

1. **Add environment variables in Vercel dashboard:**
   - Go to your project settings
   - Navigate to Settings > Environment Variables
   - Add each required variable

2. **Validation runs automatically:**
   - During `npm run deploy`
   - In Vercel build process (if configured)
   - Deployment fails early if variables are missing

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Validate environment:**
   ```bash
   npm run validate:env
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Best Practices

1. **Always use the validation wrapper for API endpoints**
   - Ensures consistent error handling
   - Provides better error messages in development

2. **Run validation before deployment**
   - Catches configuration errors early
   - Saves debugging time

3. **Keep `.env.example` updated**
   - Document all required variables
   - Include helpful comments

4. **Use the validated environment object**
   - Access through `req.validatedEnv` in handlers
   - Don't access `process.env` directly

## Testing

Test the validation system:

```bash
# Test environment validation
npm run test:env

# Test with mock environment
node tests/test-env-validation.js
```

## Troubleshooting

### "Missing environment variables" error

1. Check if `.env` file exists
2. Verify variable names match exactly
3. Ensure no extra spaces or quotes in values
4. Run `npm run validate:env` to see detailed errors

### "Invalid format" error

1. Verify Client ID/Secret are 32 characters
2. Check for special characters (should be alphanumeric only)
3. Ensure refresh token is complete (not truncated)

### Deployment failures

1. Check Vercel environment variables are set
2. Verify variable names match exactly (case-sensitive)
3. Redeploy after adding variables

## Benefits

- **🚀 Faster debugging:** Clear error messages with solutions
- **🛡️ Safer deployments:** Catch errors before they reach production
- **📚 Better onboarding:** New developers get helpful setup instructions
- **🔍 Format validation:** Catch typos and formatting issues early
- **⚡ Performance:** Validation happens once, not on every request

## Next Steps

1. Update your existing API endpoints to use `withEnvValidation`
2. Add `npm run validate:env` to your CI/CD pipeline
3. Configure Vercel to run validation during builds
4. Consider adding more optional variables as needed