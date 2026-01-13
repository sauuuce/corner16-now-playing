# Zod Input Validation Implementation

This document describes the comprehensive Zod validation implementation for the Spotify Now Playing API.

## Overview

All API routes now use [Zod](https://github.com/colinhacks/zod) v3.23.8 for type-safe input/output validation, addressing security concerns around injection attacks and malformed input.

## Architecture

### Validation Layers

The implementation provides validation at multiple layers:

1. **Environment Variables** - Validates Spotify API credentials
2. **HTTP Requests** - Validates HTTP methods and query parameters  
3. **External API Responses** - Validates Spotify API responses
4. **Client Responses** - Ensures consistent error formatting

### File Structure

```
lib/validation/
├── index.ts              # Central export
├── environment.ts        # Environment variable schemas
├── request.ts           # API request schemas
├── spotify-api.ts       # Spotify API response schemas
└── response.ts          # API response schemas

utils/
└── envMiddleware.ts     # Zod-based environment validation middleware

api/spotify/
├── now-playing.js       # Legacy API (manual validation)
├── now-playing-validated.js  # With env middleware
└── now-playing-zod.ts   # Full Zod validation (recommended)

tests/
└── validation.test.js   # Comprehensive validation test suite (30 tests)
```

## Validation Schemas

### Environment Variables

**File:** `lib/validation/environment.ts`

```typescript
spotifyEnvSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string()
    .min(1)
    .regex(/^[a-zA-Z0-9]+$/),
  SPOTIFY_CLIENT_SECRET: z.string()
    .min(1)
    .regex(/^[a-zA-Z0-9]+$/),
  SPOTIFY_REFRESH_TOKEN: z.string()
    .min(1)
    .regex(/^[a-zA-Z0-9_-]+$/),
});
```

**Security Features:**
- Rejects empty strings
- Allows only alphanumeric characters (prevents injection)
- Validates format before use

### HTTP Requests

**File:** `lib/validation/request.ts`

```typescript
httpMethodSchema = z.enum(['GET', 'OPTIONS']);
nowPlayingQuerySchema = z.object({
  cache: z.enum(['enabled', 'disabled']).optional(),
  format: z.enum(['json']).optional().default('json'),
}).strict(); // Rejects unknown parameters
```

**Security Features:**
- Only allows GET and OPTIONS methods
- Strict mode rejects unexpected query parameters
- Type-safe query parameter validation

### Spotify API Responses

**File:** `lib/validation/spotify-api.ts`

```typescript
spotifyTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive(),
  // ... other fields
});

spotifyCurrentlyPlayingSchema = z.object({
  is_playing: z.boolean(),
  currently_playing_type: z.enum(['track', 'episode', 'ad', 'unknown']),
  progress_ms: z.number().int().nonnegative().optional(),
  item: z.union([spotifyTrackSchema, z.null()]),
  // ... other fields
});
```

**Security Features:**
- Validates all external API responses before processing
- Ensures type safety for downstream code
- Safe parsing mode available (doesn't throw)

### API Responses

**File:** `lib/validation/response.ts`

```typescript
// Consistent error response format
errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  hint: z.string().optional(),
  is_playing: z.literal(false).optional(),
});

// Validation error response (400 status)
validationErrorResponseSchema = z.object({
  error: z.literal('Validation failed'),
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
  })),
  is_playing: z.literal(false).optional(),
});
```

**Features:**
- Consistent error format across all endpoints
- Field-level error messages for validation failures
- 400 status for validation errors, 500 for server errors

## Usage Examples

### Using Validated API Route

**Endpoint:** `/api/spotify/now-playing-zod.ts`

This route implements full Zod validation:

```typescript
import { validateEnvironment, validateRequest, validateTokenResponse } from '../../lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate request
    const validatedRequest = validateRequest({
      method: req.method,
      query: req.query,
    });

    // Validate environment
    const env = validateEnvironment(process.env);

    // ... use validated data safely
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return 400 with validation error details
      return res.status(400).json(createValidationErrorResponse(error));
    }
    // ... handle other errors
  }
}
```

### Using Environment Middleware

**File:** `utils/envMiddleware.ts`

```typescript
import { withEnvValidation } from '../utils/envMiddleware';

async function handler(req: ValidatedRequest, res: VercelResponse) {
  // Environment is pre-validated and available
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = req.validatedEnv;
  // ... use safely
}

export default withEnvValidation(handler);
```

## Error Handling

### Validation Errors (400 Bad Request)

When validation fails, the API returns a structured error response:

```json
{
  "error": "Validation failed",
  "message": "Request validation failed. Please check the provided data.",
  "details": [
    {
      "field": "method",
      "message": "Method not allowed. Only GET requests are supported.",
      "code": "invalid_enum_value"
    }
  ],
  "is_playing": false
}
```

### Server Errors (500 Internal Server Error)

For server-side issues:

```json
{
  "error": "Server configuration error",
  "message": "Missing or invalid environment variables",
  "hint": "Please check your .env file and ensure all Spotify credentials are set",
  "is_playing": false
}
```

## Testing

### Running Validation Tests

```bash
# Run validation test suite (30 tests)
npm run test:validation

# Run all tests
npm run test:all
```

### Test Coverage

The validation test suite covers:

1. **Environment Validation** (6 tests)
   - Valid credentials
   - Missing variables
   - Empty strings
   - Invalid characters

2. **Request Validation** (7 tests)
   - Valid GET/OPTIONS requests
   - Invalid HTTP methods (POST, PUT, DELETE)
   - Query parameter validation

3. **Spotify API Validation** (7 tests)
   - Token responses
   - Currently playing responses
   - Missing required fields
   - Safe parsing

4. **Response Formatting** (3 tests)
   - Error response structure
   - Validation error structure
   - Compatibility fields

5. **Integration Tests** (2 tests)
   - End-to-end validation flow
   - Error handling flow

6. **Security & Edge Cases** (5 tests)
   - SQL injection attempts
   - XSS attempts
   - Unicode characters
   - Null values
   - Extremely long strings

## Security Benefits

### Injection Attack Prevention

The regex validation patterns prevent common injection attacks:

- **SQL Injection:** `'; DROP TABLE users; --` → Rejected (non-alphanumeric)
- **XSS:** `<script>alert("xss")</script>` → Rejected (HTML tags)
- **Command Injection:** `; rm -rf /` → Rejected (special chars)

### Type Safety

Zod ensures runtime type safety:
- Prevents type coercion vulnerabilities
- Catches type mismatches at the API boundary
- Provides clear error messages for debugging

### Input Sanitization

All inputs are validated before use:
- Environment variables checked at startup
- Request parameters validated per-request
- External API responses validated before processing

## Migration Guide

### From Manual Validation

**Before:**
```javascript
if (!SPOTIFY_CLIENT_ID || typeof SPOTIFY_CLIENT_ID !== 'string') {
  throw new Error('Invalid CLIENT_ID');
}
```

**After:**
```typescript
import { validateEnvironment } from '../lib/validation';

const env = validateEnvironment(process.env);
// env is now type-safe and validated
```

### From Existing API Routes

To migrate existing routes to use Zod validation:

1. Import validation schemas:
   ```typescript
   import { validateEnvironment, validateRequest } from '../../lib/validation';
   ```

2. Replace manual checks with schema validation:
   ```typescript
   const validatedRequest = validateRequest({ method: req.method, query: req.query });
   const env = validateEnvironment(process.env);
   ```

3. Use consistent error responses:
   ```typescript
   catch (error) {
     if (error instanceof z.ZodError) {
       return res.status(400).json(createValidationErrorResponse(error));
     }
   }
   ```

## Performance Considerations

- **Minimal Overhead:** Zod validation adds ~1-2ms per request
- **Early Validation:** Fails fast on invalid input
- **Schema Caching:** Schemas are compiled once at import time
- **Production Ready:** Used by major projects in production

## Best Practices

1. **Always validate at boundaries:**
   - Environment variables at startup
   - Request data on entry
   - External API responses before use

2. **Use safe parsing for external data:**
   ```typescript
   const result = safeValidateSpotifyResponse(data);
   if (!result.success) {
     // Handle gracefully
   }
   ```

3. **Provide helpful error messages:**
   - Include field names
   - Explain what's expected
   - Add hints for common issues

4. **Keep schemas close to usage:**
   - Organize by domain (environment, request, response)
   - Export typed interfaces
   - Document validation rules

## Troubleshooting

### Common Issues

**Issue:** "Missing or invalid environment variables"
- **Solution:** Check `.env` file has all required credentials
- **Test:** Run `npm run test:env`

**Issue:** "Validation failed: method not allowed"
- **Solution:** Only GET and OPTIONS methods are supported
- **Test:** Check request method in client code

**Issue:** "Invalid token response from Spotify"
- **Solution:** Spotify credentials may be expired
- **Test:** Run `npm run spotify-auth` to refresh

## References

- [Zod Documentation](https://zod.dev/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

## Version History

- **v1.0** (2026-01-13): Initial Zod validation implementation
  - Environment validation
  - Request validation
  - Response validation
  - 30 test cases
  - Security hardening
