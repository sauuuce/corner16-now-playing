import React, { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { addPropertyControls, ControlType } from "framer";

// Lazy load the animated components to reduce initial bundle size
const LazyAnimatedComponents = lazy(() => import('./AnimatedComponents'));

// Loading fallback component for lazy-loaded animations
const AnimationFallback = ({ iconSize, fallbackIcon }) => (
  <div
    style={{
      fontSize: `${iconSize}px`,
      color: "currentColor",
      flexShrink: 0,
    }}
  >
    {fallbackIcon}
  </div>
);

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

  // Memoize fetchData to prevent recreation on every render
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Spotify authentication failed - please check your API credentials",
          );
        } else if (response.status === 500) {
          throw new Error(
            "Spotify API temporarily unavailable - please try again later",
          );
        } else {
          throw new Error(
            `Unable to connect to Spotify (${response.status})`,
          );
        }
      }

      const jsonData = await response.json();
      setTrack(jsonData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const controller = new AbortController();

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchData]);

  // Check if current content is a podcast
  const isPodcast = useMemo(() =>
    track &&
    (track.currently_playing_type === "episode" ||
      track.item?.type === "episode" ||
      (track.item && !track.item.artists)), // Fallback check for missing artists field
    [track]
  );

  // Background styles - plain color with custom radius (memoized)
  const backgroundStyle = useMemo(() => {
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
  const getTextColor = useCallback((opacity = 1) => {
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
  }, [removeBackground, fontColor]);

  // Icon color (matches text color) - memoized
  const iconColor = useMemo(() => {
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
          ...backgroundStyle,
        }}
      >
        <div>Loading your music...</div>
      </div>
    );
  }

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
        }}
      >
        <div>😔 Error: {error}</div>
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
          ...backgroundStyle,
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
            <Suspense fallback={<AnimationFallback iconSize={iconSize} fallbackIcon={fallbackIcon} />}>
              <LazyAnimatedComponents.AnimatedMusicNote
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
          <Suspense fallback={<AnimationFallback iconSize={iconSize} fallbackIcon={fallbackIcon} />}>
            <LazyAnimatedComponents.AnimatedMusicNote
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

// Export the optimized component
export default SpotifyNowPlaying;

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
