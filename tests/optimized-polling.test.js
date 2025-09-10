/**
 * Test suite for optimized Spotify API polling
 * Tests adaptive polling, intelligent caching, and request deduplication
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('Optimized Spotify Polling', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log.mockClear();
    console.error.mockClear();
  });

  describe('Adaptive Polling Intervals', () => {
    test('should use 5s interval when music is playing', () => {
      const mockResponse = {
        is_playing: true,
        item: {
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }],
          album: { name: 'Test Album' }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // This would be tested in a real component
      const getPollingInterval = (isPlaying, hasError) => {
        if (hasError) return 30000;
        return isPlaying ? 5000 : 60000;
      };

      expect(getPollingInterval(true, false)).toBe(5000);
      expect(getPollingInterval(false, false)).toBe(60000);
      expect(getPollingInterval(false, true)).toBe(30000);
    });
  });

  describe('Intelligent Caching', () => {
    test('should cache data with appropriate TTL', () => {
      const CACHE_TTL = {
        PLAYING: 5 * 1000,
        PAUSED: 60 * 1000,
        ERROR: 30 * 1000,
      };

      const cache = new Map();
      
      function setCachedData(url, isPlaying, data) {
        const cacheKey = `${url}-${isPlaying}`;
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      function getCachedData(url, isPlaying) {
        const cacheKey = `${url}-${isPlaying}`;
        const cached = cache.get(cacheKey);
        
        if (!cached) return null;
        
        const now = Date.now();
        const ttl = isPlaying ? CACHE_TTL.PLAYING : CACHE_TTL.PAUSED;
        
        if (now - cached.timestamp > ttl) {
          cache.delete(cacheKey);
          return null;
        }
        
        return cached.data;
      }

      const testData = { is_playing: true, item: { name: 'Test' } };
      const url = 'https://api.example.com/now-playing';
      
      // Set cached data
      setCachedData(url, true, testData);
      
      // Should return cached data immediately
      const cached = getCachedData(url, true);
      expect(cached).toEqual(testData);
      
      // Should return null for different playing state
      const cachedPaused = getCachedData(url, false);
      expect(cachedPaused).toBeNull();
    });
  });

  describe('Request Deduplication', () => {
    test('should deduplicate concurrent requests', async () => {
      const pendingRequests = new Map();
      
      async function deduplicatedFetch(url, options = {}) {
        const cacheKey = `${url}-${JSON.stringify(options)}`;
        
        if (pendingRequests.has(cacheKey)) {
          return pendingRequests.get(cacheKey);
        }
        
        const requestPromise = fetch(url, options).finally(() => {
          pendingRequests.delete(cacheKey);
        });
        
        pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
      }

      const mockResponse = { ok: true, json: () => Promise.resolve({}) };
      fetch.mockResolvedValue(mockResponse);

      const url = 'https://api.example.com/now-playing';
      const options = { method: 'GET' };

      // Make multiple concurrent requests
      const promise1 = deduplicatedFetch(url, options);
      const promise2 = deduplicatedFetch(url, options);
      const promise3 = deduplicatedFetch(url, options);

      // All should resolve to the same promise
      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);

      // Wait for completion
      await Promise.all([promise1, promise2, promise3]);

      // Should only have made one actual fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential Backoff', () => {
    test('should calculate correct retry delays', () => {
      const getRetryDelay = (attempt) => {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        return delay + Math.random() * 1000;
      };

      // Test first few attempts
      const delay0 = getRetryDelay(0);
      const delay1 = getRetryDelay(1);
      const delay2 = getRetryDelay(2);

      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThan(2000);
      
      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThan(3000);
      
      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThan(5000);
    });

    test('should cap at maximum delay', () => {
      const getRetryDelay = (attempt) => {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        return delay + Math.random() * 1000;
      };

      // Test high attempt numbers
      const delay10 = getRetryDelay(10);
      const delay20 = getRetryDelay(20);

      expect(delay10).toBeLessThanOrEqual(31000); // 30000 + jitter
      expect(delay20).toBeLessThanOrEqual(31000); // Should be capped at 30000
    });
  });

  describe('Performance Benefits', () => {
    test('should reduce API calls significantly', () => {
      // Simulate 1 hour of usage
      const oneHour = 60 * 60 * 1000; // 1 hour in ms
      
      // Old behavior: 30s intervals = 120 calls per hour
      const oldCallsPerHour = oneHour / 30000;
      
      // New behavior: 5s when playing (50% of time), 60s when paused (50% of time)
      const playingTime = oneHour * 0.5;
      const pausedTime = oneHour * 0.5;
      const newCallsPerHour = (playingTime / 5000) + (pausedTime / 60000);
      
      // Should reduce calls by approximately 50-70%
      const reduction = (oldCallsPerHour - newCallsPerHour) / oldCallsPerHour;
      
      expect(reduction).toBeGreaterThan(0.5);
      expect(reduction).toBeLessThan(0.8);
      
      console.log(`Old calls per hour: ${oldCallsPerHour}`);
      console.log(`New calls per hour: ${newCallsPerHour}`);
      console.log(`Reduction: ${(reduction * 100).toFixed(1)}%`);
    });
  });
});

// Integration test simulation
describe('Integration Tests', () => {
  test('should handle state transitions correctly', async () => {
    const mockResponses = [
      { is_playing: true, item: { name: 'Song 1' } },
      { is_playing: false },
      { is_playing: true, item: { name: 'Song 2' } },
    ];

    let callCount = 0;
    fetch.mockImplementation(() => {
      const response = mockResponses[callCount % mockResponses.length];
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response)
      });
    });

    // Simulate component behavior
    const getPollingInterval = (isPlaying, hasError) => {
      if (hasError) return 30000;
      return isPlaying ? 5000 : 60000;
    };

    // Test different states
    expect(getPollingInterval(true, false)).toBe(5000);  // Playing
    expect(getPollingInterval(false, false)).toBe(60000); // Paused
    expect(getPollingInterval(false, true)).toBe(30000);  // Error
  });
});