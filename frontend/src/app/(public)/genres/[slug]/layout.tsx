export function generateStaticParams() {
  return [{ slug: 'action' }];
}

export default function GenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
