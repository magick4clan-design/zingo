'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiFilm, FiTv, FiUsers, FiTrendingUp, FiActivity, FiArrowLeft, FiList } from 'react-icons/fi';
import { adminAPI } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/Loading';

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentSeries, setRecentSeries] = useState([]);
  const [scrapLogs, setScrapLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => {
        const data = res.data.data;
        setStats(data.stats);
        setRecentMovies(data.recentMovies);
        setRecentSeries(data.recentSeries);
        setScrapLogs(data.recentScrapLogs);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  const statCards = [
    { label: 'فیلم‌ها', value: stats.movieCount || 0, icon: FiFilm, color: 'from-rose-500 to-pink-500' },
    { label: 'سریال‌ها', value: stats.seriesCount || 0, icon: FiTv, color: 'from-blue-500 to-cyan-500' },
    { label: 'کاربران', value: stats.userCount || 0, icon: FiUsers, color: 'from-green-500 to-emerald-500' },
    { label: 'کل بازدید', value: stats.totalViews || 0, icon: FiTrendingUp, color: 'from-orange-500 to-amber-500' },
  ];

  const navItems = [
    { href: '/admin/movies', label: 'مدیریت فیلم‌ها', icon: FiFilm },
    { href: '/admin/series', label: 'مدیریت سریال‌ها', icon: FiTv },
    { href: '/admin/users', label: 'مدیریت کاربران', icon: FiUsers },
    { href: '/admin/genres', label: 'مدیریت ژانرها', icon: FiList },
    { href: '/admin/scraper', label: 'مدیریت اسکرپ', icon: FiActivity },
  ];

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">پنل مدیریت</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">داشبورد مدیریت زینگو</p>
        </div>
        <Link href="/" className="btn-ghost flex items-center gap-2 text-sm">
          بازگشت به سایت <FiArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black">{toPersianNumber(stat.value)}</p>
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="card p-4 flex items-center gap-3 hover:border-rose-500/50">
            <item.icon className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
            <FiArrowLeft className="w-4 h-4 text-[var(--text-muted)] mr-auto" />
          </Link>
        ))}
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movies */}
        <div className="card p-5">
          <h2 className="font-bold mb-4">آخرین فیلم‌ها</h2>
          <div className="space-y-3">
            {recentMovies.slice(0, 5).map((m: Record<string, unknown>) => (
              <div key={String(m.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                <div className="w-10 h-14 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                  {typeof m.posterUrl === 'string' && (
                    <img src={m.posterUrl as string} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{m.title as string}</p>
                  <p className="text-xs text-[var(--text-muted)]">{toPersianNumber(m.views as number)} بازدید</p>
                </div>
              </div>
            ))}
            {recentMovies.length === 0 && <p className="text-sm text-[var(--text-muted)]">فیلمی ثبت نشده</p>}
          </div>
        </div>

        {/* Recent Series */}
        <div className="card p-5">
          <h2 className="font-bold mb-4">آخرین سریال‌ها</h2>
          <div className="space-y-3">
            {recentSeries.slice(0, 5).map((s: Record<string, unknown>) => (
              <div key={String(s.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                <div className="w-10 h-14 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                  {typeof s.posterUrl === 'string' && (
                    <img src={s.posterUrl as string} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{s.title as string}</p>
                  <p className="text-xs text-[var(--text-muted)]">{toPersianNumber(s.views as number)} بازدید</p>
                </div>
              </div>
            ))}
            {recentSeries.length === 0 && <p className="text-sm text-[var(--text-muted)]">سریالی ثبت نشده</p>}
          </div>
        </div>
      </div>

      {/* Scrap Logs */}
      {scrapLogs.length > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="font-bold mb-4">لاگ‌های اسکرپ</h2>
          <div className="space-y-2">
            {scrapLogs.slice(0, 10).map((log: Record<string, unknown>) => (
              <div key={String(log.id)} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-hover)] text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">{log.source as string}</span>
                </div>
                <span className="text-[var(--text-muted)]">{toPersianNumber(log.itemsScraped as number)} مورد</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
