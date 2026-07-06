import Link from 'next/link';
import type { ReactNode } from 'react';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

interface InfoPageProps {
  badge: string;
  title: string;
  description: string;
  items: string[];
  children?: ReactNode;
}

export default function InfoPage({ badge, title, description, items, children }: InfoPageProps) {
  return (
    <div className="container-main py-10">
      <section className="glass relative overflow-hidden rounded-[2rem] p-6 md:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <span className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-rose-300">
            {badge}
          </span>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">{title}</h1>
          <p className="mt-5 text-sm leading-8 text-[var(--text-secondary)] md:text-base">
            {description}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="glass flex items-start gap-3 rounded-[1.5rem] p-4">
            <FiCheckCircle className="mt-1 h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{item}</p>
          </div>
        ))}
      </section>

      {children && <section className="mt-6">{children}</section>}

      <div className="mt-8">
        <Link href="/" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3">
          بازگشت به خانه
          <FiArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
