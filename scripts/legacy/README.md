# Legacy Authentication Scripts

This folder contains the original authentication scripts that have been replaced by the consolidated `spotify-auth.js` script.

## Why These Scripts Were Moved

These scripts were moved here as part of the authentication consolidation effort (Linear issue DEV-8) to:
- Reduce code duplication
- Provide a single, consistent authentication experience
- Simplify maintenance
- Improve error handling and user guidance

## Original Scripts

1. **get-refresh-token-simple.js** - Express server with manual code paste form
2. **get-refresh-token.js** - Express server with automatic callback handling
3. **exchange-token.js** - CLI tool for exchanging authorization code (fixed redirect URI)
4. **exchange-token-flexible.js** - CLI tool for exchanging authorization code (flexible redirect URI)
5. **manual-auth.js** - Generates auth URL for manual process

## Migration Guide

The new consolidated script (`spotify-auth.js`) provides all the functionality of these legacy scripts:

| Old Script | New Command |
|------------|-------------|
| `node scripts/get-refresh-token-simple.js` | `npm run auth:simple` |
| `node scripts/get-refresh-token.js` | `npm run auth` or `npm run auth:server` |
| `node scripts/exchange-token.js CODE` | `npm run auth:exchange CODE` |
| `node scripts/exchange-token-flexible.js CODE URI` | `npm run auth:exchange CODE URI` |
| `node scripts/manual-auth.js` | `npm run auth:manual` |

## Interactive Mode

The new script also supports an interactive mode when run without arguments:
```bash
npm run spotify-auth
```

This will present a menu to choose the desired authentication method.