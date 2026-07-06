'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FiSearch, FiSun, FiMoon, FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { href: '/', label: 'خانه' },
  { href: '/movies', label: 'فیلم‌ها' },
  { href: '/series', label: 'سریال‌ها' },
  { href: '/top-imdb', label: 'برترین IMDB' },
  { href: '/new-releases', label: 'تازه‌ها' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-2xl'
            : 'border-b border-white/5 bg-[var(--glass-bg)] backdrop-blur-xl'
        }`}
      >
        <div className="container-main">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative h-12 w-28 sm:w-32">
                <Image
                  src="/zingo-logo.png"
                  alt="زینگو"
                  fill
                  priority
                  sizes="128px"
                  className="object-contain"
                />
              </div>
            </Link>

            <nav className="hidden items-center gap-1 rounded-2xl border border-[var(--glass-border)] bg-white/[0.04] p-1 shadow-inner shadow-white/5 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    pathname === link.href
                      ? 'bg-gradient-to-l from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="btn-ghost !p-2.5"
                aria-label="جستجو"
              >
                <FiSearch className="h-5 w-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="btn-ghost !p-2.5"
                aria-label="تغییر تم"
              >
                {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-[var(--text-secondary)] transition-all hover:border-[var(--glass-border)] hover:bg-white/10 hover:text-[var(--text-primary)]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500">
                      <span className="text-xs font-bold text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="hidden text-sm md:block">{user?.name || 'کاربر'}</span>
                  </button>

                  <div className="invisible absolute left-0 top-full z-50 mt-3 w-52 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] opacity-0 shadow-[var(--glass-shadow)] backdrop-blur-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
                    <div className="p-2">
                      <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10">
                        <FiUser className="h-4 w-4" /> پروفایل
                      </Link>
                      <Link href="/favorites" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10">
                        <FiUser className="h-4 w-4" /> علاقه‌مندی‌ها
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 hover:bg-white/10">
                          <FiSettings className="h-4 w-4" /> پنل مدیریت
                        </Link>
                      )}
                      <hr className="my-1 border-[var(--border-color)]" />
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-white/10"
                      >
                        <FiLogOut className="h-4 w-4" /> خروج
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm">
                  ورود
                </Link>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn-ghost !p-2.5 lg:hidden"
                aria-label="منو"
              >
                {isMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full animate-slide-down border-b border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-2xl">
            <div className="container-main py-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="جستجوی فیلم، سریال، انیمه..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pr-12 text-lg"
                  autoFocus
                />
                <FiSearch className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
              </form>
            </div>
          </div>
        )}

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full animate-slide-down border-b border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-2xl lg:hidden">
            <div className="container-main py-4">
              <nav className="grid gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                      pathname === link.href
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-lg shadow-rose-500/10'
                        : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--glass-border)] hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
