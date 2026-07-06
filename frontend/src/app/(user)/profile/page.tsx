'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/lib/auth';
import { toPersianNumber } from '@/lib/utils';
import { PageLoading } from '@/components/common/Loading';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <PageLoading />;

  return (
    <div className="container-main py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-8">پروفایل من</h1>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name || ''} width={80} height={80} className="object-cover" />
            ) : (
              <FiUser className="w-8 h-8 text-rose-500" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name || 'کاربر'}</h2>
            <p className="text-sm text-[var(--text-muted)]">{user.role === 'ADMIN' ? 'مدیر' : 'کاربر عادی'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-xl">
            <FiMail className="w-5 h-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">ایمیل</p>
              <p className="text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-xl">
            <FiCalendar className="w-5 h-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">تاریخ عضویت</p>
              <p className="text-sm">{user.createdAt ? toPersianNumber(new Date(user.createdAt).getFullYear()) : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
