'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import { isAuthenticated, getPreferences } from '@/lib/api';
import {
  getStoredPreferences,
  applyGlobalPreferences,
  UserPreferences,
} from '@/lib/preferences';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getStoredPreferences()
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/');
      return;
    }

    setAuthorized(true);

    
    const initialPrefs = getStoredPreferences();
    setPreferences(initialPrefs);
    applyGlobalPreferences(initialPrefs);

    
    getPreferences()
      .then((backendPrefs) => {
        if (backendPrefs) {
          const merged: UserPreferences = {
            language: backendPrefs.language || initialPrefs.language,
            textSize: backendPrefs.textSize || initialPrefs.textSize,
            highContrast:
              typeof backendPrefs.highContrast === 'boolean'
                ? backendPrefs.highContrast
                : initialPrefs.highContrast,
          };
          setPreferences(merged);
          applyGlobalPreferences(merged);
        }
      })
      .catch(() => {
        
      });

    
    const handlePrefChange = (event: Event) => {
      const customEvt = event as CustomEvent<UserPreferences>;
      if (customEvt.detail) {
        setPreferences(customEvt.detail);
        applyGlobalPreferences(customEvt.detail);
      }
    };

    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userPreferences' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setPreferences(parsed);
          applyGlobalPreferences(parsed);
        } catch {}
      }
    };

    window.addEventListener('janmitra:preferences-updated', handlePrefChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('janmitra:preferences-updated', handlePrefChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  if (!authorized) {
    return null;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-150 ${
        preferences.highContrast
          ? 'high-contrast bg-slate-200 text-black'
          : 'bg-[#f6f9fd]'
      }`}
    >
      <Sidebar />

      <div className="ml-[252px] min-h-screen">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
          <TopNav />
        </div>

        <main className="px-4 py-4 xl:px-5 xl:py-4">{children}</main>
      </div>
    </div>
  );
}
