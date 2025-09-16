/**
 * Environment Variable Validation Utility
 * 
 * Provides comprehensive validation of required environment variables
 * with detailed error messages and setup instructions.
 */

class ConfigurationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConfigurationError';
    this.details = details;
  }
}

/**
 * Validates that all required Spotify environment variables are present
 * @throws {ConfigurationError} If any required variables are missing
 * @returns {Object} Object containing validated environment variables
 */
function validateSpotifyEnvironment() {
  const required = {
    SPOTIFY_CLIENT_ID: {
      description: 'Spotify application client ID',
      example: 'your_spotify_client_id_here',
      instructions: 'Get from https://developer.spotify.com/dashboard/applications'
    },
    SPOTIFY_CLIENT_SECRET: {
      description: 'Spotify application client secret',
      example: 'your_spotify_client_secret_here',
      instructions: 'Get from your app settings at https://developer.spotify.com/dashboard'
    },
    SPOTIFY_REFRESH_TOKEN: {
      description: 'Long-lived refresh token for Spotify API',
      example: 'your_spotify_refresh_token_here',
      instructions: 'Generate using: npm run spotify-auth'
    }
  };

  const missing = [];
  const validated = {};

  // Check each required variable
  for (const [key, config] of Object.entries(required)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      missing.push({ key, ...config });
    } else {
      validated[key] = value;
    }
  }

  // If any are missing, throw detailed error
  if (missing.length > 0) {
    const errorMessage = createDetailedErrorMessage(missing);
    throw new ConfigurationError('Missing required environment variables', {
      missing,
      errorMessage
    });
  }

  // Additional validation checks
  validateSpotifyCredentialFormat(validated);

  return validated;
}

/**
 * Validates the format of Spotify credentials
 * @param {Object} credentials - Object containing Spotify credentials
 * @throws {ConfigurationError} If credentials are malformed
 */
function validateSpotifyCredentialFormat(credentials) {
  // Validate Client ID format (32 character alphanumeric)
  if (!/^[a-zA-Z0-9]{32}$/.test(credentials.SPOTIFY_CLIENT_ID)) {
    throw new ConfigurationError(
      'Invalid SPOTIFY_CLIENT_ID format',
      {
        message: 'Spotify Client ID should be a 32-character alphanumeric string',
        received: `${credentials.SPOTIFY_CLIENT_ID.length} characters`,
        instructions: 'Check your Spotify app dashboard for the correct Client ID'
      }
    );
  }

  // Validate Client Secret format (32 character alphanumeric)
  if (!/^[a-zA-Z0-9]{32}$/.test(credentials.SPOTIFY_CLIENT_SECRET)) {
    throw new ConfigurationError(
      'Invalid SPOTIFY_CLIENT_SECRET format',
      {
        message: 'Spotify Client Secret should be a 32-character alphanumeric string',
        received: `${credentials.SPOTIFY_CLIENT_SECRET.length} characters`,
        instructions: 'Check your Spotify app dashboard for the correct Client Secret'
      }
    );
  }

  // Basic refresh token validation (should be a long base64-like string)
  if (credentials.SPOTIFY_REFRESH_TOKEN.length < 100) {
    throw new ConfigurationError(
      'Invalid SPOTIFY_REFRESH_TOKEN format',
      {
        message: 'Spotify Refresh Token appears to be too short',
        received: `${credentials.SPOTIFY_REFRESH_TOKEN.length} characters`,
        expected: 'At least 100 characters',
        instructions: 'Re-run the authentication process: npm run spotify-auth'
      }
    );
  }
}

/**
 * Creates a detailed error message with setup instructions
 * @param {Array} missing - Array of missing environment variable configurations
 * @returns {string} Formatted error message
 */
function createDetailedErrorMessage(missing) {
  let message = '\n\n❌ CONFIGURATION ERROR\n';
  message += '========================\n\n';
  message += 'The following required environment variables are missing:\n\n';

  missing.forEach(({ key, description, example, instructions }) => {
    message += `📍 ${key}\n`;
    message += `   Description: ${description}\n`;
    message += `   Example: ${example}\n`;
    message += `   How to get: ${instructions}\n\n`;
  });

  message += '\n🔧 SETUP INSTRUCTIONS\n';
  message += '===================\n\n';
  message += '1. Create a .env file in your project root (if not exists)\n';
  message += '2. Add the missing variables to your .env file:\n\n';
  
  missing.forEach(({ key, example }) => {
    message += `   ${key}="${example}"\n`;
  });

  message += '\n3. For local development:\n';
  message += '   - Make sure to load .env file using dotenv\n';
  message += '   - Run: npm install dotenv (if not installed)\n\n';
  
  message += '4. For Vercel deployment:\n';
  message += '   - Go to your project settings on Vercel\n';
  message += '   - Navigate to Settings > Environment Variables\n';
  message += '   - Add each variable with its value\n';
  message += '   - Redeploy your project\n\n';

  message += '5. To generate a Spotify refresh token:\n';
  message += '   - Run: npm run spotify-auth\n';
  message += '   - Follow the authentication flow\n';
  message += '   - Copy the generated refresh token\n\n';

  message += 'For more help, see: https://developer.spotify.com/documentation/web-api/\n';

  return message;
}

/**
 * Validates all environment variables (including optional ones)
 * @returns {Object} Object containing validation results and warnings
 */
function validateEnvironment() {
  const results = {
    spotify: null,
    warnings: [],
    optional: {}
  };

  try {
    // Validate required Spotify variables
    results.spotify = validateSpotifyEnvironment();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError('Unexpected error during validation', { 
      originalError: error.message 
    });
  }

  // Check optional variables (add more as needed)
  const optionalVars = {
    NODE_ENV: {
      default: 'development',
      description: 'Application environment'
    },
    VERCEL_ENV: {
      default: 'development',
      description: 'Vercel deployment environment'
    },
    API_CACHE_DURATION: {
      default: '60',
      description: 'API response cache duration in seconds'
    }
  };

  for (const [key, config] of Object.entries(optionalVars)) {
    const value = process.env[key];
    if (!value) {
      results.warnings.push(
        `Optional variable ${key} not set. Using default: ${config.default}`
      );
      results.optional[key] = config.default;
    } else {
      results.optional[key] = value;
    }
  }

  return results;
}

/**
 * Logs validation results in a formatted way
 * @param {Object} results - Validation results object
 */
function logValidationResults(results) {
  console.log('\n✅ Environment Validation Successful\n');
  console.log('===================================\n');
  
  console.log('Required Variables:');
  Object.entries(results.spotify).forEach(([key, value]) => {
    console.log(`  ✓ ${key}: ${value.substring(0, 8)}...`);
  });

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }

  console.log('\nOptional Variables:');
  Object.entries(results.optional).forEach(([key, value]) => {
    console.log(`  • ${key}: ${value}`);
  });

  console.log('\n');
}

module.exports = {
  validateEnvironment,
  validateSpotifyEnvironment,
  ConfigurationError,
  logValidationResults
};