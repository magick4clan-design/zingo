import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute left-[-10rem] top-[34rem] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.10)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
      </div>
      <Header />
      <main className="flex-1 pt-16 pb-28 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
