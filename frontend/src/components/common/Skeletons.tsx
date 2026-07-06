export function MovieCardSkeleton() {
  return (
    <div className="card p-0">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function MovieRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="skeleton w-full h-[70vh] md:h-[80vh] rounded-2xl" />
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-2/3" />
      <div className="flex gap-6">
        <div className="skeleton w-64 aspect-[2/3] rounded-xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
