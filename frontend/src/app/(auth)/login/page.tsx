'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('ورود موفق!');
      router.push('/');
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: {
            code?: string;
            message?: string;
            data?: { email?: string; devCode?: string };
          };
        };
      };
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        const targetEmail = err.response.data.data?.email || email;
        const devCode = err.response.data.data?.devCode;
        if (devCode) {
          sessionStorage.setItem(`zingo_dev_code_${targetEmail}`, devCode);
        }
        toast('برای ورود، ایمیل خود را تایید کنید');
        router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
        return;
      }
      toast.error(err?.response?.data?.message || 'خطا در ورود');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl">Z</span>
          </div>
          <h1 className="text-2xl font-black">ورود به زینگو</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">به زینگو خوش آمدید</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">ایمیل</label>
            <div className="relative">
              <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
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
            <label className="block text-sm font-medium mb-1.5">رمز عبور</label>
            <div className="relative">
              <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
                className="input-field pr-10"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              مرا به خاطر بسپار
            </label>
            <Link href="/forgot-password" className="text-sm text-rose-500 hover:text-rose-400">
              فراموشی رمز
            </Link>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            ورود <FiArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[var(--text-muted)]">
          حساب ندارید؟{' '}
          <Link href="/register" className="text-rose-500 hover:text-rose-400 font-medium">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>
    </div>
  );
}
