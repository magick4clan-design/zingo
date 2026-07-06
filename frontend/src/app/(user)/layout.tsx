import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pt-16 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
