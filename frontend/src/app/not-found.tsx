import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
      <div className="w-24 h-24 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-6">
        <FiSearch className="w-12 h-12 text-[var(--text-muted)]" />
      </div>
      <h1 className="text-3xl font-black mb-2">۴۰۴</h1>
      <p className="text-[var(--text-muted)] mb-6">صفحه مورد نظر یافت نشد</p>
      <Link href="/" className="btn-primary">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
