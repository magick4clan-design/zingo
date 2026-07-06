'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiFilm, FiTv, FiStar, FiClock } from 'react-icons/fi';

const navItems = [
  { href: '/', label: 'خانه', icon: FiHome },
  { href: '/movies', label: 'فیلم', icon: FiFilm },
  { href: '/series', label: 'سریال', icon: FiTv },
  { href: '/top-imdb', label: 'IMDB', icon: FiStar },
  { href: '/new-releases', label: 'تازه', icon: FiClock },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-2xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-12 flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-l from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
