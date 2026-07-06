import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zingo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zingo_token');
        localStorage.removeItem('zingo_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Auth API ====================
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  verifyEmail: (email: string, code: string) =>
    api.post('/auth/verify-email', { email, code }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  getMe: () => api.get('/auth/me'),
};

// ==================== Movies API ====================
export const moviesAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/movies', { params }),
  getById: (id: number) =>
    api.get(`/movies/${id}`),
  getTopIMDB: (limit?: number) =>
    api.get('/movies/top-imdb', { params: { limit } }),
};

// ==================== Series API ====================
export const seriesAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/series', { params }),
  getById: (id: number) =>
    api.get(`/series/${id}`),
};

// ==================== Genres API ====================
export const genresAPI = {
  getAll: () => api.get('/genres'),
  getBySlug: (slug: string) => api.get(`/genres/${slug}`),
};

// ==================== Favorites API ====================
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  toggle: (movieId?: number, seriesId?: number) =>
    api.post('/favorites', { movieId, seriesId }),
};

// ==================== Comments API ====================
export const commentsAPI = {
  getForContent: (targetType: 'movie' | 'series', targetId: number, page?: number) =>
    api.get(`/comments/${targetType}/${targetId}`, { params: { page } }),
  create: (text: string, movieId?: number, seriesId?: number) =>
    api.post('/comments', { text, movieId, seriesId }),
};

// ==================== Ads API ====================
export const adsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/ads', { params }),
  getById: (id: number) =>
    api.get(`/ads/${id}`),
  click: (id: number) =>
    api.post(`/ads/${id}/click`),
};

// ==================== Search API ====================
export const searchAPI = {
  movies: (query: string) =>
    api.get('/movies', { params: { search: query } }),
  series: (query: string) =>
    api.get('/series', { params: { search: query } }),
};

// ==================== Admin API ====================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getMovies: (params?: Record<string, string>) =>
    api.get('/admin/movies', { params }),
  updateMovie: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/movies/${id}`, data),
  deleteMovie: (id: number) =>
    api.delete(`/admin/movies/${id}`),
  getSeries: (params?: Record<string, string>) =>
    api.get('/admin/series', { params }),
  updateSeries: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/series/${id}`, data),
  deleteSeries: (id: number) =>
    api.delete(`/admin/series/${id}`),
  getUsers: (params?: Record<string, string>) =>
    api.get('/admin/users', { params }),
  getAds: () => api.get('/admin/ads'),
  createAd: (data: Record<string, unknown>) =>
    api.post('/admin/ads', data),
  updateAd: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/ads/${id}`, data),
  deleteAd: (id: number) =>
    api.delete(`/admin/ads/${id}`),
  getGenres: () => api.get('/admin/genres'),
  createGenre: (data: { name: string; slug: string }) =>
    api.post('/admin/genres', data),
  deleteGenre: (id: number) =>
    api.delete(`/admin/genres/${id}`),
  getComments: () => api.get('/admin/comments'),
  deleteComment: (id: number) =>
    api.delete(`/admin/comments/${id}`),
  getScrapLogs: () => api.get('/scraper/logs'),
};

export default api;
