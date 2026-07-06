import Link from 'next/link';
import Image from 'next/image';
import { FiGithub, FiMail, FiHeart } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="hidden border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl md:block">
      <div className="container-main py-10">
        <div className="glass grid grid-cols-1 gap-8 rounded-[2rem] p-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-16 w-36">
                <Image
                  src="/zingo-logo.png"
                  alt="زینگو"
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </div>
            </div>
            <p className="mb-4 text-sm leading-7 text-[var(--text-secondary)]">
              زینگو یک آرشیو تمیز و سریع برای کشف فیلم، سریال و انیمه است؛ با پوستر،
              توضیحات، دسته‌بندی و اطلاعات به‌روز از منابع عمومی. تمرکز فعلی روی تجربه کاربری
              روان، ظاهر مدرن و داده‌های مرتب است.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-[var(--text-primary)]">دسترسی سریع</h3>
            <ul className="space-y-2">
              <li><Link href="/movies" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">فیلم‌ها</Link></li>
              <li><Link href="/series" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">سریال‌ها</Link></li>
              <li><Link href="/top-imdb" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">برترین IMDB</Link></li>
              <li><Link href="/new-releases" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">تازه‌ترین‌ها</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-[var(--text-primary)]">اطلاعات</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">درباره ما</Link></li>
              <li><Link href="/rules" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">قوانین و مقررات</Link></li>
              <li><Link href="/contact" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">تماس با ما</Link></li>
              <li><Link href="/privacy" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-rose-500">حریم خصوصی</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-6 sm:flex-row">
          <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            ساخته شده با <FiHeart className="h-4 w-4 text-rose-500" /> توسط تیم شهباز © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ShahBazTeam"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="گیت‌هاب تیم شهباز"
              className="rounded-xl p-2 text-[var(--text-muted)] transition-all hover:bg-white/10 hover:text-rose-500"
            >
              <FiGithub className="h-5 w-5" />
            </a>
            <a
              href="mailto:ShahBazTeam@proton.me"
              aria-label="ایمیل تیم شهباز"
              className="rounded-xl p-2 text-[var(--text-muted)] transition-all hover:bg-white/10 hover:text-rose-500"
            >
              <FiMail className="h-5 w-5" />
            </a>
            <a
              href="https://shahbazteam.ir/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-all hover:bg-white/10 hover:text-rose-500"
            >
              shahbazteam.ir
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
