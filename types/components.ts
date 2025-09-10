/**
 * Component Type Definitions
 */

import { NowPlayingResponse } from './spotify';

// Props for the main SpotifyNowPlaying component
export interface SpotifyNowPlayingProps {
  // API Configuration
  apiUrl?: string;
  enableSpotifyLink?: boolean;

  // Typography
  font?: string;
  fontSize?: number;
  fontWeight?: string;
  fontColor?: string;

  // Background
  removeBackground?: boolean;
  backgroundColor?: string;
  backgroundRadius?: number;

  // Layout
  singleLine?: boolean;
  hideAlbumName?: boolean;

  // Album Cover
  hideAlbumCover?: boolean;
  albumCoverSize?: number;
  albumCoverRadius?: number;

  // Animation
  showAnimatedIcon?: boolean;
  iconSize?: number;
  animationSpeed?: number;

  // Central Symbol
  centralSymbolMode?: 'default' | 'text' | 'svg';
  centralCustomText?: string;
  centralCustomSvg?: string;

  // Floating Symbols
  showFloatingSymbols?: boolean;
  customSymbolMode?: 'preset' | 'text' | 'svg';
  symbolType?: 'treble' | 'bass' | 'quarter' | 'eighth';
  customSymbol1?: string;
  customSymbol2?: string;
  customSvg1?: string;
  customSvg2?: string;

  // Fallback
  fallbackIcon?: string;
}

// Props for AnimatedMusicNote component
export interface AnimatedMusicNoteProps {
  color: string;
  size?: number;
  animationSpeed?: number;
  symbolType?: 'treble' | 'bass' | 'quarter' | 'eighth';
  showFloatingSymbols?: boolean;
  centralSymbolMode?: 'default' | 'text' | 'svg';
  centralCustomText?: string;
  centralCustomSvg?: string;
  customSymbolMode?: 'preset' | 'text' | 'svg';
  customSymbol1?: string;
  customSymbol2?: string;
  customSvg1?: string;
  customSvg2?: string;
}

// Props for AnimationFallback component
export interface AnimationFallbackProps {
  iconSize: number;
  fallbackIcon: string;
}

// Error state type
export interface SpotifyError {
  message: string;
  type: 'api_error' | 'network_error';
  status?: number;
  timestamp: number;
  canRetry: boolean;
}

// Extended Track for component state
export interface TrackState extends NowPlayingResponse {
  currently_playing_type?: 'track' | 'episode' | 'ad' | 'unknown';
}

// Error Boundary State
export interface SpotifyErrorBoundaryState {
  hasError: boolean;
  error: string | null;
  errorInfo: any | null;
  retryCount: number;
}

// Cache Entry Type
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}