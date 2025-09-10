import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useIsStaticRenderer } from "framer";

// Lazy-loaded Animated Music Note Component
export const AnimatedMusicNote = React.memo(function AnimatedMusicNote({
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

  // Memoize animation variants to prevent recreation on every render
  const noteVariants = useMemo(() => ({
    animate: {
      y: [0, -8, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.1, 1],
    },
  }), []);

  const beamVariants = useMemo(() => ({
    animate: {
      scaleY: [1, 1.2, 0.8, 1],
      rotate: [0, 2, -2, 0],
    },
  }), []);

  const animationProps = useMemo(() => isStatic
    ? {}
    : {
        variants: noteVariants,
        animate: "animate",
        transition: {
          duration: animationSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }, [isStatic, noteVariants, animationSpeed]);

  const beamAnimationProps = useMemo(() => isStatic
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
      }, [isStatic, beamVariants, animationSpeed]);

  const getFloatingSymbolContent = useCallback((symbolNumber) => {
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
  }, [customSymbolMode, customSymbol1, customSymbol2, customSvg1, customSvg2, symbolType, size]);

  const getCentralSymbol = useCallback(() => {
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
          filter: isStatic ? "none" : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
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
  }, [centralSymbolMode, centralCustomText, centralCustomSvg, size, color, animationProps, beamAnimationProps, isStatic]);

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
      {!isStatic && showFloatingSymbols && (
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
          >
            {getFloatingSymbolContent(2)}
          </motion.div>
        </>
      )}
    </div>
  );
});