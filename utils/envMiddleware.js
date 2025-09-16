/**
 * Environment Variable Validation Middleware
 * 
 * Provides early validation of environment variables during application startup
 * to prevent runtime failures and provide clear error messages.
 */

const { validateEnvironment, ConfigurationError, logValidationResults } = require('./validateEnvironment');

// Cache for validated environment variables
let validatedEnv = null;
let validationError = null;

/**
 * Performs environment validation once and caches the result
 * @returns {Object|null} Validated environment object or null if validation failed
 */
function performValidation() {
  if (validatedEnv !== null || validationError !== null) {
    // Already validated, return cached result
    return validatedEnv;
  }

  try {
    const results = validateEnvironment();
    
    // In development, log the validation results
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
      logValidationResults(results);
    }

    // Cache the validated environment
    validatedEnv = {
      ...results.spotify,
      ...results.optional,
      _warnings: results.warnings
    };

    return validatedEnv;
  } catch (error) {
    // Cache the error to avoid repeated validation attempts
    validationError = error;
    
    // In development, log the full error details
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
      console.error(error.details?.errorMessage || error.message);
    }
    
    return null;
  }
}

/**
 * Express/Vercel middleware for environment validation
 * 
 * This middleware ensures environment variables are validated before
 * processing any requests. It provides graceful error handling with
 * helpful error messages for development.
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function envValidationMiddleware(req, res, next) {
  // Skip validation for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const env = performValidation();

  if (!env) {
    // Environment validation failed
    const isDevelopment = process.env.NODE_ENV !== 'production' && 
                         process.env.VERCEL_ENV !== 'production';

    if (isDevelopment && validationError instanceof ConfigurationError) {
      // In development, return detailed error information
      return res.status(500).json({
        error: 'Configuration Error',
        message: validationError.message,
        details: validationError.details,
        timestamp: new Date().toISOString()
      });
    } else {
      // In production, return generic error
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'The server is not properly configured. Please contact the administrator.',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Attach validated environment to request for easy access
  req.validatedEnv = env;
  
  next();
}

/**
 * Wrapper for Vercel serverless functions with environment validation
 * 
 * Use this to wrap your API handlers to ensure environment validation
 * happens before the handler executes.
 * 
 * @param {Function} handler - The API handler function
 * @returns {Function} Wrapped handler with environment validation
 */
function withEnvValidation(handler) {
  return async (req, res) => {
    const env = performValidation();

    if (!env) {
      const isDevelopment = process.env.NODE_ENV !== 'production' && 
                           process.env.VERCEL_ENV !== 'production';

      if (isDevelopment && validationError instanceof ConfigurationError) {
        // In development, log full error and return detailed response
        console.error(validationError.details?.errorMessage || validationError.message);
        
        return res.status(500).json({
          error: 'Configuration Error',
          message: validationError.message,
          details: {
            missing: validationError.details?.missing,
            hint: 'Check the console for detailed setup instructions'
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // In production, return generic error
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'The server is not properly configured.',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Attach validated environment to request
    req.validatedEnv = env;

    // Call the original handler
    return handler(req, res);
  };
}

/**
 * Get validated environment variables
 * 
 * This can be used in your application code to access validated
 * environment variables without re-validating.
 * 
 * @returns {Object} Validated environment variables
 * @throws {ConfigurationError} If environment validation failed
 */
function getValidatedEnv() {
  const env = performValidation();
  
  if (!env) {
    throw validationError || new ConfigurationError('Environment validation failed');
  }
  
  return env;
}

/**
 * Reset validation cache (useful for testing)
 */
function resetValidationCache() {
  validatedEnv = null;
  validationError = null;
}

module.exports = {
  envValidationMiddleware,
  withEnvValidation,
  getValidatedEnv,
  resetValidationCache
};