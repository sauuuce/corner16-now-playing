/**
 * Security Headers Test Suite
 * 
 * Tests that all OWASP-recommended security headers are properly configured
 * Target: A+ score on securityheaders.com
 */

const http = require('http');

// Configuration
const TEST_HOST = 'localhost';
const TEST_PORT = 3000;
const TEST_PATH = '/api/spotify/now-playing';

/**
 * Make HTTP request and return headers
 */
function getHeaders(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      resolve(res.headers);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test individual security header
 */
function testHeader(headerName, expectedValue, actualValue) {
  const exists = actualValue !== undefined;
  const matches = expectedValue ? actualValue === expectedValue : exists;

  return {
    name: headerName,
    exists,
    expected: expectedValue || 'present',
    actual: actualValue || 'missing',
    passed: matches
  };
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🔒 Security Headers Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Testing: http://${TEST_HOST}:${TEST_PORT}${TEST_PATH}\n`);

  try {
    // Get headers from server
    console.log('📡 Fetching headers...\n');
    const headers = await getHeaders(TEST_HOST, TEST_PORT, TEST_PATH);

    // Define expected headers
    const tests = [
      {
        name: 'Content-Security-Policy',
        key: 'content-security-policy',
        validate: (value) => {
          const required = [
            "default-src 'self'",
            'frame-ancestors',
            'upgrade-insecure-requests'
          ];
          return required.every(directive => value && value.includes(directive));
        }
      },
      {
        name: 'X-Frame-Options',
        key: 'x-frame-options',
        expected: 'DENY'
      },
      {
        name: 'X-Content-Type-Options',
        key: 'x-content-type-options',
        expected: 'nosniff'
      },
      {
        name: 'Referrer-Policy',
        key: 'referrer-policy',
        expected: 'strict-origin-when-cross-origin'
      },
      {
        name: 'Permissions-Policy',
        key: 'permissions-policy',
        validate: (value) => {
          const required = ['camera=', 'microphone=', 'geolocation='];
          return required.every(feature => value && value.includes(feature));
        }
      },
      {
        name: 'Strict-Transport-Security',
        key: 'strict-transport-security',
        validate: (value) => value && value.includes('max-age') && value.includes('includeSubDomains')
      },
      {
        name: 'X-XSS-Protection',
        key: 'x-xss-protection',
        expected: '1; mode=block'
      },
      {
        name: 'X-DNS-Prefetch-Control',
        key: 'x-dns-prefetch-control',
        expected: 'on'
      }
    ];

    // Run tests
    const results = [];
    let passed = 0;
    let failed = 0;

    console.log('📋 Test Results:');
    console.log('───────────────────────────────────────────────────────\n');

    for (const test of tests) {
      const headerValue = headers[test.key];
      const exists = headerValue !== undefined;

      let testPassed = false;
      let status = '';
      let details = '';

      if (!exists) {
        testPassed = false;
        status = '❌ FAIL';
        details = 'Header not found';
      } else if (test.expected) {
        testPassed = headerValue === test.expected;
        status = testPassed ? '✅ PASS' : '❌ FAIL';
        details = testPassed 
          ? `Value: "${headerValue}"`
          : `Expected: "${test.expected}", Got: "${headerValue}"`;
      } else if (test.validate) {
        testPassed = test.validate(headerValue);
        status = testPassed ? '✅ PASS' : '❌ FAIL';
        details = testPassed
          ? 'Validation passed'
          : `Validation failed: ${headerValue}`;
      } else {
        testPassed = true;
        status = '✅ PASS';
        details = `Value: "${headerValue}"`;
      }

      if (testPassed) passed++;
      else failed++;

      console.log(`${status} ${test.name}`);
      console.log(`    ${details}\n`);

      results.push({
        name: test.name,
        passed: testPassed,
        exists,
        value: headerValue
      });
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);

    if (failed === 0) {
      console.log('🎉 All security headers are properly configured!');
      console.log('✨ Ready for securityheaders.com testing\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some security headers need attention.');
      console.log('📖 See docs/SECURITY_HEADERS.md for configuration help\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error running tests:', error.message);
    console.error('\n💡 Make sure the development server is running:');
    console.error('   npm run dev\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, getHeaders, testHeader };
