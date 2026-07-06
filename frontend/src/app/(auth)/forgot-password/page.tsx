'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock - in production, send API request
    toast.success('لینک بازیابی رمز عبور به ایمیل شما ارسال شد');
    setIsSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl">Z</span>
          </div>
          <h1 className="text-2xl font-black">بازیابی رمز عبور</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">ایمیل خود را وارد کنید</p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              ارسال لینک بازیابی
            </button>
          </form>
        ) : (
          <div className="text-center p-6 card">
            <p className="text-green-500 mb-4"><FiCheckCircle className="inline w-5 h-5 ml-1" />لینک بازیابی ارسال شد</p>
            <p className="text-sm text-[var(--text-muted)]">
              لطفاً صندوق ایمیل خود را بررسی کنید.
            </p>
          </div>
        )}

        <p className="text-center text-sm mt-6 text-[var(--text-muted)]">
          <Link href="/login" className="text-rose-500 hover:text-rose-400 font-medium flex items-center justify-center gap-1">
            <FiArrowLeft className="w-4 h-4" /> بازگشت به ورود
          </Link>
        </p>
      </div>
    </div>
  );
}
