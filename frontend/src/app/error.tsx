'use client';

import { FiAlertTriangle } from 'react-icons/fi';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
      <div className="w-24 h-24 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <FiAlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-2xl font-black mb-2">خطایی رخ داد</h1>
      <p className="text-[var(--text-muted)] mb-6">{error.message || 'مشکلی پیش آمده است'}</p>
      <button onClick={reset} className="btn-primary">
        تلاش مجدد
      </button>
    </div>
  );
}
