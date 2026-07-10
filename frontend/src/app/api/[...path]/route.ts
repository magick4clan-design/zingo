import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zingo-production-9a5a.up.railway.app';
const HOSTINNEGAR_BASE = process.env.API_BASE_URL || 'https://hostinnegar.com';
const HOSTINNEGAR_KEY = process.env.HOSTINNEGAR_API_KEY || '4F5A9C3D9A86FA54EACEDDD635185';

const CONTENT_PATHS = ['movies', 'series', 'search'];

function transformItem(item: any, isSeries: boolean) {
  const genres = (item.genres || []).map((g: any) => ({
    genre: { id: g.id, name: g.title || g.name, slug: ((g.title || g.name || '').toLowerCase().trim().replace(/[\s\W-]+/g, '-') || 'genre') }
  }));
  const countries = Array.isArray(item.country) ? item.country.map((c: any) => c.title || c).join(', ') : null;
  const dl: Record<string, string> = {};
  if (item.sources) for (const s of item.sources) if (s.url) dl[s.quality || `s${s.id}`] = s.url;
  if (item.downloadas && !dl.server1) dl.server1 = item.downloadas;
  return {
    id: item.id, title: item.title || 'Untitled',
    slug: (item.title || `i-${item.id}`).toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || 'item',
    posterUrl: item.image || '', backdropUrl: item.cover || null,
    description: item.description || '', releaseYear: item.year || null,
    duration: item.duration ? parseInt(item.duration) : null, imdbRating: item.imdb || null,
    country: countries, cast: [], screenshots: item.cover ? [item.cover] : [],
    downloadLinks: dl, source: 'hostinnegar', status: 'PUBLISHED', views: 0,
    genres, _count: { favorites: 0, comments: 0 },
    ...(isSeries ? { seasons: [], network: null } : {}),
  };
}

function isContentMovieOrSeries(path: string[]) {
  if (path[0] === 'search') return true;
  if (path[0] === 'movies' || path[0] === 'series') return true;
  return false;
}

function isSeries(path: string[]) { return path[0] === 'series'; }

function buildHostinnegarUrl(path: string[], searchParams: URLSearchParams): string | null {
  const method = path[0];
  
  if (method === 'search') {
    const q = searchParams.get('q') || searchParams.get('query');
    if (!q) return null;
    return `${HOSTINNEGAR_BASE}/api/search/${encodeURIComponent(q)}/${HOSTINNEGAR_KEY}/`;
  }

  const type = method === 'series' ? 'serie' : 'movie';
  const apiType = method === 'series' ? 'series' : 'movies';

  if (path.length === 1) {
    const page = searchParams.get('page') || '0';
    const sort = searchParams.get('sort') || 'createdAt';
    const search = searchParams.get('search');
    if (search) {
      return `${HOSTINNEGAR_BASE}/api/search/${encodeURIComponent(search)}/${HOSTINNEGAR_KEY}/`;
    }
    const sortMap: Record<string, string> = { rating: 'imdb', imdb: 'imdb', views: 'updated', createdAt: 'created' };
    const sortType = sortMap[sort] || 'created';
    return `${HOSTINNEGAR_BASE}/api/${type}/by/filtres/0/${sortType}/${page}/${HOSTINNEGAR_KEY}/`;
  }

  if (path.length === 2 && path[1] === 'top-imdb') {
    return `${HOSTINNEGAR_BASE}/api/${type}/by/filtres/0/imdb/0/${HOSTINNEGAR_KEY}/`;
  }

  if (path.length === 2) {
    return `${HOSTINNEGAR_BASE}/api/${type}/${path[1]}/${HOSTINNEGAR_KEY}/`;
  }

  if (path.length === 3 && path[2] === 'seasons') {
    return `${HOSTINNEGAR_BASE}/api/season/by/serie/${path[1]}/0/${HOSTINNEGAR_KEY}/`;
  }

  return null;
}

async function handleHostinnegar(path: string[], searchParams: URLSearchParams) {
  const url = buildHostinnegarUrl(path, searchParams);
  if (!url) return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });

  const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } });
  if (!res.ok) return NextResponse.json({ success: false, message: 'Upstream error' }, { status: res.status });
  
  const data = await res.json();
  const isSerie = isSeries(path);
  const isDetail = path.length === 2 && path[1] !== 'top-imdb';

  // Search
  if (path[0] === 'search') {
    const posters = Array.isArray(data.posters) ? data.posters : [];
    const all = posters.map((i: any) => transformItem(i, i.type === 'serie' || i.type === 'serial'));
    const movies = all.filter((i: any) => !i.seasons);
    const series = all.filter((i: any) => i.seasons);
    return NextResponse.json({ success: true, data: { movies, series, all, pagination: { page: 0, limit: all.length, total: all.length, totalPages: 1 } } });
  }

  // Detail
  if (isDetail) {
    const item = data?.id ? data : null;
    if (!item) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const transformed = transformItem(item, isSerie);
    if (isSerie) {
      const seasonsRes = await fetch(`${HOSTINNEGAR_BASE}/api/season/by/serie/${path[1]}/0/${HOSTINNEGAR_KEY}/`, { headers: { Accept: 'application/json' } });
      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        (transformed as any).seasons = Array.isArray(seasonsData) ? seasonsData : (Array.isArray(seasonsData.data) ? seasonsData.data : []);
      }
    }
    return NextResponse.json({ success: true, data: transformed });
  }

  // List
  const items = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
  const list = items.map((i: any) => transformItem(i, isSerie));
  const key = isSerie ? 'series' : 'movies';
  return NextResponse.json({ success: true, data: { [key]: list, pagination: { page: 0, limit: list.length, total: list.length, totalPages: 999 } } });
}

async function handleRailway(path: string[], request: NextRequest) {
  const pathStr = path.join('/');
  const searchStr = request.nextUrl.search;
  const url = `${RAILWAY_URL}/api/${pathStr}${searchStr}`;
  
  const headers = new Headers(request.headers);
  headers.delete('host');
  
  const res = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
  });
  
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  return NextResponse.json(data || { success: false }, { status: res.status });
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  try {
    if (isContentMovieOrSeries(path)) {
      return await handleHostinnegar(path, request.nextUrl.searchParams);
    }
    return await handleRailway(path, request);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, message: 'خطا' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  try { return await handleRailway(path, request); } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  try { return await handleRailway(path, request); } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  try { return await handleRailway(path, request); } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}
