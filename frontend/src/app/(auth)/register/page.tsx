'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }
    try {
      const result = await register(email, password, name);
      if (result.devCode) {
        sessionStorage.setItem(`zingo_dev_code_${email}`, result.devCode);
      }
      toast.success('ثبت‌نام انجام شد؛ کد تایید را وارد کنید');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'خطا در ثبت‌نام');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl">Z</span>
          </div>
          <h1 className="text-2xl font-black">ثبت‌نام</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">حساب جدید در زینگو بسازید</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">نام (اختیاری)</label>
            <div className="relative">
              <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="input-field pr-10"
              />
            </div>
          </div>

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
                placeholder="حداقل ۶ کاراکتر"
                className="input-field pr-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">تکرار رمز عبور</label>
            <div className="relative">
              <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="رمز عبور را تکرار کنید"
                className="input-field pr-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            ثبت‌نام <FiArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[var(--text-muted)]">
          حساب دارید؟{' '}
          <Link href="/login" className="text-rose-500 hover:text-rose-400 font-medium">
            وارد شوید
          </Link>
        </p>
      </div>
    </div>
  );
}
