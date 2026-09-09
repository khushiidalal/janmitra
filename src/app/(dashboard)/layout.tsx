'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import { isAuthenticated } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f9fd]">
      <Sidebar />

      <div className="ml-[252px] min-h-screen">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <TopNav />
        </div>

        <main className="px-4 py-4 xl:px-5 xl:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
