'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiCheckCircle, FiMail, FiRefreshCw, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const emailFromQuery = params.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const { verifyEmail, resendVerification, isLoading } = useAuth();

  const storageKey = useMemo(() => `zingo_dev_code_${email}`, [email]);

  useEffect(() => {
    if (!email) return;
    setDevCode(sessionStorage.getItem(storageKey));
  }, [email, storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmail(email, code);
      sessionStorage.removeItem(storageKey);
      toast.success('ایمیل تایید شد؛ خوش آمدید');
      router.push('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'خطا در تایید ایمیل');
    }
  };

  const handleResend = async () => {
    try {
      const result = await resendVerification(email);
      if (result.devCode) {
        sessionStorage.setItem(storageKey, result.devCode);
        setDevCode(result.devCode);
      }
      toast.success('کد جدید ارسال شد');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'خطا در ارسال مجدد کد');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg glass rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-rose-950/20">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10">
            <span className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-rose-500/25 to-orange-400/25 blur-xl" />
            <FiShield className="relative h-9 w-9 text-rose-300" />
          </div>
          <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-slate-300">
            <FiMail className="h-4 w-4 text-orange-300" />
            فعال‌سازی حساب زینگو
          </p>
          <h1 className="text-2xl font-black md:text-3xl">کد تایید ایمیل را وارد کنید</h1>
          <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
            کد ۶ رقمی به ایمیل شما ارسال شده است. بعد از تایید، ورود به حساب به‌صورت خودکار انجام می‌شود.
          </p>
        </div>

        {devCode && (
          <div className="mb-5 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-4 text-center text-sm text-orange-100">
            حالت تست محلی: کد فعال‌سازی شما
            <span className="mx-2 inline-flex rounded-xl bg-black/25 px-3 py-1 font-black tracking-[0.35em] text-white ltr">
              {devCode}
            </span>
            است.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">ایمیل</label>
            <div className="relative">
              <FiMail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-field pr-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">کد ۶ رقمی</label>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="------"
              className="input-field text-center text-2xl font-black tracking-[0.55em] ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            تایید و ورود
            <FiCheckCircle className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading || !email}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ارسال مجدد کد
            <FiRefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            برگشت به ورود
            <FiArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
