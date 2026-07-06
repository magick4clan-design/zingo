export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
