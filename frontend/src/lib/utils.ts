import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours} ساعت و ${mins} دقیقه`;
  return `${mins} دقیقه`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fa-IR');
}

export function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getYear(dateString?: string): number {
  if (!dateString) return 0;
  return new Date(dateString).getFullYear();
}

export function generateStarRating(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating / 2);
  const half = (rating / 2) % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

export function getQualityColor(quality?: string): string {
  if (!quality) return 'text-gray-400';
  const q = quality.toLowerCase();
  if (q.includes('4k') || q.includes('2160')) return 'text-yellow-400';
  if (q.includes('1080')) return 'text-green-400';
  if (q.includes('720')) return 'text-blue-400';
  if (q.includes('480')) return 'text-orange-400';
  return 'text-gray-400';
}
