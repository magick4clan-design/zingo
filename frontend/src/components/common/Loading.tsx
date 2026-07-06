export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeMap[size]} border-2 border-[var(--border-color)] border-t-rose-500 rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
        <span className="text-white font-black text-2xl">Z</span>
      </div>
      <LoadingSpinner size="lg" />
      <p className="text-[var(--text-muted)] text-sm">در حال بارگذاری...</p>
    </div>
  );
}
