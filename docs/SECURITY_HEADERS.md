# Security Headers Configuration Guide

*Last updated: January 2026*

## Overview

This project implements comprehensive security headers following OWASP best practices to protect against common web vulnerabilities including XSS, clickjacking, MIME sniffing, and other attacks.

**Target Score**: A+ on [securityheaders.com](https://securityheaders.com)

## Implementation

### Current Architecture

This project uses **Vercel Serverless Functions**, not Next.js. Therefore:

- **Active Configuration**: `vercel.json` - Headers are applied to all API routes
- **Future Configuration**: `next.config.ts` - Prepared for potential Next.js migration

### Deployment Environments

- **Development**: Headers applied via `vercel.json` during local testing with `vercel dev`
- **Production**: Headers automatically applied by Vercel platform on deployment

## Security Headers Explained

### 1. Content-Security-Policy (CSP)

**Purpose**: The most powerful security header. Prevents XSS attacks, code injection, and unauthorized resource loading.

**Configuration**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.framer.com https://*.framerusercontent.com; style-src 'self' 'unsafe-inline' https://*.framer.com https://*.framerusercontent.com; img-src 'self' data: https: https://i.scdn.co https://*.spotifycdn.com https://*.scdn.co; font-src 'self' data: https://*.framer.com https://*.framerusercontent.com; connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.vercel.app https://*.framer.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;
```

**Breakdown**:

- `default-src 'self'`: By default, only load resources from same origin
- `script-src`: JavaScript sources
  - `'self'`: Same origin
  - `'unsafe-inline'`: Inline scripts (needed for Framer)
  - `'unsafe-eval'`: Dynamic code evaluation (needed for Framer)
  - `https://vercel.live`: Vercel live preview
  - `https://*.framer.com`: Framer domains
- `style-src`: CSS sources (allows inline styles for Framer Motion)
- `img-src`: Image sources
  - `data:`: Data URIs
  - `https:`: All HTTPS images
  - Spotify CDN domains for album artwork
- `font-src`: Font sources (self and Framer domains)
- `connect-src`: AJAX/fetch/WebSocket destinations
  - Spotify API for music data
  - Vercel domains for API calls
  - Framer for component functionality
- `frame-ancestors 'none'`: Prevent embedding in iframes (anti-clickjacking)
- `base-uri 'self'`: Restrict `<base>` tag to same origin
- `form-action 'self'`: Forms can only submit to same origin
- `upgrade-insecure-requests`: Automatically upgrade HTTP → HTTPS

**Security Trade-offs**:

⚠️ **Note**: `'unsafe-inline'` and `'unsafe-eval'` reduce CSP effectiveness but are required for Framer compatibility.

**Better Alternative** (for future improvement):
- Use CSP nonces for inline scripts
- Use CSP hashes for specific inline scripts
- Migrate away from `eval()`-dependent code

**Prevents**:
- ✅ XSS (Cross-Site Scripting) attacks
- ✅ Data injection attacks
- ✅ Unauthorized resource loading
- ✅ Code injection

---

### 2. X-Frame-Options

**Purpose**: Prevents clickjacking attacks by controlling whether the page can be embedded in an iframe.

**Configuration**:
```
X-Frame-Options: DENY
```

**Options**:
- `DENY`: Cannot be embedded in any iframe (most secure)
- `SAMEORIGIN`: Can only be embedded by same origin
- `ALLOW-FROM uri`: Can be embedded by specific URI (deprecated)

**Current Setting**: `DENY` - Maximum security

**Prevents**:
- ✅ Clickjacking attacks
- ✅ UI redress attacks
- ✅ Framebusting bypass attacks

---

### 3. X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing. Forces browsers to respect the `Content-Type` header.

**Configuration**:
```
X-Content-Type-Options: nosniff
```

**How It Works**:
- Without this header, browsers might "sniff" content and interpret it differently than intended
- With `nosniff`, browser strictly follows Content-Type header

**Example Attack Prevented**:
```
❌ Without nosniff:
   Attacker uploads "image.jpg" that's actually JavaScript
   Browser detects JavaScript and executes it
   
✅ With nosniff:
   Server sends Content-Type: image/jpeg
   Browser treats it as image only, won't execute as JavaScript
```

**Prevents**:
- ✅ MIME confusion attacks
- ✅ Content type sniffing exploits
- ✅ Drive-by downloads

---

### 4. Referrer-Policy

**Purpose**: Controls how much referrer information is sent with requests.

**Configuration**:
```
Referrer-Policy: strict-origin-when-cross-origin
```

**How It Works**:
- **Same-origin requests**: Send full URL as referrer
- **Cross-origin HTTPS → HTTPS**: Send only origin (not full URL)
- **HTTPS → HTTP**: Send nothing (downgrade protection)

**Example**:
```
User on: https://your-app.vercel.app/api/spotify/now-playing

Internal API call → https://your-app.vercel.app/api/test
Referrer sent: https://your-app.vercel.app/api/spotify/now-playing (full URL)

External API call → https://api.spotify.com/v1/me/player
Referrer sent: https://your-app.vercel.app (origin only)

External HTTP call → http://example.com
Referrer sent: (none)
```

**Policy Options** (from least to most private):
- `unsafe-url`: Always send full URL
- `no-referrer-when-downgrade`: Default browser behavior
- `origin`: Only send origin
- `strict-origin-when-cross-origin`: ✅ **Current (recommended)**
- `same-origin`: Only send for same-origin
- `no-referrer`: Never send referrer

**Protects**:
- ✅ User privacy
- ✅ Sensitive URL parameters
- ✅ Internal application structure

---

### 5. Permissions-Policy

**Purpose**: Restricts which browser features and APIs can be used. Reduces attack surface.

**Configuration**:
```
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

**Syntax**: `feature=(allowed-origins)`
- `()` = Disabled for all origins
- `self` = Allowed for same origin
- `*` = Allowed for all origins
- `https://example.com` = Allowed for specific origin

**Features Disabled**:
- `accelerometer=()`: Motion sensors
- `camera=()`: Camera access
- `geolocation=()`: Location services
- `gyroscope=()`: Orientation sensors
- `magnetometer=()`: Compass
- `microphone=()`: Audio recording
- `payment=()`: Payment APIs
- `usb=()`: USB device access

**Why Disable Them**:
This is a music API that doesn't need device access. Disabling unused features:
- Reduces attack surface
- Prevents permission phishing
- Improves privacy
- Signals intent to browsers and users

**Add Permission When Needed**:
```
# Example: Allow camera for same origin only
Permissions-Policy: camera=(self)
```

**Prevents**:
- ✅ Unauthorized device access
- ✅ Permission request spam
- ✅ Privacy invasion
- ✅ Side-channel attacks

---

### 6. Strict-Transport-Security (HSTS)

**Purpose**: Forces browsers to only use HTTPS connections. Protects against protocol downgrade attacks.

**Configuration**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Parameters**:
- `max-age=31536000`: Remember for 1 year (31,536,000 seconds)
- `includeSubDomains`: Apply to all subdomains

**How It Works**:
1. First visit: User accesses `https://your-app.vercel.app`
2. Server sends HSTS header
3. Browser remembers: "Always use HTTPS for this site"
4. Future visits: Browser automatically converts `http://` → `https://`
5. Expires after: 1 year (then checks again)

**Example**:
```
User types: http://your-app.vercel.app
❌ Without HSTS: Browser makes HTTP request (vulnerable to MITM)
✅ With HSTS: Browser automatically converts to HTTPS
```

**Deployment**:
- ⚠️ **Production only**: Vercel automatically applies HSTS in production
- Development: HTTP is allowed for local testing

**Prevents**:
- ✅ Protocol downgrade attacks
- ✅ SSL stripping attacks
- ✅ Man-in-the-middle (MITM) attacks
- ✅ Cookie hijacking

**HSTS Preload** (optional enhancement):
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Submit to [hstspreload.org](https://hstspreload.org)
- Browser will enforce HTTPS even on first visit
- Requires HTTPS on all subdomains forever
- ⚠️ Irreversible - only enable if fully committed to HTTPS

---

### 7. X-XSS-Protection (Legacy)

**Purpose**: Enables browser's built-in XSS filter. Legacy header but still useful for older browsers.

**Configuration**:
```
X-XSS-Protection: 1; mode=block
```

**Options**:
- `0`: Disable XSS filter
- `1`: Enable XSS filter, sanitize page
- `1; mode=block`: ✅ **Enable XSS filter, block page if attack detected**

**Modern Alternative**: Content-Security-Policy (more powerful)

**Browser Support**:
- ✅ Chrome (legacy)
- ✅ Safari
- ✅ IE/Edge (legacy)
- ❌ Firefox (never implemented)
- ⚠️ Chrome removed in 2019 (but CSP is better anyway)

**Why Still Include**:
- Provides protection for users on older browsers
- No harm in including (ignored by modern browsers)
- Defense in depth strategy

---

### 8. X-DNS-Prefetch-Control

**Purpose**: Controls DNS prefetching to improve performance while managing privacy.

**Configuration**:
```
X-DNS-Prefetch-Control: on
```

**Options**:
- `on`: Enable DNS prefetching (faster page loads)
- `off`: Disable DNS prefetching (more privacy)

**Current Setting**: `on` - Performance optimization

**How It Works**:
- Browser pre-resolves DNS for external domains on the page
- When user clicks a link, DNS is already resolved
- Results in faster navigation

**Privacy Trade-off**:
- Reveals which domains user might visit
- For this API project, external domains are necessary (Spotify)
- Benefits outweigh privacy concerns

---

## Testing Security Headers

### 1. Local Testing (Development)

Start the development server:
```bash
npm run dev
```

Test with curl:
```bash
# Test API endpoint
curl -I http://localhost:3000/api/spotify/now-playing

# Look for headers in response
```

### 2. Production Testing

After deploying to Vercel:

#### Option A: securityheaders.com (Recommended)
1. Visit [https://securityheaders.com](https://securityheaders.com)
2. Enter your API URL: `https://your-app.vercel.app/api/spotify/now-playing`
3. Click "Scan"
4. Target score: **A+**

#### Option B: Command Line
```bash
# Test deployed endpoint
curl -I https://your-app.vercel.app/api/spotify/now-playing

# Verify headers are present
```

#### Option C: Browser DevTools
1. Open your API endpoint in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on request
6. View Response Headers

### 3. Automated Testing

Add to your test suite:

```javascript
// tests/security-headers.test.js
const fetch = require('node-fetch');

test('Security headers are present', async () => {
  const response = await fetch('http://localhost:3000/api/spotify/now-playing');
  
  expect(response.headers.get('x-frame-options')).toBe('DENY');
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  expect(response.headers.get('content-security-policy')).toBeTruthy();
  expect(response.headers.get('permissions-policy')).toBeTruthy();
});
```

---

## Troubleshooting

### Issue: CSP Violations in Console

**Symptom**: Console shows errors like `Refused to execute inline script`

**Solutions**:
1. **Identify the source**: Check which resource is blocked
2. **Add to CSP**: Update `vercel.json` to allow the source
3. **Use nonces**: For inline scripts (more secure than 'unsafe-inline')
4. **Use hashes**: For specific inline scripts

**Example**:
```
❌ Console error: Refused to load script from 'https://example.com/script.js'

✅ Solution: Add to script-src in vercel.json:
"script-src 'self' https://example.com"
```

### Issue: Framer Component Not Working

**Symptom**: Component breaks after adding CSP

**Cause**: Framer uses inline scripts and styles

**Solution**: Already configured with:
- `script-src 'unsafe-inline' 'unsafe-eval'`
- `style-src 'unsafe-inline'`
- Framer domains in allowlist

### Issue: Images Not Loading

**Symptom**: Spotify album artwork not displaying

**Solution**: Verify Spotify CDN domains in CSP:
```
img-src 'self' data: https: https://i.scdn.co https://*.spotifycdn.com https://*.scdn.co
```

### Issue: CORS Errors After Adding Headers

**Symptom**: API calls fail with CORS errors

**Cause**: Security headers don't include CORS headers

**Solution**: CORS headers are separate from security headers
- Security headers: Configured in `vercel.json`
- CORS headers: Configured in `utils/cors.ts`
- Both are applied independently

---

## Environment-Specific Behavior

### Development

```bash
NODE_ENV=development npm run dev
```

**Headers Applied**: Yes (via vercel.json)
**HSTS**: Not enforced (local HTTP allowed)
**CSP**: Enforced (may see violations in console)
**CORS**: Localhost origins automatically allowed

### Production

```bash
npm run deploy
```

**Headers Applied**: Yes (via Vercel platform)
**HSTS**: Enforced by Vercel (automatic)
**CSP**: Strictly enforced
**CORS**: Only allowed origins permitted

---

## Future Improvements

### 1. Implement CSP Nonces

**Current**: Using `'unsafe-inline'` for scripts
**Better**: Generate nonces for inline scripts

```typescript
// Example nonce implementation
const nonce = generateNonce();
res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
// Then use: <script nonce="${nonce}">...</script>
```

### 2. CSP Reporting

**Add**: CSP violation reporting endpoint

```
Content-Security-Policy: ...; report-uri /api/csp-report; report-to csp-endpoint
```

Benefits:
- Monitor violations in production
- Identify legitimate vs malicious violations
- Refine CSP policy based on real usage

### 3. Subresource Integrity (SRI)

**Add**: SRI hashes for external scripts

```html
<script 
  src="https://cdn.example.com/script.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
</script>
```

### 4. HSTS Preload

**Consider**: Adding to HSTS preload list

Requirements:
- Valid HTTPS certificate
- All subdomains must support HTTPS
- HSTS max-age of at least 1 year
- `includeSubDomains` directive
- `preload` directive
- Submit to hstspreload.org

⚠️ **Warning**: Irreversible. Only enable when fully committed to HTTPS forever.

### 5. Feature Policy → Permissions Policy Migration

**Status**: Already using Permissions-Policy (modern)

**Previous**: `Feature-Policy` header (deprecated)
**Current**: `Permissions-Policy` header ✅

---

## OWASP Compliance

This configuration follows OWASP (Open Web Application Security Project) recommendations:

### OWASP Top 10 Mitigations

| OWASP Risk | Header | Protection |
|------------|--------|------------|
| A03:2021 Injection | CSP | ✅ Prevents script injection |
| A05:2021 Security Misconfiguration | All Headers | ✅ Secure defaults |
| A07:2021 Identification and Authentication | HSTS | ✅ Enforces secure transport |

### OWASP Secure Headers Project

Following [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/) recommendations:

- ✅ Content-Security-Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Strict-Transport-Security

**Target Grade**: A+ on securityheaders.com

---

## Additional Resources

### Official Documentation

- [MDN: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Vercel Headers Documentation](https://vercel.com/docs/concepts/projects/project-configuration#headers)

### Testing Tools

- [securityheaders.com](https://securityheaders.com) - Header scanner
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP policy analyzer
- [Mozilla Observatory](https://observatory.mozilla.org/) - Comprehensive security scan
- [HSTS Preload](https://hstspreload.org/) - HSTS preload list submission

### Learning Resources

- [CSP Quick Reference](https://content-security-policy.com/)
- [CanIUse: Security Headers](https://caniuse.com/?search=security%20headers) - Browser support
- [Scott Helme's Blog](https://scotthelme.co.uk/) - Security headers expert

---

## Maintenance

### When to Update Headers

1. **Adding New Integrations**
   - Add domains to CSP allowlist
   - Example: New API, CDN, or analytics service

2. **Framer Updates**
   - Test after Framer version updates
   - May need to adjust script-src or style-src

3. **Security Advisories**
   - Monitor OWASP announcements
   - Update policies based on new threats

4. **Browser Updates**
   - New security features may require policy updates
   - Deprecated features may need removal

### Documentation Updates

When modifying security headers:

1. ✅ Update `vercel.json` (production configuration)
2. ✅ Update `next.config.ts` (future migration)
3. ✅ Update this document (`docs/SECURITY_HEADERS.md`)
4. ✅ Update `README.md` (security section)
5. ✅ Test on securityheaders.com
6. ✅ Document changes in commit message

---

## Support

### Questions or Issues?

1. Check [Troubleshooting](#troubleshooting) section
2. Review [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
3. Test with [securityheaders.com](https://securityheaders.com)
4. Create a Linear issue with:
   - Header causing issue
   - Error message or symptom
   - Browser and environment
   - Steps to reproduce

---

*This documentation is maintained as part of the repository. When making changes to security headers, please update this document accordingly.*
