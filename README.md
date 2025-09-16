# Spotify Now Playing API Integration

A complete serverless API solution for displaying your Spotify "Now Playing" status in Framer projects. This project provides both a Vercel-hosted API endpoint and React components optimized for Framer integration.

**For detailed agent workflows, MCP integration, and technical implementation details, see [agents.md](./agents.md).**

## 🚀 Quick Setup

### Prerequisites

- Node.js >=18.0.0 (required)
- npm (comes with Node.js)
- Vercel account (for deployment)
- Spotify Developer account
- Git (for version control)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app with these settings:
   - **Redirect URIs** (add one or more depending on your auth method):
     - `http://localhost:8888/callback` (for server mode)
     - `https://example.com/callback` (for simple mode)
     - `https://developer.spotify.com/callback` (for manual mode)
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

This will start an interactive authentication process. You can also use specific modes:

```bash
# Interactive mode (recommended) - presents menu of options
npm run spotify-auth

# Server mode - automatic callback handling
npm run auth

# Simple mode - manual code paste
npm run auth:simple

# Manual mode - command line process
npm run auth:manual

# Exchange existing code
npm run auth:exchange YOUR_CODE
```

The script will:
- Guide you through the authorization process
- Automatically save your refresh token to `.env.local`
- Validate the token before saving
- Provide clear instructions at each step

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

## 🔧 Development Workflow

### Local Development

```bash
# Start local development server
npm run dev

# Type check TypeScript files
npm run type-check

# Run tests
npm test                # Run API tests
npm run test:auth      # Test authentication
npm run test:api       # Test API endpoints
npm run test:improved-api  # Test enhanced API features

# Validate environment variables
npm run validate:env

# Debug Vercel deployment
npm run debug:vercel
```

### Branch Naming Convention

When creating branches for development:
- Cursor Agent: `cursor/DEV-{issue-number}-{description}`
- Zed Agent: `zed/DEV-{issue-number}-{description}`
- Human developers: `{name}/DEV-{issue-number}-{description}`

Example: `cursor/DEV-15-update-readme-documentation`

### Pull Request Guidelines

1. **PR Title Format**: `[DEV-X] Brief description`
2. **PR Body Should Include**:
   - Link to Linear issue (if applicable)
   - Summary of changes
   - Testing performed
   - Screenshots for UI changes
3. **Review Process**:
   - All PRs require review before merging
   - Ensure all tests pass
   - Update relevant documentation
   - Follow conventional commit messages

### Commit Message Format

```
type(scope): description (#DEV-X)

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test additions/modifications
- chore: Build/auxiliary changes

Example:
feat(api): implement retry logic with exponential backoff (#DEV-1)
```

## 🔌 MCP & Linear Setup

### Model Context Protocol (MCP) Integration

This project is integrated with Linear through MCP, enabling IDE agents (Cursor and Zed) to manage issues directly.

#### Cursor Setup

1. Ensure you have the Linear MCP integration enabled in Cursor
2. The integration provides access to:
   - Create, update, and query Linear issues
   - Manage project metadata
   - Track issue status and assignments

#### Available MCP Commands

- `create_issue`: Create new Linear issues
- `update_issue`: Update issue status, assignee, labels
- `list_issues`: Query issues with filters
- `get_issue`: Fetch specific issue details
- `list_projects`: View all projects
- `get_project`: Get project details

#### Linear Project Details

- **Project**: Corner 16 Player
- **Project ID**: `25617bd3-75eb-4e1e-be4c-e0181f28bcf3`
- **Team**: Dev (ID: `4ea3b94e-176a-4f74-9d64-65fab2be6163`)

### Issue Workflow

1. Issues are created in Linear with clear acceptance criteria
2. Agents self-assign or are assigned by humans
3. Branch is created following naming convention
4. Development proceeds with regular commits
5. PR is created and linked to Linear issue
6. Linear automatically updates status throughout the process

