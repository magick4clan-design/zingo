import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'زینگو - دانلود فیلم و سریال',
  description: 'دانلود رایگان فیلم و سریال خارجی، انیمه و سریال کره‌ای با لینک مستقیم و زیرنویس فارسی',
  keywords: ['دانلود فیلم', 'دانلود سریال', 'فیلم خارجی', 'سریال خارجی', 'انیمه', 'زینگو', 'zingo'],
  authors: [{ name: 'ShahBazTeam', url: 'https://shahbazteam.ir/' }],
  creator: 'ShahBazTeam',
  publisher: 'ShahBazTeam',
  icons: {
    icon: '/zingo-logo.png',
    shortcut: '/zingo-logo.png',
    apple: '/zingo-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body className="font-pinar min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-rose-500/25 selection:text-white">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
