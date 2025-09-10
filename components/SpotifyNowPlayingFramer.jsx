import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { addPropertyControls, ControlType } from "framer";

// Simple animated music note component
const AnimatedMusicNote = ({ color, size, speed }) => {
  const [animationError, setAnimationError] = useState(false);

  if (animationError) {
    return <div style={{ fontSize: `${size}px`, color }}>♪</div>;
  }

  try {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onError={() => setAnimationError(true)}
      >
        <ellipse cx="6" cy="18" rx="3" ry="2" fill={color} transform="rotate(-20 6 18)" />
        <rect x="8.5" y="6" width="1.5" height="12" fill={color} />
        <path d="M10 6 Q16 4 18 8 Q16 6 10 8 Z" fill={color} />
        <path d="M10 9 Q15 7 17 10 Q15 8 10 10 Z" fill={color} />
      </motion.svg>
    );
  } catch (error) {
    return <div style={{ fontSize: `${size}px`, color }}>♪</div>;
  }
};

// Global cache for request optimization
const globalCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Main component
const SpotifyNowPlaying = (props) => {
  // Extract props with defaults
  const font = props.font || "system-ui, -apple-system, sans-serif";
  const fontSize = props.fontSize || 16;
  const fontWeight = props.fontWeight || "bold";
  const fontColor = props.fontColor || "black";
  const hideAlbumCover = props.hideAlbumCover || false;
  const albumCoverSize = props.albumCoverSize || 60;
  const albumCoverRadius = props.albumCoverRadius || 8;
  const removeBackground = props.removeBackground || false;
  const backgroundColor = props.backgroundColor || "white";
  const backgroundRadius = props.backgroundRadius || 12;
  const singleLine = props.singleLine || false;
  const hideAlbumName = props.hideAlbumName || false;
  const showAnimatedIcon = props.showAnimatedIcon !== false;
  const animationSpeed = props.animationSpeed || 1.5;
  const iconSize = props.iconSize || 24;
  const fallbackIcon = props.fallbackIcon || "🎵";
  const apiUrl = props.apiUrl || "https://corner16-now-playing-135s3pi0h-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing";
  const enableSpotifyLink = props.enableSpotifyLink !== false;

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Simple fetch function with basic caching
  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cached = globalCache.get(apiUrl);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setTrack(cached.data);
        setError(null);
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const jsonData = await response.json();

      // Cache the data
      globalCache.set(apiUrl, {
        data: jsonData,
        timestamp: Date.now(),
      });

      setTrack(jsonData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError({
        message: err.message || "Failed to fetch data",
        type: "api_error",
        canRetry: true,
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Setup polling
  useEffect(() => {
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchData();
    }, track?.is_playing ? 5000 : 30000); // 5s when playing, 30s when not

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, track?.is_playing]);

  // Background styles
  const backgroundStyle = removeBackground
    ? { borderRadius: `${backgroundRadius}px` }
    : {
        background: backgroundColor,
        borderRadius: `${backgroundRadius}px`,
      };

  // Text color helper
  const getTextColor = (opacity = 1) => {
    if (fontColor === "white") {
      return `rgba(255, 255, 255, ${opacity})`;
    }
    if (fontColor.startsWith("#")) {
      const hex = fontColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return fontColor;
  };

  // Loading state
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
          ...backgroundStyle,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
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
        </div>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "#ffebee",
          color: "#c62828",
          borderRadius: `${backgroundRadius}px`,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          border: "1px solid #ffcdd2",
          maxWidth: "400px",
        }}
      >
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>😔 Connection Error</div>
        <div style={{ fontSize: "14px", marginBottom: "16px", opacity: 0.8 }}>
          {error.message}
        </div>
        {error.canRetry && (
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
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
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Not playing state
  if (!track?.is_playing) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: fontColor,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          ...backgroundStyle,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {showAnimatedIcon ? (
            <AnimatedMusicNote color={fontColor} size={iconSize} speed={animationSpeed} />
          ) : (
            <span style={{ fontSize: `${iconSize}px` }}>{fallbackIcon}</span>
          )}
          No music playing
        </div>
      </div>
    );
  }

  // Playing state
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
        ...backgroundStyle,
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
          cursor: enableSpotifyLink && track.item?.external_urls?.spotify ? "pointer" : "default",
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
            <div style={{ marginBottom: hideAlbumName ? "0" : "2px" }}>
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
          <AnimatedMusicNote color={fontColor} size={iconSize} speed={animationSpeed} />
        ) : (
          <div style={{ fontSize: `${iconSize}px`, color: getTextColor(1), flexShrink: 0 }}>
            {fallbackIcon}
          </div>
        )}
      </div>
    </div>
  );
};

// Add property controls
addPropertyControls(SpotifyNowPlaying, {
  // API Configuration
  apiUrl: {
    type: ControlType.String,
    title: "API URL",
    defaultValue:
      "https://corner16-now-playing-135s3pi0h-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing",
    placeholder: "Enter your deployed API URL",
  },
  enableSpotifyLink: {
    type: ControlType.Boolean,
    title: "Click to Open in Spotify",
    defaultValue: true,
  },

  // Typography Controls
  font: {
    type: ControlType.String,
    title: "Font Family",
    defaultValue: "system-ui, -apple-system, sans-serif",
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
    options: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
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

  // Fallback for static mode
  fallbackIcon: {
    type: ControlType.String,
    title: "Fallback Icon",
    defaultValue: "🎵",
    placeholder: "Enter emoji or text",
    hidden: (props) => props.showAnimatedIcon === true,
  },
});

export default SpotifyNowPlaying;