For detailed Linear integration workflows, see [agents.md](./agents.md#development-workflow-with-linear).

## 🛡️ Environment Variable Validation

This project includes comprehensive environment variable validation to catch configuration errors early:

### Features:
- **Build-time validation**: Prevents deployment with missing variables
- **Detailed error messages**: Clear instructions on how to fix issues
- **Format validation**: Ensures credentials are in the correct format
- **Early failure detection**: Catches errors before runtime

### Usage:

#### Validate Environment:
```bash
npm run validate:env
```

#### Automatic Validation:
Environment variables are automatically validated:
- During `npm run deploy`
- When API endpoints are called (with helpful error messages)
- In CI/CD pipelines

#### Error Messages:
If variables are missing or invalid, you'll see detailed instructions:
```
❌ CONFIGURATION ERROR
========================
The following required environment variables are missing:

📍 SPOTIFY_CLIENT_ID
   Description: Spotify application client ID
   How to get: Get from https://developer.spotify.com/dashboard/applications
   
[Additional setup instructions...]
```

See [Environment Validation Guide](docs/ENVIRONMENT_VALIDATION_GUIDE.md) for detailed documentation.

## 📱 Using with Framer

### Component Options (Choose One):

#### Option 1: JavaScript Version (Recommended for Framer)

1. Copy the content from `components/SpotifyNowPlayingFramer.jsx`
2. Create a new code component in Framer
3. Paste the code - **should work immediately** ✅

**Why this version works best:**
- ✅ **Pure JavaScript** - No TypeScript compilation issues
- ✅ **Maximum compatibility** - Works in all Framer environments  
- ✅ **Simplified architecture** - No complex features that could cause issues
- ✅ **Direct prop access** - Uses simple prop destructuring pattern
- ✅ **Battle-tested** - Based on patterns known to work in Framer

#### Option 2: Simplified TypeScript Version

1. Copy the content from `components/SpotifyNowPlayingSimple.tsx`
2. Create a new code component in Framer
3. Paste the code

**Features:**
- ✅ **Simplified TypeScript** - Minimal typing for better compatibility
- ✅ **Reduced complexity** - No error boundaries or lazy loading
- ✅ **Self-contained** - All definitions inline

#### Option 3: Full-Featured TypeScript Version

1. Copy the content from `components/SpotifyNowPlaying.tsx`
2. Create a new code component in Framer
3. May require additional troubleshooting in some Framer environments

### Component Integration:

All versions come pre-configured with the deployment URL. The `apiUrl` prop is set by default:

```javascript
// Default API URL in all components
apiUrl = "https://corner16-now-playing-135s3pi0h-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing"

// Update to your deployed URL via the component properties panel
// Or modify the default value in the code
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

## 📦 Project Structure

```
spotify-now-playing-api/
├── 📁 api/                          # Vercel serverless functions
│   ├── test.js                      # Basic API health check endpoint
│   └── 📁 spotify/
│       ├── now-playing.js           # 🔥 Main API endpoint with retry logic
│       └── [other debug/test files] # Various debugging utilities
├── 📁 components/                   # React components for Framer
│   ├── SpotifyNowPlayingFramer.jsx  # ✅ JavaScript version (recommended)
│   ├── SpotifyNowPlayingSimple.tsx  # Simplified TypeScript version
│   ├── SpotifyNowPlaying.tsx        # Full-featured TypeScript version
│   └── AnimatedComponents.jsx       # Animation components
├── 📁 scripts/                      # Authentication and utility scripts
│   ├── spotify-auth.js              # 🔧 Unified auth script (npm run auth)
│   ├── auth-utils.js                # Authentication helper utilities
│   ├── validate-env.js              # Environment validation
│   └── 📁 legacy/                   # Deprecated auth scripts
├── 📁 tests/                        # Test files
│   ├── api.test.js                  # API endpoint tests
│   ├── auth.test.js                 # Authentication tests
│   └── improved-api.test.js         # Enhanced API tests
├── 📁 docs/                         # Documentation
│   └── ENVIRONMENT_VALIDATION_GUIDE.md  # Env validation guide
├── 📁 utils/                        # Utility functions
│   ├── cors.ts                      # CORS configuration
│   ├── envMiddleware.js             # Environment middleware
│   └── validateEnvironment.js       # Environment validation
├── 📁 types/                        # TypeScript type definitions
│   ├── components.ts                # Component types
│   └── spotify.ts                   # Spotify API types
├── .env.example                     # Environment template
├── .env.local                       # Your local environment (gitignored)
├── agents.md                        # 📚 Agent workflows and technical docs
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file
```

### Key Files and Their Purpose

- **`api/spotify/now-playing.js`**: Core API endpoint with token refresh, error handling, and retry logic
- **`components/SpotifyNowPlayingFramer.jsx`**: Production-ready React component optimized for Framer
- **`scripts/spotify-auth.js`**: Unified authentication tool supporting multiple auth modes
- **`agents.md`**: Comprehensive documentation for agent workflows, Linear integration, and development processes
- **`vercel.json`**: Production deployment configuration with CORS and function settings

For detailed file purposes and implementation examples, see [agents.md](./agents.md#actual-file-structure).

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

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Documentation Update Policy

**IMPORTANT**: When making changes that affect workflows or integrations, you must update:
1. **README.md** - User-facing documentation and setup instructions
2. **agents.md** - Technical details, agent workflows, and Linear integration

### When to Update Documentation

Update **agents.md** when:
- Adding new tools or dependencies
- Changing workflow processes
- Modifying Linear integration
- Shifting agent responsibilities
- Discovering new patterns or gotchas

Update **README.md** when:
- Setup instructions change
- New features are added
- API endpoints are modified
- Deployment process changes
- User-facing documentation needs updates

### Contribution Process

1. Check for existing issues in Linear or open PRs
2. Create a branch following our naming convention
3. Make your changes with clear, descriptive commits
4. Update relevant documentation
5. Create a PR with a link to the Linear issue
6. Ensure all tests pass and documentation is updated

For detailed contribution workflows and Linear integration, see [agents.md](./agents.md#development-workflow-with-linear).

## 🐛 Troubleshooting

### Common Issues

#### "Token refresh failed"
- Verify your `SPOTIFY_CLIENT_SECRET` is correct
- Re-run the authorization script to get a new refresh token
- Check that all environment variables are properly set in Vercel

#### "Nothing playing" always shows
- Check if you're actually playing music on Spotify
- Verify your refresh token is valid and properly set
- Ensure you have the correct scopes: `user-read-currently-playing user-read-playback-state`
- Test the API endpoint directly to see the response

#### CORS errors in Framer
- Make sure you're using the full deployed URL (not localhost)
- **Configure ALLOWED_ORIGINS environment variable** with your domain(s)
- Check that your domain is included in the allowed origins list
- In development, localhost origins are automatically allowed

### MCP & Linear Integration Issues

#### Linear MCP Connection Errors
- Ensure Linear MCP is properly configured in your IDE (Cursor/Zed)
- Verify you have the correct API permissions
- Check that project and team IDs match those in [agents.md](./agents.md#current-linear-setup)

#### Linear Sync Issues
- Issues may take a moment to sync between Linear and GitHub
- Ensure PR titles include `[DEV-X]` format for automatic linking
- Check that branch names follow the convention for proper tracking

#### Agent-Specific Issues
- **Cursor Agent**: Ensure you have the latest MCP integration installed
- **Zed Agent**: Verify Linear API access is configured
- For detailed agent troubleshooting, see [agents.md](./agents.md#agent-roles-and-responsibilities)

### Environment Variable Issues

#### Missing Environment Variables
```bash
# Validate your environment setup
npm run validate:env
```

This will provide detailed error messages about missing or invalid variables.

#### Environment Variable Format
- `SPOTIFY_CLIENT_ID`: 32-character string
- `SPOTIFY_CLIENT_SECRET`: 32-character string
- `SPOTIFY_REFRESH_TOKEN`: Long string obtained from auth process
- `ALLOWED_ORIGINS`: Comma-separated list of domains

For comprehensive environment validation documentation, see [Environment Validation Guide](docs/ENVIRONMENT_VALIDATION_GUIDE.md)

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

## 📚 Additional Resources

### Documentation

- **[agents.md](./agents.md)** - Comprehensive guide for:
  - Agent roles and responsibilities (Cursor, Zed, Human)
  - MCP Linear integration details
  - Development workflow with Linear
  - Architectural decisions and ADRs
  - Project-specific gotchas and patterns
  - Maintenance instructions

- **[Environment Validation Guide](docs/ENVIRONMENT_VALIDATION_GUIDE.md)** - Detailed environment setup and validation

- **[Legacy Auth Scripts README](scripts/legacy/README.md)** - Documentation for deprecated authentication methods

### Quick Links

- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) - Create and manage Spotify apps
- [Vercel Dashboard](https://vercel.com) - Deploy and manage your API
- [Linear](https://linear.app) - Issue tracking and project management

### Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [agents.md](./agents.md) for technical details
3. Create an issue in Linear if you have access
4. Open a GitHub issue for public contributions

---

*Last updated: September 2025 - For the latest project status and completed work, see [agents.md](./agents.md#current-project-snapshot)*