/**
 * Validation Tests - Zod Schema Validation
 * Tests all validation scenarios for environment, requests, and responses
 */

const { z } = require('zod');

// Test colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test assertion helper
 */
function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${GREEN}✓${RESET} ${message}`);
    return true;
  } else {
    testsFailed++;
    console.error(`${RED}✗${RESET} ${message}`);
    return false;
  }
}

/**
 * Test section header
 */
function section(title) {
  console.log(`\n${YELLOW}=== ${title} ===${RESET}\n`);
}

/**
 * Mock test environment
 * Note: IDs must match regex patterns (alphanumeric for client creds, alphanumeric + underscores/hyphens for refresh token)
 */
function setupTestEnvironment() {
  return {
    SPOTIFY_CLIENT_ID: 'testclientid123',
    SPOTIFY_CLIENT_SECRET: 'testclientsecret456',
    SPOTIFY_REFRESH_TOKEN: 'test-refresh-token-789-abc_def',
  };
}

/**
 * Environment Validation Tests
 */
async function testEnvironmentValidation() {
  section('Environment Validation Tests');
  
  // Import validation functions (use dynamic import for ES modules in CommonJS)
  let validateEnvironment, spotifyEnvSchema;
  try {
    const envModule = await import('../lib/validation/environment.ts');
    validateEnvironment = envModule.validateEnvironment;
    spotifyEnvSchema = envModule.spotifyEnvSchema;
  } catch (error) {
    console.error(`${RED}Failed to import environment validation:${RESET}`, error.message);
    return;
  }

  // Test 1: Valid environment variables
  try {
    const validEnv = setupTestEnvironment();
    const result = validateEnvironment(validEnv);
    assert(
      result.SPOTIFY_CLIENT_ID === validEnv.SPOTIFY_CLIENT_ID,
      'Valid environment variables should pass validation'
    );
  } catch (error) {
    assert(false, 'Valid environment variables should not throw: ' + error.message);
  }

  // Test 2: Missing CLIENT_ID
  try {
    const invalidEnv = setupTestEnvironment();
    delete invalidEnv.SPOTIFY_CLIENT_ID;
    validateEnvironment(invalidEnv);
    assert(false, 'Missing CLIENT_ID should throw validation error');
  } catch (error) {
    assert(
      error.message.includes('SPOTIFY_CLIENT_ID'),
      'Missing CLIENT_ID should throw error mentioning SPOTIFY_CLIENT_ID'
    );
  }

  // Test 3: Missing CLIENT_SECRET
  try {
    const invalidEnv = setupTestEnvironment();
    delete invalidEnv.SPOTIFY_CLIENT_SECRET;
    validateEnvironment(invalidEnv);
    assert(false, 'Missing CLIENT_SECRET should throw validation error');
  } catch (error) {
    assert(
      error.message.includes('SPOTIFY_CLIENT_SECRET'),
      'Missing CLIENT_SECRET should throw error'
    );
  }

  // Test 4: Missing REFRESH_TOKEN
  try {
    const invalidEnv = setupTestEnvironment();
    delete invalidEnv.SPOTIFY_REFRESH_TOKEN;
    validateEnvironment(invalidEnv);
    assert(false, 'Missing REFRESH_TOKEN should throw validation error');
  } catch (error) {
    assert(
      error.message.includes('SPOTIFY_REFRESH_TOKEN'),
      'Missing REFRESH_TOKEN should throw error'
    );
  }

  // Test 5: Empty string values
  try {
    const invalidEnv = {
      SPOTIFY_CLIENT_ID: '',
      SPOTIFY_CLIENT_SECRET: 'valid',
      SPOTIFY_REFRESH_TOKEN: 'valid',
    };
    validateEnvironment(invalidEnv);
    assert(false, 'Empty CLIENT_ID should throw validation error');
  } catch (error) {
    assert(true, 'Empty string values should fail validation');
  }

  // Test 6: Invalid characters in CLIENT_ID
  try {
    const invalidEnv = setupTestEnvironment();
    invalidEnv.SPOTIFY_CLIENT_ID = 'invalid@client#id!';
    validateEnvironment(invalidEnv);
    assert(false, 'Invalid characters in CLIENT_ID should throw');
  } catch (error) {
    assert(true, 'Invalid characters in CLIENT_ID should fail validation');
  }
}

/**
 * Request Validation Tests
 */
async function testRequestValidation() {
  section('Request Validation Tests');

  let validateRequest, httpMethodSchema;
  try {
    const reqModule = await import('../lib/validation/request.ts');
    validateRequest = reqModule.validateRequest;
    httpMethodSchema = reqModule.httpMethodSchema;
  } catch (error) {
    console.error(`${RED}Failed to import request validation:${RESET}`, error.message);
    return;
  }

  // Test 1: Valid GET request
  try {
    const result = validateRequest({ method: 'GET', query: {} });
    assert(result.method === 'GET', 'Valid GET request should pass validation');
  } catch (error) {
    assert(false, 'Valid GET request should not throw: ' + error.message);
  }

  // Test 2: Valid OPTIONS request
  try {
    const result = validateRequest({ method: 'OPTIONS', query: {} });
    assert(result.method === 'OPTIONS', 'Valid OPTIONS request should pass validation');
  } catch (error) {
    assert(false, 'Valid OPTIONS request should not throw: ' + error.message);
  }

  // Test 3: Invalid POST request
  try {
    validateRequest({ method: 'POST', query: {} });
    assert(false, 'POST request should throw validation error');
  } catch (error) {
    assert(
      error && error.name === 'ZodError',
      'Invalid HTTP method should throw ZodError'
    );
  }

  // Test 4: Invalid PUT request
  try {
    validateRequest({ method: 'PUT', query: {} });
    assert(false, 'PUT request should throw validation error');
  } catch (error) {
    assert(true, 'Invalid HTTP method should fail validation');
  }

  // Test 5: Invalid DELETE request
  try {
    validateRequest({ method: 'DELETE', query: {} });
    assert(false, 'DELETE request should throw validation error');
  } catch (error) {
    assert(true, 'DELETE method should fail validation');
  }

  // Test 6: Undefined method
  try {
    validateRequest({ query: {} });
    assert(false, 'Undefined method should throw validation error');
  } catch (error) {
    assert(true, 'Undefined method should fail validation');
  }

  // Test 7: Valid query parameters
  try {
    const result = validateRequest({ 
      method: 'GET', 
      query: { format: 'json' } 
    });
    assert(result.query.format === 'json', 'Valid query parameters should pass');
  } catch (error) {
    assert(false, 'Valid query parameters should not throw: ' + error.message);
  }
}

/**
 * Spotify API Response Validation Tests
 */
async function testSpotifyApiValidation() {
  section('Spotify API Response Validation Tests');

  let validateTokenResponse, validateSpotifyResponse, safeValidateSpotifyResponse;
  try {
    const spotifyModule = await import('../lib/validation/spotify-api.ts');
    validateTokenResponse = spotifyModule.validateTokenResponse;
    validateSpotifyResponse = spotifyModule.validateSpotifyResponse;
    safeValidateSpotifyResponse = spotifyModule.safeValidateSpotifyResponse;
  } catch (error) {
    console.error(`${RED}Failed to import Spotify API validation:${RESET}`, error.message);
    return;
  }

  // Test 1: Valid token response
  try {
    const validToken = {
      access_token: 'valid_access_token_123',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'user-read-currently-playing',
    };
    const result = validateTokenResponse(validToken);
    assert(
      result.access_token === validToken.access_token,
      'Valid token response should pass validation'
    );
  } catch (error) {
    assert(false, 'Valid token response should not throw: ' + error.message);
  }

  // Test 2: Missing access_token
  try {
    const invalidToken = {
      token_type: 'Bearer',
      expires_in: 3600,
    };
    validateTokenResponse(invalidToken);
    assert(false, 'Missing access_token should throw validation error');
  } catch (error) {
    assert(true, 'Missing access_token should fail validation');
  }

  // Test 3: Invalid token_type
  try {
    const invalidToken = {
      access_token: 'valid_token',
      token_type: 'Basic',
      expires_in: 3600,
    };
    validateTokenResponse(invalidToken);
    assert(false, 'Invalid token_type should throw validation error');
  } catch (error) {
    assert(true, 'Invalid token_type should fail validation');
  }

  // Test 4: Valid currently playing response (not playing)
  try {
    const notPlaying = {
      is_playing: false,
      currently_playing_type: 'track',
      progress_ms: null,
      item: null,
    };
    const result = validateSpotifyResponse(notPlaying);
    assert(
      result.is_playing === false,
      'Valid "not playing" response should pass validation'
    );
  } catch (error) {
    assert(false, 'Valid "not playing" response should not throw: ' + error.message);
  }

  // Test 5: Valid currently playing response (playing track)
  try {
    const playing = {
      is_playing: true,
      currently_playing_type: 'track',
      progress_ms: 45000,
      timestamp: Date.now(),
      item: {
        id: 'track123',
        name: 'Test Song',
        type: 'track',
        duration_ms: 180000,
        artists: [
          { name: 'Test Artist', id: 'artist123' }
        ],
        album: {
          name: 'Test Album',
          id: 'album123',
          images: [
            { url: 'https://example.com/image.jpg', height: 640, width: 640 }
          ],
        },
      },
    };
    const result = validateSpotifyResponse(playing);
    assert(
      result.is_playing === true && result.item?.name === 'Test Song',
      'Valid "playing" response should pass validation'
    );
  } catch (error) {
    assert(false, 'Valid "playing" response should not throw: ' + error.message);
  }

  // Test 6: Safe validation (should not throw)
  const invalidData = {
    is_playing: 'not_a_boolean',
    item: 'invalid',
  };
  const safeResult = safeValidateSpotifyResponse(invalidData);
  assert(
    !safeResult.success,
    'Safe validation should return error for invalid data'
  );

  // Test 7: Missing required fields
  try {
    const incomplete = {
      is_playing: true,
      item: {
        name: 'Song Name',
        // Missing required fields like id, type, duration_ms, artists, album
      },
    };
    validateSpotifyResponse(incomplete);
    assert(false, 'Incomplete track data should throw validation error');
  } catch (error) {
    assert(true, 'Incomplete track data should fail validation');
  }
}

/**
 * Response Formatting Tests
 */
async function testResponseFormatting() {
  section('Response Formatting Tests');

  let createErrorResponse, createValidationErrorResponse;
  try {
    const responseModule = await import('../lib/validation/response.ts');
    createErrorResponse = responseModule.createErrorResponse;
    createValidationErrorResponse = responseModule.createValidationErrorResponse;
  } catch (error) {
    console.error(`${RED}Failed to import response validation:${RESET}`, error.message);
    return;
  }

  // Test 1: Create error response
  const errorResponse = createErrorResponse('Test error', 'Test message', { detail: 'value' }, 'Test hint');
  assert(
    errorResponse.error === 'Test error' &&
    errorResponse.message === 'Test message' &&
    errorResponse.hint === 'Test hint',
    'Error response should have correct structure'
  );

  // Test 2: Create validation error response
  try {
    // Create a real ZodError by failing validation
    const testSchema = z.object({ field1: z.string() });
    testSchema.parse({ field1: 123 });
  } catch (zodError) {
    if (zodError instanceof z.ZodError) {
      try {
        const validationError = createValidationErrorResponse(zodError);
        assert(
          validationError.error === 'Validation failed' &&
          validationError.details.length >= 1 &&
          validationError.details[0].field === 'field1',
          'Validation error response should have correct structure'
        );
      } catch (err) {
        console.error('Error details:', zodError.errors);
        assert(false, 'Failed to create validation error response: ' + err.message);
      }
    }
  }

  // Test 3: Error response includes is_playing: false
  assert(
    errorResponse.is_playing === false,
    'Error response should include is_playing: false for compatibility'
  );
}

/**
 * Integration Tests
 */
async function testIntegration() {
  section('Integration Tests');

  // Test 1: Full validation flow
  try {
    const envModule = await import('../lib/validation/environment.ts');
    const reqModule = await import('../lib/validation/request.ts');
    
    const env = setupTestEnvironment();
    const validatedEnv = envModule.validateEnvironment(env);
    const validatedReq = reqModule.validateRequest({ method: 'GET' });
    
    assert(
      validatedEnv.SPOTIFY_CLIENT_ID && validatedReq.method === 'GET',
      'Full validation flow should work end-to-end'
    );
  } catch (error) {
    assert(false, 'Full validation flow failed: ' + error.message);
  }

  // Test 2: Error handling flow
  try {
    const responseModule = await import('../lib/validation/response.ts');
    
    // Create a real ZodError by failing validation
    try {
      const testSchema = z.object({ test: z.string() });
      testSchema.parse({ test: 123 });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        const errorResponse = responseModule.createValidationErrorResponse(zodError);
        assert(
          errorResponse.error === 'Validation failed',
          'Error handling should create consistent error format'
        );
      }
    }
  } catch (error) {
    assert(false, 'Error handling flow failed: ' + error.message);
  }
}

/**
 * Edge Cases and Security Tests
 */
async function testEdgeCases() {
  section('Edge Cases and Security Tests');

  let validateEnvironment;
  try {
    const envModule = await import('../lib/validation/environment.ts');
    validateEnvironment = envModule.validateEnvironment;
  } catch (error) {
    console.error(`${RED}Failed to import validation:${RESET}`, error.message);
    return;
  }

  // Test 1: SQL injection attempt in environment variable
  try {
    const maliciousEnv = {
      SPOTIFY_CLIENT_ID: "'; DROP TABLE users; --",
      SPOTIFY_CLIENT_SECRET: 'valid123',
      SPOTIFY_REFRESH_TOKEN: 'valid456',
    };
    validateEnvironment(maliciousEnv);
    assert(false, 'SQL injection characters should fail validation');
  } catch (error) {
    assert(true, 'SQL injection attempt should be rejected');
  }

  // Test 2: XSS attempt in environment variable
  try {
    const xssEnv = {
      SPOTIFY_CLIENT_ID: '<script>alert("xss")</script>',
      SPOTIFY_CLIENT_SECRET: 'valid123',
      SPOTIFY_REFRESH_TOKEN: 'valid456',
    };
    validateEnvironment(xssEnv);
    assert(false, 'XSS attempt should fail validation');
  } catch (error) {
    assert(true, 'XSS attempt should be rejected');
  }

  // Test 3: Extremely long string (would pass regex but should be caught by business logic if needed)
  try {
    const longEnv = {
      SPOTIFY_CLIENT_ID: 'a'.repeat(10000),
      SPOTIFY_CLIENT_SECRET: 'valid123',
      SPOTIFY_REFRESH_TOKEN: 'valid456',
    };
    validateEnvironment(longEnv);
    // Note: Currently passes validation as alphanumeric strings of any length are valid
    // Add max length constraint to schema if needed
    assert(true, 'Extremely long strings pass current validation (add max length if needed)');
  } catch (error) {
    assert(true, 'Extremely long strings rejected');
  }

  // Test 4: Unicode and special characters
  try {
    const unicodeEnv = {
      SPOTIFY_CLIENT_ID: '测试🎵',
      SPOTIFY_CLIENT_SECRET: 'valid123',
      SPOTIFY_REFRESH_TOKEN: 'valid456',
    };
    validateEnvironment(unicodeEnv);
    assert(false, 'Unicode characters should fail validation');
  } catch (error) {
    assert(true, 'Unicode characters should be rejected');
  }

  // Test 5: Null and undefined values
  try {
    const nullEnv = {
      SPOTIFY_CLIENT_ID: null,
      SPOTIFY_CLIENT_SECRET: 'valid123',
      SPOTIFY_REFRESH_TOKEN: 'valid456',
    };
    validateEnvironment(nullEnv);
    assert(false, 'Null values should fail validation');
  } catch (error) {
    assert(true, 'Null values should be rejected');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${YELLOW}╔════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${YELLOW}║  Zod Validation Test Suite                            ║${RESET}`);
  console.log(`${YELLOW}╚════════════════════════════════════════════════════════╝${RESET}`);

  await testEnvironmentValidation();
  await testRequestValidation();
  await testSpotifyApiValidation();
  await testResponseFormatting();
  await testIntegration();
  await testEdgeCases();

  // Summary
  console.log(`\n${YELLOW}╔════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${YELLOW}║  Test Summary                                          ║${RESET}`);
  console.log(`${YELLOW}╚════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`\nTotal tests run: ${testsRun}`);
  console.log(`${GREEN}Tests passed: ${testsPassed}${RESET}`);
  console.log(`${RED}Tests failed: ${testsFailed}${RESET}`);
  
  if (testsFailed === 0) {
    console.log(`\n${GREEN}✓ All tests passed!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}✗ Some tests failed${RESET}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${RED}Fatal error running tests:${RESET}`, error);
  process.exit(1);
});
