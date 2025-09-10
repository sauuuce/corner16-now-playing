import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
  Suspense,
  Component,
} from "react";
 React,, lazy, Suspense, Component, useMemoimport { motion } from "framer-motion";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer";

// Error Boundary Component
class SpotifyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Spotify component error:", error, errorInfo);
    this.setState({
      errorInfo,
      error: error.message || "An unexpected error occurred",
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const {
        font = "system-ui, -apple-system, sans-serif",
        fontSize = 16,
        backgroundRadius = 12,
      } = this.props;

      return (
        <div
          style={{
            padding: "20px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: `${backgroundRadius}px`,
            fontFamily: font,
            fontSize: `${fontSize}px`,
            textAlign: "center",
            border: "1px solid #ffcdd2",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            🚨 Component Error
          </div>
          <div
            style={{
              fontSize: "14px",
              marginBottom: "16px",
              opacity: 0.8,
            }}
          >
            {error || "Something went wrong with the Spotify component."}
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={this.handleRetry}
              style={{
                padding: "8px 16px",
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: font,
              }}
            >
              {retryCount > 0 ? "Try Again" : "Retry"}
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 16px",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: font,
              }}
            >
              Refresh Page
            </button>
          </div>
          {retryCount > 2 && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                opacity: 0.7,
              }}
            >
              If the problem persists, check your API configuration.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Global cache and request management for multiple component instances
const globalCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = {
  PLAYING: 5 * 1000, // 5 seconds when playing
  PAUSED: 60 * 1000, // 60 seconds when paused
  ERROR: 30 * 1000, // 30 seconds on error
};

// Request deduplication utility
async function deduplicatedFetch(url, options = {}) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  // If there's already a pending request for this URL, wait for it
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = fetch(url, options).finally(() => {
    pendingRequests.delete(cacheKey);
  });

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// Intelligent caching utility
function getCachedData(url, isPlaying) {
  const cacheKey = `${url}-${isPlaying}`;
  const cached = globalCache.get(cacheKey);

  if (!cached) return null;

  const now = Date.now();
  const ttl = isPlaying ? CACHE_TTL.PLAYING : CACHE_TTL.PAUSED;

  if (now - cached.timestamp > ttl) {
    globalCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedData(url, isPlaying, data) {
  const cacheKey = `${url}-${isPlaying}`;
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

// Lazy load the animated components to reduce initial bundle size
const LazyAnimatedMusicNote = lazy(() =>
  Promise.resolve({ default: AnimatedMusicNote }),
);

// Loading fallback component for lazy-loaded animations
const AnimationFallback = React.memo(({ iconSize, fallbackIcon }) => (
  <div
    style={{
      fontSize: `${iconSize}px`,
      color: "currentColor",
      flexShrink: 0,
    }}
  >
    {fallbackIcon}
  </div>
));

// Animated Music Note Component (integrated) with error handling
Lazyloadtheanimatedcomponents to reduce initial bundle size
const LazyAnimatedMusicNote = lazy((=>
  Promise.resolve(default:AnimatedMusicNote),)// Loading fallback component for lazy-loaded animations
const AnimationFallback = React.memo(({ iconSize, fallbackIcon }) => (
  <div
    style={{
      fontSize: `${iconSize}px`,
      color: "currentColor",
      flexShrink: 0,
    }}
  >
    {fallbackIcon}
  </div>
));
function AnimatedMusicNote({
  color,
  size = 24,
  animationSpeed = 1.5,
  symbolType = "eighth",
  showFloatingSymbols = true,
  centralSymbolMode = "default",
  centralCustomText = "♪",
  centralCustomSvg = "",
  customSymbolMode = "preset",
  customSymbol1 = "♪",
  customSymbol2 = "♫",
  customSvg1 = "",
  customSvg2 = "",
}) {
  const isStatic = useIsStaticRenderer();
useCallback(("", [])  const [animationError, setAnimationError] = useState(false);

  // Graceful degradation for animation errors
  const handleAnimationError = useCallback(() => {
    console.warn("Animation error detected, falling back to static mode");
    setAnimationError(true);
  }, []);

  const noteVariants = {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.1, 1],
    },
  };

  const beamVariants = {
    animate: {
      scaleY: [1, 1.2, 0.8, 1],
      rotate: [0, 2, -2, 0],
    },
  };

  const animationProps =
    isStatic || animationError
      ? {}
      : {
          variants: noteVariants,
          animate: "animate",
          transition: {
            duration: animationSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          },
          onError: handleAnimationError,
        };
  const animationProps =
    isStatic || animationError
      ? {}
      : {
          variants: noteVariants,
          animate: "animate",
          transition: {
            duration: animationSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          },
          onError: handleAnimationError,
        };

  const beamAnimationProps =
    isStatic || animationError
      ? {}
      : {
          variants: beamVariants,
          animate: "animate",
          transition: {
            duration: animationSpeed * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          },
          onError: handleAnimationError,
        };
  const beamAnimationProps =
    isStatic || animationError
      ? {}
      : {
          variants: beamVariants,
          animate: "animate",
          transition: {
            duration: animationSpeed * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          },
          onError: handleAnimationError,
        };

  const getFloatingSymbolContent = useCallback(
    (symbolNumber) => {
      if (customSymbolMode === "text") {
        return symbolNumber === 1 ? customSymbol1 : customSymbol2;
      } else if (customSymbolMode === "svg") {
        const svgContent = symbolNumber === 1 ? customSvg1 : customSvg2;
        if (svgContent) {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{
                width: size * 0.3,
                height: size * 0.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          );
        }
  const getFloatingSymbolContent = useCallback(
    (symbolNumber) => {
      if (customSymbolMode === "text") {
        return symbolNumber === 1 ? customSymbol1 : customSymbol2;
      } else if (customSymbolMode === "svg") {
        const svgContent = symbolNumber === 1 ? customSvg1 : customSvg2;
        if (svgContent) {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{
                width: size * 0.3,
                height: size * 0.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          );
        }
      }

      // Preset symbols based on symbolType
      switch (symbolType) {
        case "treble":
          return symbolNumber === 1 ? "𝄞" : "♪";
        case "bass":
          return symbolNumber === 1 ? "𝄢" : "♫";
        case "quarter":
          return symbolNumber === 1 ? "♩" : "♪";
        case "eighth":
        default:
          return symbolNumber === 1 ? "♪" : "♫";
      }
    },
    [
      customSymbolMode,
      customSymbol1,
      customSymbol2,
      customSvg1,
      customSvg2,
      symbolType,
      size,
    ],
  );
      // Preset symbols based on symbolType
      switch (symbolType) {
        case "treble":
          return symbolNumber === 1 ? "𝄞" : "♪";
        case "bass":
          return symbolNumber === 1 ? "𝄢" : "♫";
        case "quarter":
          return symbolNumber === 1 ? "♩" : "♪";
        case "eighth":
        default:
          return symbolNumber === 1 ? "♪" : "♫";
      }
    },
    [
      customSymbolMode,
      customSymbol1,
      customSymbol2,
      customSvg1,
      customSvg2,
      symbolType,
      size,
    ],
  );

  const getCentralSymbol = useCallback((useCallback(() => {
    if (centralSymbolMode === "text" && centralCustomText) {
      return (
        <motion.div
          style={{
            fontSize: size * 0.8,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          {...animationProps}
        >
          {centralCustomText}
        </motion.div>
      );
    } else if (centralSymbolMode === "svg" && centralCustomSvg) {
      return (
        <motion.div
          dangerouslySetInnerHTML={{ __html: centralCustomSvg }}
          style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          {...animationProps}
        />
      );
    }

    // Default SVG note
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        {...animationProps}
        style={{
          filter:

            isStatic || animationError
              ? "none"

              : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      >
        {/* Note head */}
        <motion.ellipse
          cx="6"
          cy="18"
          rx="3"
          ry="2"
          fill={color}
          transform="rotate(-20 6 18)"
        />

        {/* Note stem */}
        <motion.rect
          x="8.5"
          y="6"
          width="1.5"
          height="12"
          fill={color}
          {...beamAnimationProps}
        />

        {/* Note beam/flag */}
        <motion.path
          d="M10 6 Q16 4 18 8 Q16 6 10 8 Z"
          fill={color}
          {...beamAnimationProps}
        />

        {/* Second beam */}
        <motion.path
          d="M10 9 Q15 7 17 10 Q15 8 10 10 Z"
          fill={color}
          {...beamAnimationProps}
        />
      </motion.svg>
    );
  }, [
    centralSymbolMode,
    centralCustomText,
    centralCustomSvg,
    size,
    color,
    animationProps,
    beamAnimationProps,
    isStatic,
    animationError,
  ]);
  }, [
    centralSymbolMode,
    centralCustomText,
    centralCustomSvg,
    size,
    color,
    animationProps,
    beamAnimationProps,
    isStatic,
    animationError,
  ]);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {getCentralSymbol()}

      {/* Floating musical symbols */}
      {!isStatic && !animationError && showFloatingSymbols && (
        <>
          <motion.div
            style={{
              position: "absolute",
              fontSize: customSymbolMode === "svg" ? "inherit" : size * 0.3,
              color: color,
              opacity: 0.6,
              left: "-20%",
              top: "-10%",
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.6, 0.2, 0.6],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: animationSpeed * 1.5,
              repeat: Infinity,
              delay: 0.3,
            }}
            onError={handleAnimationError}
          >
            {getFloatingSymbolContent(1)}
          </motion.div>

          <motion.div
            style={{
              position: "absolute",
              fontSize: customSymbolMode === "svg" ? "inherit" : size * 0.25,
              color: color,
              opacity: 0.4,
              right: "-15%",
              top: "10%",
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 0.1, 0.4],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: animationSpeed * 1.2,
              repeat: Infinity,
              delay: 0.6,
            }}
            onError={handleAnimationError}
          >
            {getFloatingSymbolContent(2)}
          </motion.div>
        </>
      )}
    </div>
  );
}

// Main component optimized with React.memo
const SpotifyNowPlaying = React.memo(function SpotifyNowPlaying(props) {
  // Destructure props with defaults
  const {
    font = "system-ui, -apple-system, sans-serif",
    fontSize = 16,
    fontWeight = "bold",
    fontColor = "black",
    hideAlbumCover = false,
    albumCoverSize = 60,
    albumCoverRadius = 8,
    removeBackground = false,
    backgroundColor = "white",
    backgroundRadius = 12,
    singleLine = false,
    hideAlbumName = false,
    // Animation props
    showAnimatedIcon = true,
    animationSpeed = 1.5,
    symbolType = "eighth",
    showFloatingSymbols = true,
    iconSize = 24,
    fallbackIcon = "🎵",
    // Central symbol customization
    centralSymbolMode = "default",
    centralCustomText = "♪",
    centralCustomSvg = "",
    // Floating symbols customization
    customSymbolMode = "preset",
    customSymbol1 = "♪",
    customSymbol2 = "♫",
    customSvg1 = "",
    customSvg2 = "",
    // API Configuration
    apiUrl = "https://corner16-now-playing-6suud6888-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing",
    // Click to open in Spotify
    enableSpotifyLink = true,
  } = props;

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const[isRetrying, setIsRetrying] = useState(false);  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Exponential backoff calculation (memoized)
  const getRetryDelay = useCallback((attempt) => {
    const baseDelay = 1000; // 1 second base delay
    const maxDelay = 30000; // 30 seconds max delay
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000; // Add jitter to prevent thundering herd
  }, []);

  // Adaptive polling intervals (memoized)
  const getPollingInterval = useCallback((isPlaying, hasError) => {
    if (hasError) return 30000; // 30s on error
    return isPlaying ? 5000 : 60000; // 5s when playing, 60s when paused
  }, []);

  // Optimized fetch function with caching and deduplication (memoized)
  const fetchData = useCallback(
    async (isRetry = false) => {
      try {
        if (isRetry) {
          setIsRetrying(true);
        }

        // Check cache first
        const cachedData = getCachedData(apiUrl, isPlayingRef.current);
        if (cachedData && !isRetry) {
          setTrack(cachedData);
          setError(null);
          retryCountRef.current = 0;
          setRetryCount(0);
          setIsRetrying(false);
          return;
        }

        const response = await deduplicatedFetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {




                          }

          const error = new Error(errorMessage);
          error.status = response.status;
          error.shouldRetry = shouldRetry;
          throw error;
        }

        const jsonData = await response.json();

        // Update playing state reference
        isPlayingRef.current = jsonData.is_playing || false;

        // Cache the data
        setCachedData(apiUrl, isPlayingRef.current, jsonData);

        setTrack(jsonData);
        setError(null);
        retryCountRef.current = 0;
        setRetryCount(0);
      } catch (err) {
        console.error("Fetch error:", err);

        constconst shouldRetryshouldRetry == err.shouldRetryerr.shouldRetry &&&& retryCountRef.current < 3;

        if (shouldRetry) {
          const delay = getRetryDelay(retryCountRef.current);
          console.log(
            `Retrying in ${delay}ms... (attempt ${retryCountRef.current + 1}/3)`,
          );

          timeoutRef.current = setTimeout(() => {
            retryCountRef.current += 1;
            setRetryCount(retryCountRef.current);
            fetchData(true);
          }, delay);
        } else {
          setError({
            message: err.message,
            type: err.status ? "api_error" : "network_error",
            status: err.status,
            timestamp: Date.now(),
            canRetry: retryCountRef.current < 3,
          });
        }
      } finally {
        setLoading(false);
        setIsRetrying(false);
        setIsRetrying(false);
      }
    },
    [apiUrl, getRetryDelay],
  );

  // Schedule next poll based on current state (memoized)
  const scheduleNextPoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const isPlaying = isPlayingRef.current;
    const hasError = !!error;
    const interval = getPollingInterval(isPlaying, hasError);

    console.log(
      `Scheduling next poll in ${interval}ms (playing: ${isPlaying}, error: ${hasError})`,
    );

    intervalRef.current = setTimeout(() => {
      fetchData();
    }, interval);
  }, [error, getPollingInterval, fetchData]);

  // Manual retry function (memoized)
  const handleRetry = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
    setRetryCount(0);
    setLoading(true);
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchData]);
  }, [fetchData]);

  // Schedule next poll when track or error state changes
  useEffect(() => {
    if (!loading) {
      scheduleNextPoll();
    }
  }, [track, error, loading, scheduleNextPoll]);

  // Check if current content is a podcast (memoized)
  const isPodcast = useMemo(
    () =>
      track &&
      (track.currently_playing_type === "episode" ||
        track.item?.type === "episode" ||
        (track.item && !track.item.artists)), // Fallback check for missing artists field
    [track],
  );
  // Check if current content is a podcast (memoized)
  const isPodcast = useMemo(
    () =>
      track &&
      (track.currently_playing_type === "episode" ||
        track.item?.type === "episode" ||
        (track.item && !track.item.artists)), // Fallback check for missing artists field
    [track],
  );

  // Background styles - plain color with custom radius (memoized)
  const backgroundStylebackgroundStyle = useMemo((useMemo(() => {
    if (removeBackground) {
      return {
        borderRadius: `${backgroundRadius}px`,
      };
    }

    return {
      background: backgroundColor,
      borderRadius: `${backgroundRadius}px`,
    };
  }, [removeBackground, backgroundRadius, backgroundColor]);

  // Text color logic (memoized)
  const getTextColor = useCallback(
    (opacity = 1) => {
      if (removeBackground && fontColor === "white") {
        return `rgba(0, 0, 0, ${opacity})`;
      }
      if (fontColor === "white") {
        return `rgba(255, 255, 255, ${opacity})`;
      }
      // For custom colors, apply opacity
      const hex = fontColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    [removeBackground, fontColor],
  );
  // Text color logic (memoized)
  const getTextColor = useCallback(
    (opacity = 1) => {
      if (removeBackground && fontColor === "white") {
        return `rgba(0, 0, 0, ${opacity})`;
      }
      if (fontColor === "white") {
        return `rgba(255, 255, 255, ${opacity})`;
      }
      // For custom colors, apply opacity
      const hex = fontColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    [removeBackground, fontColor],
  );

  // Icon color (matches text color) - memoized
  const iconColoriconColor = useMemo((useMemo(() => {
    if (removeBackground && fontColor === "white") {
      return "rgba(0, 0, 0, 0.8)";
    }
    if (fontColor === "white") {
      return "rgba(255, 255, 255, 0.9)";
    }
    return fontColor;
  }, [removeBackground, fontColor]);

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: fontColor,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          ...backgroundStylebackgroundStyle,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isRetrying ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid currentColor",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Retrying... ({retryCount + 1}/3)
            </>
          ) : (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid currentColor",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Loading your music...
            </>
          )}
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>


            ""
            ""
            ""
            "",

                      <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid currentColor",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid currentColor",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
      </div>
    );
  }

  if (error) {
""""""""

    const errorMessage = typeof error === "object" ? error.message : error;
    const canRetry = typeof error === "object" ? error.canRetry : true;
    const errorType = typeof error === "object" ? error.type : "unknown";

    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: errorType === "api_error" ? "#fff3e0" : """#ffebee",
          color"": errorType === "api_error" ? "#e65100" : "#c62828",
          borderRadius: `${backgroundRadius}px`,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          border: `1px solid ${errorType === "api_error" ? "#ffcc02" : "#ffcdd2"}`,
          maxWidth: "400px",
"""""",        }}
      >
        <div
          style={{
            fontSize: "20px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {errorType === "api_error" ? "⚠️" : "😔"}
          {errorType === "api_error" ? "API Error" : "Connection Error"}
        </div>
        <div
          style={{
            fontSize: "14px",
            marginBottom: "16px",
            opacity: 0.8,
          }}
        >
          {errorMessage}
        </div>
        {canRetry && (
          <button
            onClick={handleRetry}
            style={{
              padding: "8px 16px",
              background: errorType === "api_error" ? "#ff9800" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: font,
              marginRight: "8px",
            }}
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: font,
          }}
        >
          Refresh Page
        </button>
        {retryCount > 0 && (
          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              opacity: 0.7,
            }}
          >
            Attempted {retryCount} retries
          </div>
        )}
        <div
          style={{
            fontSize: "20px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {errorType === "api_error" ? "⚠️" : "😔"}
          {errorType === "api_error" ? "API Error" : "Connection Error"}


            ""
            ""
            ,

        """""""""""""""""""","""""""""""""",

              ""
              ""
              ,

                </div>
    );
  }

  // Show "not playing" state for: not playing, paused, or podcast content
  if (!track?.is_playing || isPodcast) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: removeBackground && fontColor === "white" ? "#666" : fontColor,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          ...backgroundStylebackgroundStyle,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {showAnimatedIcon ? (
            <Suspense
              fallback={
                <AnimationFallback
                  iconSize={iconSize}
                  fallbackIcon={fallbackIcon}
                />
              }
            >
              <LazyAnimatedMusicNote
                color={iconColor}
                size={iconSize}
                animationSpeed={animationSpeed}
                symbolType={symbolType}
                showFloatingSymbols={false}
                centralSymbolMode={centralSymbolMode}
                centralCustomText={centralCustomText}
                centralCustomSvg={centralCustomSvg}
                customSymbolMode={customSymbolMode}
                customSymbol1={customSymbol1}
                customSymbol2={customSymbol2}
                customSvg1={customSvg1}
                customSvg2={customSvg2}
              />
            </Suspense>
            <Suspense
              fallback={
                <AnimationFallback
                  iconSize={iconSize}
                  fallbackIcon={fallbackIcon}
                />
              }
            >
              <LazyAnimatedMusicNote
                color={iconColor}
                size={iconSize}
                animationSpeed={animationSpeed}
                symbolType={symbolType}
                showFloatingSymbols={false}
                centralSymbolMode={centralSymbolMode}
                centralCustomText={centralCustomText}
                centralCustomSvg={centralCustomSvg}
                customSymbolMode={customSymbolMode}
                customSymbol1={customSymbol1}
                customSymbol2={customSymbol2}
                customSvg1={customSvg1}
                customSvg2={customSvg2}
              />
            </Suspense>
          ) : (
            <span style={{ fontSize: `${iconSize}px` }}>{fallbackIcon}</span>
          )}
          No music playing
        </div>
      </div>
    );
  }

  // Get track and artist info (only for music tracks)
  const trackName = track.item?.name || "Unknown Track";
  const artistName = track.item?.artists?.join(", ") || "Unknown Artist";
  const albumName = track.item?.album?.name || "Unknown Album";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px",
        color: fontColor,
        fontFamily: font,
        maxWidth: "400px",
        ...backgroundStylebackgroundStyle,
      }}
    >
      {!hideAlbumCover && track.item?.album?.images?.[2] && (
        <img
          src={track.item.album.images[2].url}
          alt="Album cover"
          style={{
            width: `${albumCoverSize}px`,
            height: `${albumCoverSize}px`,
            borderRadius: `${albumCoverRadius}px`,
            marginRight: "12px",
            boxShadow: removeBackground
              ? "0 2px 10px rgba(0,0,0,0.1)"
              : "0 2px 10px rgba(0,0,0,0.2)",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          cursor:
            enableSpotifyLink && track.item?.external_urls?.spotify
              ? "pointer"
              : "default",
        }}
        onClick={() => {
          if (enableSpotifyLink && track.item?.external_urls?.spotify) {
            window.open(track.item.external_urls.spotify, "_blank");
          }
        }}
      >
        {singleLine ? (
          <div
            style={{
              fontWeight: fontWeight,
              fontSize: `${fontSize}px`,
              color: getTextColor(1),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {trackName} - {artistName}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "2px" }}>
              <div
                style={{
                  fontWeight: fontWeight,
                  fontSize: `${fontSize}px`,
                  color: getTextColor(1),
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {trackName}
              </div>
            </div>
            <div
              style={{
                marginBottom: hideAlbumName ? "0" : "2px",
              }}
            >
              <div
                style={{
                  fontWeight: fontWeight === "bold" ? "normal" : fontWeight,
                  fontSize: `${fontSize * 0.875}px`,
                  color: getTextColor(0.9),
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {artistName}
              </div>
            </div>
            {!hideAlbumName && (
              <div>
                <div
                  style={{
                    fontWeight: fontWeight === "bold" ? "normal" : fontWeight,
                    fontSize: `${fontSize * 0.75}px`,
                    color: getTextColor(0.8),
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {albumName}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ marginLeft: "12px" }}>
        {showAnimatedIcon ? (
          <Suspense
            fallback={
              <AnimationFallback
                iconSize={iconSize}
                fallbackIcon={fallbackIcon}
              />
            }
          >
            <LazyAnimatedMusicNote
              color={iconColor}
              size={iconSize}
              animationSpeed={animationSpeed}
              symbolType={symbolType}
              showFloatingSymbols={showFloatingSymbols}
              centralSymbolMode={centralSymbolMode}
              centralCustomText={centralCustomText}
              centralCustomSvg={centralCustomSvg}
              customSymbolMode={customSymbolMode}
              customSymbol1={customSymbol1}
              customSymbol2={customSymbol2}
              customSvg1={customSvg1}
              customSvg2={customSvg2}
            />
          </Suspense>
          <Suspense
            fallback={
              <AnimationFallback
                iconSize={iconSize}
                fallbackIcon={fallbackIcon}
              />
            }
          >
            <LazyAnimatedMusicNote
              color={iconColor}
              size={iconSize}
              animationSpeed={animationSpeed}
              symbolType={symbolType}
              showFloatingSymbols={showFloatingSymbols}
              centralSymbolMode={centralSymbolMode}
              centralCustomText={centralCustomText}
              centralCustomSvg={centralCustomSvg}
              customSymbolMode={customSymbolMode}
              customSymbol1={customSymbol1}
              customSymbol2={customSymbol2}
              customSvg1={customSvg1}
              customSvg2={customSvg2}
            />
          </Suspense>
        ) : (
          <div
            style={{
              fontSize: `${iconSize}px`,
              color: getTextColor(1),
              flexShrink: 0,
            }}
          >
            {fallbackIcon}
          </div>
        )}
      </div>
    </div>
  );
});

// Add property controls for Framer's UI
addPropertyControls(SpotifyNowPlaying, {
  // API Configuration
  apiUrl: {
    type: ControlType.String,
    title: "API URL",
    defaultValue:
      "https://corner16-now-playing-6suud6888-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing",
    placeholder: "Enter your deployed API URL",
  },
  enableSpotifyLink: {
    type: ControlType.Boolean,
    title: "Click to Open in Spotify",
    defaultValue: true,
    enabledTitle: "Enabled",
    disabledTitle: "Disabled",
  },

  // Typography Controls
  font: {
    type: ControlType.String,
    title: "Font Family",
    defaultValue: "system-ui, -apple-system, sans-serif",
    placeholder: "Arial, Helvetica, sans-serif",
  },
  fontSize: {
    type: ControlType.Number,
    title: "Font Size",
    defaultValue: 16,
    min: 10,
    max: 32,
    step: 1,
    unit: "px",
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Font Weight",
    options: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "normal",
      "bold",
      "lighter",
      "bolder",
    ],
    optionTitles: [
      "100 (Thin)",
      "200 (Extra Light)",
      "300 (Light)",
      "400 (Normal)",
      "500 (Medium)",
      "600 (Semi Bold)",
      "700 (Bold)",
      "800 (Extra Bold)",
      "900 (Black)",
      "Normal",
      "Bold",
      "Lighter",
      "Bolder",
    ],
    defaultValue: "bold",
  },
  fontColor: {
    type: ControlType.Color,
    title: "Font Color",
    defaultValue: "#000000",
  },

  // Background Controls
  removeBackground: {
    type: ControlType.Boolean,
    title: "Remove Background",
    defaultValue: false,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background Color",
    defaultValue: "#ffffff",
    hidden: (props) => props.removeBackground === true,
  },
  backgroundRadius: {
    type: ControlType.Number,
    title: "Background Radius",
    defaultValue: 12,
    min: 0,
    max: 50,
    step: 1,
    unit: "px",
  },

  // Layout Controls
  singleLine: {
    type: ControlType.Boolean,
    title: "Track & Artist on One Line",
    defaultValue: false,
  },
  hideAlbumName: {
    type: ControlType.Boolean,
    title: "Hide Album Name",
    defaultValue: false,
  },

  // Album Cover Controls
  hideAlbumCover: {
    type: ControlType.Boolean,
    title: "Hide Album Cover",
    defaultValue: false,
  },
  albumCoverSize: {
    type: ControlType.Number,
    title: "Album Cover Size",
    defaultValue: 60,
    min: 30,
    max: 120,
    step: 5,
    unit: "px",
    hidden: (props) => props.hideAlbumCover === true,
  },
  albumCoverRadius: {
    type: ControlType.Number,
    title: "Album Cover Radius",
    defaultValue: 8,
    min: 0,
    max: 60,
    step: 1,
    unit: "px",
    hidden: (props) => props.hideAlbumCover === true,
  },

  // Animation Controls
  showAnimatedIcon: {
    type: ControlType.Boolean,
    title: "Show Animated Icon",
    defaultValue: true,
    enabledTitle: "Animated",
    disabledTitle: "Static",
  },
  iconSize: {
    type: ControlType.Number,
    title: "Icon Size",
    defaultValue: 24,
    min: 16,
    max: 48,
    step: 2,
    unit: "px",
  },
  animationSpeed: {
    type: ControlType.Number,
    title: "Animation Speed",
    defaultValue: 1.5,
    min: 0.5,
    max: 3,
    step: 0.1,
    unit: "s",
    hidden: (props) => props.showAnimatedIcon === false,
  },

  // Central Symbol Controls
  centralSymbolMode: {
    type: ControlType.Enum,
    title: "Central Symbol",
    options: ["default", "text", "svg"],
    optionTitles: ["Default Note", "Custom Text", "Custom SVG"],
    defaultValue: "default",
    hidden: (props) => props.showAnimatedIcon === false,
  },
  centralCustomText: {
    type: ControlType.String,
    title: "Central Text",
    defaultValue: "♪",
    placeholder: "Enter symbol or emoji",
    hidden: (props) =>
      props.showAnimatedIcon === false || props.centralSymbolMode !== "text",
  },
  centralCustomSvg: {
    type: ControlType.String,
    title: "Central SVG",
    defaultValue: "",
    placeholder: "Paste SVG code here",
    displayTextArea: true,
    hidden: (props) =>
      props.showAnimatedIcon === false || props.centralSymbolMode !== "svg",
  },

  // Floating Symbols Controls
  showFloatingSymbols: {
    type: ControlType.Boolean,
    title: "Floating Symbols",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide",
    hidden: (props) => props.showAnimatedIcon === false,
  },
  customSymbolMode: {
    type: ControlType.Enum,
    title: "Floating Symbol Mode",
    options: ["preset", "text", "svg"],
    optionTitles: ["Preset", "Custom Text", "Custom SVG"],
    defaultValue: "preset",
    hidden: (props) =>
      props.showAnimatedIcon === false || props.showFloatingSymbols === false,
  },
  symbolType: {
    type: ControlType.Enum,
    title: "Symbol Type",
    options: ["treble", "bass", "quarter", "eighth"],
    optionTitles: ["Treble Clef", "Bass Clef", "Quarter Note", "Eighth Note"],
    defaultValue: "eighth",
    hidden: (props) =>
      props.showAnimatedIcon === false ||
      props.showFloatingSymbols === false ||
      props.customSymbolMode !== "preset",
  },
  customSymbol1: {
    type: ControlType.String,
    title: "Floating Symbol 1",
    defaultValue: "♪",
    placeholder: "Enter symbol or emoji",
    hidden: (props) =>
      props.showAnimatedIcon === false ||
      props.showFloatingSymbols === false ||
      props.customSymbolMode !== "text",
  },
  customSymbol2: {
    type: ControlType.String,
    title: "Floating Symbol 2",
    defaultValue: "♫",
    placeholder: "Enter symbol or emoji",
    hidden: (props) =>
      props.showAnimatedIcon === false ||
      props.showFloatingSymbols === false ||
      props.customSymbolMode !== "text",
  },
  customSvg1: {
    type: ControlType.String,
    title: "Floating SVG 1",
    defaultValue: "",
    placeholder: "Paste SVG code here",
    displayTextArea: true,
    hidden: (props) =>
      props.showAnimatedIcon === false ||
      props.showFloatingSymbols === false ||
      props.customSymbolMode !== "svg",
  },
  customSvg2: {
    type: ControlType.String,
    title: "Floating SVG 2",
    defaultValue: "",
    placeholder: "Paste SVG code here",
    displayTextArea: true,
    hidden: (props) =>
      props.showAnimatedIcon === false ||
      props.showFloatingSymbols === false ||
      props.customSymbolMode !== "svg",
  },

  // Fallback for static mode
  fallbackIcon: {
    type: ControlType.String,
    title: "Fallback Icon",
    defaultValue: "🎵",
    placeholder: "Enter emoji or text",
    hidden: (props) => props.showAnimatedIcon === true,
  },
});

// Wrap the main component with error boundary
const SpotifyNowPlayingWithErrorBoundary = (props) => {
  return (
    <SpotifyErrorBoundary {...props}>
      <SpotifyNowPlaying {...props} />
    </SpotifyErrorBoundary>
  );
};

export default SpotifyNowPlayingWithErrorBoundary;
