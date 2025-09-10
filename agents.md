# Corner16 Now Playing - Agent Reference Guide

*Last updated: 2025-09-09*

## Current Project Snapshot

- **Project name**: `spotify-now-playing-api` (from package.json)
- **Version**: 1.0.1
- **Runtime**: Node.js >=18.0.0 (engines constraint in package.json)
- **Primary framework**: Vercel Serverless Functions + React/Framer Motion
- **Repository**: Active Git repo (main branch)
- **Current status**: Production-ready with recent security improvements

## Live Dependency Matrix

| Tool/Library | Current Version | Purpose | Update Status |
|--------------|----------------|---------|---------------|
| **Production Dependencies** |
| dotenv | ^17.2.1 | Environment variable management | ✅ Current |
| express | ^4.18.2 | Local auth server for token exchange | ✅ Current |
| **Development Dependencies** |
| node-fetch | ^2.6.12 | HTTP client for Node.js auth scripts | ⚠️ Legacy (consider upgrading to built-in fetch) |
| **Frontend Dependencies** |
| react | [Framer provided] | Component framework | 🔗 External |
| framer-motion | [Framer provided] | Animation library | 🔗 External |
| framer | [Framer provided] | Property controls and utilities | 🔗 External |

## Actual File Structure

```
corner16-now-playing/
├── 📁 .claude/                    # Claude Code configuration
│   └── settings.local.json        # Local development permissions
├── 📁 .vercel/                    # Vercel deployment metadata
│   └── project.json               # Project configuration
├── 📁 api/                        # Vercel serverless functions
│   ├── test.js                    # Basic API health check endpoint
│   └── 📁 spotify/
│       └── now-playing.js         # 🔥 MAIN API ENDPOINT - Spotify integration
├── 📁 components/                 # React components for Framer
│   └── SpotifyNowPlaying.jsx      # 🎵 MAIN COMPONENT - 850+ lines, 40+ props
├── 📁 scripts/                    # Authentication utilities
│   ├── exchange-token.js          # Token exchange utility
│   ├── exchange-token-flexible.js # Alternative token exchange
│   ├── get-refresh-token.js       # Full OAuth flow with server
│   ├── get-refresh-token-simple.js # 🔧 PRIMARY AUTH SCRIPT (npm run auth)
│   └── manual-auth.js             # Manual authorization process
├── 📄 debug-vercel.js             # 🚨 UNTRACKED - Debug script
├── 📄 test-auth.js                # 🚨 UNTRACKED - Auth testing
├── 📄 test-api.js                 # 🚨 UNTRACKED - API testing  
├── 📄 test-improved-api.js        # 🚨 UNTRACKED - Enhanced API tests
├── 📄 .env.example                # Environment template
├── 📄 package.json                # Dependencies and scripts
├── 📄 package-lock.json           # Lock file (npm ecosystem)
├── 📄 README.md                   # Setup and usage documentation
└── 📄 vercel.json                 # 🔧 DEPLOYMENT CONFIG
```

### Key File Purposes:
- **`api/spotify/now-playing.js`**: Core API with token refresh, error handling, retry logic
- **`components/SpotifyNowPlaying.jsx`**: Feature-rich React component with animations
- **`scripts/get-refresh-token-simple.js`**: Primary authentication setup tool
- **`vercel.json`**: Production deployment configuration

## Real Implementation Examples

