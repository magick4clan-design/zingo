'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageLoading } from '@/components/common/Loading';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading) return <PageLoading />;
  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
