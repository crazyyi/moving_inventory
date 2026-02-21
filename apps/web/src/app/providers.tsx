'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';

export default function HydrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hydrate the auth store on client mount
    useAuthStore.getState().hydrate();
  }, []);

  return <>{children}</>;
}