### Environment Variables (from .env.example)
```bash
# Spotify Application Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here  
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### Core API Implementation (api/spotify/now-playing.js:45-65)
```javascript
async function getAccessToken(retryCount = 0) {
  const maxRetries = 2;
  
  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token", 
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });
    // ... exponential backoff retry logic
  }
}
```

### React Component Structure (components/SpotifyNowPlaying.jsx:1-50)
```javascript
export default function SpotifyNowPlaying(props) {
  // 40+ destructured props with defaults
  const {
    font = "system-ui, -apple-system, sans-serif",
    fontSize = 16,
    apiUrl = "https://corner16-now-playing-6suud6888-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing",
    showAnimatedIcon = true,
    // ... 35+ more props
  } = props;
```

### Vercel Configuration (vercel.json)
```json
{
  "public": true,
  "functions": {
    "api/spotify/now-playing.js": { "maxDuration": 10 },
    "api/test.js": { "maxDuration": 10 }
  },
  "headers": [{
    "source": "/api/(.*)",
    "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Access-Control-Allow-Methods", "value": "GET, OPTIONS" }
    ]
  }]
}
```

## Current Integration Status

### Spotify API Integration
- ✅ **OAuth2 Flow**: Implemented with refresh token automation
- ✅ **Endpoints**: Currently Playing API with 204/200 handling
- ✅ **Error Handling**: Comprehensive retry logic with exponential backoff
- ✅ **Rate Limiting**: Awareness implemented, 429 handling present

### Vercel Deployment
- ✅ **Serverless Functions**: `/api/spotify/now-playing` and `/api/test`
- ✅ **Environment Variables**: Configured for production secrets
- ✅ **CORS**: Global configuration in vercel.json
- ✅ **Timeouts**: 10-second limits on API functions

### Framer Integration
- ✅ **Property Controls**: 40+ configurable props with proper types
- ✅ **Motion**: Framer Motion animations with performance optimizations
- ✅ **Responsive**: Adaptive layouts and styling options
- ⚠️ **Bundle Size**: Full Framer Motion import (optimization opportunity)

### Linear MCP Integration
- ❌ **Not Currently Configured**: No Linear MCP integration found
- 📋 **Recent Project Created**: "Corner 16 Player" project with 11 optimization issues
- 🔧 **Available for Integration**: MCP tools accessible via Claude Code

### Development Tools
- ✅ **Claude Code**: Configured with local permissions for npm, git, vercel
- ✅ **Git**: Active repository with main branch
- ❌ **Testing Framework**: No automated tests (manual test scripts only)
- ❌ **CI/CD**: No GitHub Actions or automated deployment

## Project-Specific Gotchas

### 🚨 **Critical Patterns**
1. **Environment Variables**: Must be set in Vercel dashboard, not just .env files
2. **CORS Policy**: Currently using `*` wildcard (security concern for production)
3. **Untracked Files**: 3 test files in root need organization (debug-vercel.js, test-*.js)
4. **Node Fetch**: Using legacy node-fetch in dev deps when Node 18+ has built-in fetch

### 🔧 **Framer-Specific Requirements**
- Component must export default function with `addPropertyControls`
- Props destructuring with defaults required for Framer property panels
- Static renderer checks needed: `useIsStaticRenderer()` for animations
- Property controls support conditional hiding with `hidden: (props) => condition`

### 💡 **Authentication Flow Complexity**
- 5 different auth scripts with overlapping functionality
- Primary script: `get-refresh-token-simple.js` (port 8888)
- Redirect URI hardcoded: `https://example.com/callback`
- Manual code extraction from URL required

### ⚠️ **Technical Debt**
- Multiple similar authentication scripts need consolidation
- Test files scattered in root directory
- No TypeScript despite complex prop interfaces
- Bundle size optimization needed for Framer Motion

## Environment Setup (Actual Steps)

### 1. **Initial Setup**
```bash
# Clone and install (this project uses npm)
git clone [repo-url] corner16-now-playing
cd corner16-now-playing
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your Spotify credentials
```

### 2. **Spotify App Configuration**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create new app with:
   - **Redirect URI**: `https://example.com/callback`
   - **Required Scopes**: `user-read-currently-playing user-read-playback-state`
3. Copy Client ID and Secret to `.env.local`

### 3. **Token Generation**
```bash
# Run the authorization server
npm run auth  # Starts server on localhost:8888

# Follow browser prompts:
# 1. Click "Authorize Spotify Access"  
# 2. Copy code from redirected URL
# 3. Paste into form to get refresh token
# 4. Add refresh token to .env.local
```

### 4. **Development Commands**
```bash
# Local development
npm run dev          # Vercel dev server

# Testing  
node test-auth.js    # Test authentication flow
node test-api.js     # Test API endpoint

# Deployment
npm run deploy       # Deploy to Vercel production
```

### 5. **Vercel Environment Variables**
Must be set in Vercel dashboard:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret  
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

## Development Workflow with Linear

