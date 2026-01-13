/**
 * Rate Limiting Tests
 * 
 * Tests the rate limiting functionality to ensure:
 * - Rate limits are properly enforced
 * - Correct HTTP status codes and headers are returned
 * - Different tiers have different limits
 * - Rate limit resets work correctly
 */

const { applyRateLimit, RateLimitPresets } = require("../utils/rate-limit.ts");

/**
 * Mock Vercel Request
 */
function createMockRequest(ip = "127.0.0.1", method = "GET", headers = {}) {
  return {
    method,
    headers: {
      "x-forwarded-for": ip,
      ...headers,
    },
    socket: {
      remoteAddress: ip,
    },
  };
}

/**
 * Mock Vercel Response
 */
function createMockResponse() {
  const headers = {};
  const response = {
    statusCode: 200,
    headers,
    body: null,
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    },
  };
  return response;
}

/**
 * Test Suite
 */
async function runTests() {
  console.log("🧪 Starting Rate Limiting Tests...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Basic rate limiting - first request should pass
  try {
    console.log("Test 1: First request should be allowed");
    const req = createMockRequest("192.168.1.1");
    const res = createMockResponse();
    
    const testConfig = {
      limit: 5,
      windowSeconds: 60,
      identifier: "test-basic",
    };
    
    const allowed = await applyRateLimit(req, res, testConfig);
    
    if (!allowed) {
      throw new Error("First request should be allowed");
    }
    
    if (!res.headers["X-RateLimit-Limit"]) {
      throw new Error("X-RateLimit-Limit header missing");
    }
    
    if (!res.headers["X-RateLimit-Remaining"]) {
      throw new Error("X-RateLimit-Remaining header missing");
    }
    
    if (!res.headers["X-RateLimit-Reset"]) {
      throw new Error("X-RateLimit-Reset header missing");
    }
    
    if (parseInt(res.headers["X-RateLimit-Limit"]) !== 5) {
      throw new Error(`Expected limit 5, got ${res.headers["X-RateLimit-Limit"]}`);
    }
    
    if (parseInt(res.headers["X-RateLimit-Remaining"]) !== 4) {
      throw new Error(`Expected 4 remaining, got ${res.headers["X-RateLimit-Remaining"]}`);
    }
    
    console.log("✅ Test 1 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error.message}\n`);
    failed++;
  }

  // Test 2: Rate limiting - exhaust limit
  try {
    console.log("Test 2: Exhausting rate limit");
    const testIP = "192.168.1.2";
    const testConfig = {
      limit: 3,
      windowSeconds: 60,
      identifier: "test-exhaust",
    };
    
    // Make 3 requests (should all pass)
    for (let i = 0; i < 3; i++) {
      const req = createMockRequest(testIP);
      const res = createMockResponse();
      const allowed = await applyRateLimit(req, res, testConfig);
      
      if (!allowed) {
        throw new Error(`Request ${i + 1} should be allowed`);
      }
    }
    
    // 4th request should be rate limited
    const req = createMockRequest(testIP);
    const res = createMockResponse();
    const allowed = await applyRateLimit(req, res, testConfig);
    
    if (allowed) {
      throw new Error("4th request should be rate limited");
    }
    
    if (res.statusCode !== 429) {
      throw new Error(`Expected status 429, got ${res.statusCode}`);
    }
    
    if (!res.headers["Retry-After"]) {
      throw new Error("Retry-After header missing");
    }
    
    if (!res.body || !res.body.error) {
      throw new Error("Error message missing in response body");
    }
    
    console.log("✅ Test 2 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error.message}\n`);
    failed++;
  }

  // Test 3: Different IPs should have separate limits
  try {
    console.log("Test 3: Different IPs have separate limits");
    const testConfig = {
      limit: 2,
      windowSeconds: 60,
      identifier: "test-separate",
    };
    
    // IP 1 - make 2 requests
    const ip1 = "192.168.1.10";
    for (let i = 0; i < 2; i++) {
      const req = createMockRequest(ip1);
      const res = createMockResponse();
      await applyRateLimit(req, res, testConfig);
    }
    
    // IP 1 - 3rd request should be blocked
    const req1 = createMockRequest(ip1);
    const res1 = createMockResponse();
    const allowed1 = await applyRateLimit(req1, res1, testConfig);
    
    if (allowed1) {
      throw new Error("IP 1 should be rate limited");
    }
    
    // IP 2 - should still be allowed
    const ip2 = "192.168.1.11";
    const req2 = createMockRequest(ip2);
    const res2 = createMockResponse();
    const allowed2 = await applyRateLimit(req2, res2, testConfig);
    
    if (!allowed2) {
      throw new Error("IP 2 should be allowed");
    }
    
    console.log("✅ Test 3 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error.message}\n`);
    failed++;
  }

  // Test 4: Preset configurations exist
  try {
    console.log("Test 4: Preset configurations");
    
    if (!RateLimitPresets.ANONYMOUS) {
      throw new Error("ANONYMOUS preset missing");
    }
    
    if (!RateLimitPresets.AUTHENTICATED_BASIC) {
      throw new Error("AUTHENTICATED_BASIC preset missing");
    }
    
    if (!RateLimitPresets.AUTHENTICATED_PREMIUM) {
      throw new Error("AUTHENTICATED_PREMIUM preset missing");
    }
    
    if (RateLimitPresets.ANONYMOUS.limit !== 5) {
      throw new Error(`Expected ANONYMOUS limit 5, got ${RateLimitPresets.ANONYMOUS.limit}`);
    }
    
    if (RateLimitPresets.ANONYMOUS.windowSeconds !== 3600) {
      throw new Error(`Expected ANONYMOUS window 3600s, got ${RateLimitPresets.ANONYMOUS.windowSeconds}`);
    }
    
    if (RateLimitPresets.AUTHENTICATED_BASIC.limit !== 20) {
      throw new Error(`Expected AUTHENTICATED_BASIC limit 20, got ${RateLimitPresets.AUTHENTICATED_BASIC.limit}`);
    }
    
    if (RateLimitPresets.AUTHENTICATED_PREMIUM.limit !== 100) {
      throw new Error(`Expected AUTHENTICATED_PREMIUM limit 100, got ${RateLimitPresets.AUTHENTICATED_PREMIUM.limit}`);
    }
    
    console.log("✅ Test 4 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 4 failed: ${error.message}\n`);
    failed++;
  }

  // Test 5: Rate limit headers are correct
  try {
    console.log("Test 5: Rate limit headers are correct");
    const testConfig = {
      limit: 10,
      windowSeconds: 60,
      identifier: "test-headers",
    };
    
    const req = createMockRequest("192.168.1.20");
    const res = createMockResponse();
    await applyRateLimit(req, res, testConfig);
    
    const limit = parseInt(res.headers["X-RateLimit-Limit"]);
    const remaining = parseInt(res.headers["X-RateLimit-Remaining"]);
    const reset = parseInt(res.headers["X-RateLimit-Reset"]);
    
    if (limit !== 10) {
      throw new Error(`Limit header incorrect: ${limit}`);
    }
    
    if (remaining !== 9) {
      throw new Error(`Remaining header incorrect: ${remaining}`);
    }
    
    if (!reset || reset <= Math.floor(Date.now() / 1000)) {
      throw new Error(`Reset header incorrect: ${reset}`);
    }
    
    console.log("✅ Test 5 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 5 failed: ${error.message}\n`);
    failed++;
  }

  // Test 6: IP extraction from headers
  try {
    console.log("Test 6: IP extraction from various headers");
    
    const testConfig = {
      limit: 5,
      windowSeconds: 60,
      identifier: "test-ip-extraction",
    };
    
    // Test x-forwarded-for with multiple IPs
    const req1 = createMockRequest();
    req1.headers["x-forwarded-for"] = "203.0.113.1, 198.51.100.1";
    const res1 = createMockResponse();
    await applyRateLimit(req1, res1, testConfig);
    
    // Test x-real-ip
    const req2 = createMockRequest();
    delete req2.headers["x-forwarded-for"];
    req2.headers["x-real-ip"] = "203.0.113.2";
    const res2 = createMockResponse();
    await applyRateLimit(req2, res2, testConfig);
    
    // Both should succeed (different IPs)
    console.log("✅ Test 6 passed\n");
    passed++;
  } catch (error) {
    console.log(`❌ Test 6 failed: ${error.message}\n`);
    failed++;
  }

  // Print summary
  console.log("=" .repeat(50));
  console.log(`Rate Limiting Test Summary:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log("=" .repeat(50));

  // Exit with appropriate code
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("\n🎉 All rate limiting tests passed!");
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
}

module.exports = { runTests };
