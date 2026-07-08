import axios from 'axios';

const API_BASE = 'https://hostinnegar.com';
const API_KEY = '4F5A9C3D9A86FA54EACEDDD635185';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]+/g, (c: string) => {
      const map: Record<string, string> = { 'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'y' };
      return map[c] || c;
    })
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function transformMovie(item: any) {
  const genres = (item.genres || []).map((g: any) => ({
    genre: { id: g.id, name: g.title, slug: toSlug(g.title) }
  }));

  const countries = Array.isArray(item.country) 
    ? item.country.map((c: any) => c.title || c).join(', ')
    : null;

  const downloadLinks: Record<string, string> = {};
  if (item.downloadas && typeof item.downloadas === 'string' && item.downloadas.startsWith('http')) {
    downloadLinks.server1 = item.downloadas;
  }
  if (item.sources && Array.isArray(item.sources)) {
    for (const src of item.sources) {
      if (src.url && src.quality) {
        downloadLinks[src.quality] = src.url;
      }
    }
  }

  return {
    id: item.id,
    title: item.title || 'Untitled',
    slug: toSlug(item.title || `item-${item.id}`),
    originalTitle: null,
    posterUrl: item.image || '',
    backdropUrl: item.cover || null,
    description: item.description || '',
    releaseYear: item.year || null,
    duration: item.duration ? parseInt(item.duration) : null,
    imdbRating: item.imdb || null,
    imdbId: null,
    quality: null,
    country: countries,
    language: null,
    director: null,
    cast: [],
    screenshots: [],
    trailerUrl: null,
    downloadLinks,
    source: 'hostinnegar',
    sourceUrl: null,
    status: 'PUBLISHED',
    views: 0,
    genres,
    _count: { favorites: 0, comments: 0 },
    createdAt: new Date().toISOString(),
  };
}

function transformSeries(item: any) {
  const base = transformMovie(item);
  return {
    ...base,
    seasons: [],
    network: null,
  };
}

async function fetchFromApi(endpoint: string): Promise<any[]> {
  try {
    const { data } = await axios.get(`${API_BASE}${endpoint}${API_KEY}/`, {
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

export async function getNewMovies(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/movie/by/filtres/0/created/${page - 1}/`);
  return items.map(transformMovie);
}

export async function getTopRatedMovies(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/movie/by/filtres/0/imdb/${page - 1}/`);
  return items.map(transformMovie);
}

export async function getNewSeries(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/serie/by/filtres/0/created/${page - 1}/`);
  return items.map(transformSeries);
}

export async function getTopRatedSeries(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/serie/by/filtres/0/imdb/${page - 1}/`);
  return items.map(transformSeries);
}

export async function getUpdatedSeries(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/serie/by/filtres/0/updated/${page - 1}/`);
  return items.map(transformSeries);
}

export async function getBestSeries(page: number = 1, limit: number = 20) {
  const items = await fetchFromApi(`/api/serie/by/filtres/0/imdb/${page - 1}/`);
  return items.map(transformSeries);
}

export async function getMovieById(id: number) {
  try {
    const { data } = await axios.get(`${API_BASE}/api/movie/${id}/${API_KEY}/`, {
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
    return data ? transformMovie(data) : null;
  } catch {
    return null;
  }
}

export async function getSerieById(id: number) {
  try {
    const { data } = await axios.get(`${API_BASE}/api/serie/${id}/${API_KEY}/`, {
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
    return data ? transformSeries(data) : null;
  } catch {
    return null;
  }
}

export async function getSeasons(serieId: number) {
  return fetchFromApi(`/api/season/by/serie/${serieId}/`);
}

export async function searchContent(query: string) {
  try {
    const { data } = await axios.get(`${API_BASE}/api/search/${encodeURIComponent(query)}/${API_KEY}`, {
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
    const items = Array.isArray(data) ? data : [];
    return items.map((item: any) => {
      if (item.type === 'serie' || item.type === 'serial') {
        return transformSeries(item);
      }
      return transformMovie(item);
    });
  } catch {
    return [];
  }
}
