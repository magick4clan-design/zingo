export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function MovieLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
