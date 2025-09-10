/**
 * Spotify API Type Definitions
 */

// Token API Response
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

// Artist Information
export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  href: string;
  external_urls: {
    spotify: string;
  };
}

// Album Image
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

// Album Information
export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  href: string;
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  external_urls: {
    spotify: string;
  };
}

// Track Item
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  is_local: boolean;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
}

// Episode Item (for podcasts)
export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  images: SpotifyImage[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  language: string;
  languages: string[];
  release_date: string;
  release_date_precision: string;
  type: "episode";
  uri: string;
}

// Currently Playing Response
export interface SpotifyCurrentlyPlayingResponse {
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
  item: SpotifyTrack | SpotifyEpisode | null;
  context: {
    type: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  } | null;
}

// Simplified Now Playing Response (our API response)
export interface NowPlayingResponse {
  is_playing: boolean;
  progress_ms?: number;
  item?: {
    name: string;
    artists?: string[];
    duration_ms: number;
    album: {
      name: string;
      images: SpotifyImage[];
    };
    external_urls: {
      spotify?: string;
    };
  };
}

// Error Response
export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}