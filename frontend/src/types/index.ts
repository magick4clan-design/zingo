// ==================== Common Types ====================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== User ====================
export interface User {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  requiresEmailVerification: boolean;
  emailProvider?: string;
  devCode?: string;
  expiresAt?: string;
}

// ==================== Content ====================
export interface Genre {
  id: number;
  name: string;
  slug: string;
  _count?: {
    movies: number;
    series: number;
  };
}

export type Screenshot = string | {
  url: string;
  caption?: string;
  alt?: string;
};

export interface Movie {
  id: number;
  title: string;
  slug: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  releaseYear?: number;
  duration?: number;
  imdbRating?: number;
  imdbId?: string;
  quality?: string;
  country?: string;
  language?: string;
  director?: string;
  cast: string[];
  screenshots: Screenshot[];
  trailerUrl?: string;
  downloadLinks: Record<string, string>;
  source: string;
  sourceUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  views: number;
  genres: { genre: Genre }[];
  favorites?: unknown[];
  comments?: Comment[];
  _count?: {
    favorites: number;
    comments: number;
  };
  similar?: Movie[];
  createdAt: string;
}

export interface Series {
  id: number;
  title: string;
  slug: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  releaseYear?: number;
  imdbRating?: number;
  imdbId?: string;
  country?: string;
  language?: string;
  network?: string;
  cast: string[];
  screenshots: Screenshot[];
  trailerUrl?: string;
  source: string;
  sourceUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  views: number;
  genres: { genre: Genre }[];
  seasons: Season[];
  favorites?: unknown[];
  comments?: Comment[];
  _count?: {
    favorites: number;
    comments: number;
  };
  similar?: Series[];
  createdAt: string;
}

export interface Season {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title?: string;
  episodes: Episode[];
}

export interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title?: string;
  downloadLinks: Record<string, string>;
}

// ==================== Comments ====================
export interface Comment {
  id: number;
  userId: number;
  user: {
    name?: string;
    avatar?: string;
  };
  movieId?: number;
  seriesId?: number;
  text: string;
  createdAt: string;
}

// ==================== Favorites ====================
export interface Favorite {
  id: number;
  userId: number;
  movieId?: number;
  seriesId?: number;
  movie?: Movie;
  series?: Series;
  createdAt: string;
}

// ==================== Ads ====================
export type AdType = 'BANNER' | 'POPUP' | 'INTERSTITIAL' | 'SPONSOR';

export interface Ad {
  id: number;
  title: string;
  type: AdType;
  imageUrl: string;
  linkUrl: string;
  position?: string;
  priority: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// ==================== Admin ====================
export interface DashboardStats {
  movieCount: number;
  seriesCount: number;
  userCount: number;
  adCount: number;
  totalViews: number;
}

export interface ScrapLog {
  id: number;
  source: string;
  status: string;
  message?: string;
  itemsScraped: number;
  startedAt: string;
  finishedAt?: string;
}