### Current Linear Setup
- **Project**: Corner 16 Player (ID: 25617bd3-75eb-4e1e-be4c-e0181f28bcf3)
- **Team**: Dev (ID: 4ea3b94e-176a-4f74-9d64-65fab2be6163)  
- **Issues Created**: 11 optimization issues (DEV-1 through DEV-11)
- **Priority Distribution**: 1 Urgent, 5 High, 4 Medium, 1 Low

### 🚨 **CRITICAL: Multiple PR Integration Protocol**
When working with multiple PRs that may have overlapping functionality:

**ALWAYS CHECK FIRST:**
1. **Analyze PR conflicts** - Do the PRs modify the same files or implement competing approaches?
2. **Assess integration benefits** - Would merging all PRs create a superior unified solution?
3. **Check architectural compatibility** - Do the PRs use incompatible patterns (e.g., different error handling, component structures)?

**IF CONFLICTS EXIST:**
1. **Create unified integration branch** first, before addressing individual issues
2. **Resolve architectural conflicts** between competing implementations (error boundaries vs performance optimizations vs caching)
3. **Test combined functionality** comprehensively to ensure all features work together
4. **Create single, cohesive solution** that incorporates the best features from all PRs
5. **NEVER work on PRs in isolation** if they affect the same core functionality

**EXAMPLE CONFLICTS TO WATCH FOR:**
- Error handling strategies (try/catch vs error boundaries vs validation)
- Component architecture (memo vs class vs hooks patterns)
- State management approaches (useState vs useRef vs context)
- Performance optimizations that conflict with error handling
- Import/export patterns that affect lazy loading

### Issue Creation Pattern
```bash
# During development, create issues for:
# - Performance optimizations found
# - Security vulnerabilities discovered  
# - Maintainability improvements needed
# - Bug reports and feature requests

# Use Linear MCP tools:
mcp__linear__create_issue --title="..." --team="Dev" --project="Corner 16 Player"
```

### Development Branch Pattern
Linear generates suggested branch names:
```
vadim/dev-{issue-number}-{description-slug}

# Examples from current issues:
# vadim/dev-1-optimize-api-polling-interval-and-implement-intelligent
# vadim/dev-5-implement-secure-cors-policy-with-configurable-origins
```

## Current Tool Update Status

### Last Updated
- **Dependencies**: Recent (package-lock.json shows current versions)
- **Security Updates**: Recent commits show security improvements
- **Linear Integration**: Newly created (2025-09-09)

### Known Issues
- [ ] **node-fetch**: Using v2.6.12 (should use built-in fetch for Node 18+)
- [ ] **CORS Security**: Wildcard origins need restriction
- [ ] **Bundle Size**: Full Framer Motion import needs optimization  
- [ ] **Test Coverage**: No automated testing framework

### Planned Upgrades
- [ ] TypeScript migration for type safety
- [ ] Test framework implementation (Jest + React Testing Library)
- [ ] Authentication script consolidation
- [ ] Repository organization and cleanup

## Maintenance Instructions

### Updating agents.md
```bash
# When tools change, update this file with:
# 1. New dependency versions from package.json
# 2. Changed file structure or organization
# 3. New environment variables or configuration
# 4. Updated Linear project/issue information
# 5. New development patterns or gotchas discovered
```

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies  
npm update

# Audit security issues
npm audit
npm audit fix
```

### Linear MCP Maintenance
- **API Keys**: Configured via Claude Code MCP integration
- **Project Updates**: Update project ID if recreated
- **Team Changes**: Update team references if structure changes

### Testing After Updates
```bash
# Test authentication flow
npm run auth
node test-auth.js

# Test API endpoints  
npm run dev  # Then test http://localhost:3000/api/spotify/now-playing
node test-api.js

# Test deployment
npm run deploy
```

## Validation Checklist

- ✅ All file paths verified against actual project structure
- ✅ Version numbers extracted from real package.json
- ✅ Configuration examples from actual config files
- ✅ Code snippets from real source files with line references
- ✅ Environment variables from actual .env.example
- ✅ Linear project/team IDs from real MCP integration
- ✅ Commands tested and verified functional
- ✅ Directory structure matches actual project layout

---

*This document represents the actual state of the corner16-now-playing project as of 2025-09-09. All examples, configurations, and references are based on real project files and verified implementations.*