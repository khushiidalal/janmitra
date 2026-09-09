'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  LayoutDashboard,
  FileText,
  Search,
  HelpCircle,
  Settings,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Case Registration',
    icon: FileText,
    path: '/cases/new',
  },
  {
    label: 'Search File',
    icon: Search,
    path: '/cases',
  },
  {
    label: 'Help and guidelines',
    icon: HelpCircle,
    path: '/help',
  },
  {
    label: 'Audit Trail',
    icon: ClipboardList,
    path: '/audit-trail',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed
        left-4
        top-4
        bottom-4
        z-40
        flex
        h-[calc(100vh-2rem)]
        w-[220px]
        flex-col
        overflow-hidden
        rounded-[18px]
        border
        border-blue-100
        bg-[#f7fbff]
        shadow-sm
        select-none
      "
    >
      {/* KORA BRANDING */}
      <Link
        href="/dashboard"
        className="
          flex
          shrink-0
          items-center
          gap-3
          px-4.5
          pb-2.5
          pt-4
          transition
          hover:bg-blue-50/50
        "
      >
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-full
            border
            border-blue-100
            bg-white
          "
        >
          <img
            src="/logo.jpg"
            alt="KORA Logo"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-wide text-[#0b2f73]">
            JANMITRA
          </h1>

          <p className="text-[8px] font-medium text-slate-500">
            Legal Investigation System
          </p>
        </div>
      </Link>

      {/* DIVIDER */}
      <div className="mx-3.5 shrink-0 border-t border-slate-200/80" />

      {/* NAVIGATION */}
      <nav className="shrink-0 space-y-1 px-2.5 py-2">
        {navItems.map((item) => {
          const currentPath = pathname || '';
          const isActive =
            item.path === '/cases/new'
               ? currentPath.startsWith('/cases/new')
               : item.path === '/cases'
               ? currentPath === '/cases' || (currentPath.startsWith('/cases/') && !currentPath.startsWith('/cases/new'))
               : currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

          return (
            <Link
              key={item.path}
              href={item.path}
              className={twMerge(
                clsx(
                  `
                    group
                    block
                    rounded-lg
                    text-[14.5px]
                    font-medium
                    transition-all
                  `,
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                )
              )}
            >
              <motion.div
                whileHover={{ x: isActive ? 0 : 3 }}
                className="flex h-10 w-full items-center gap-2.5 px-3"
              >
                <item.icon
                  className={clsx(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                  )}
                />

                <span className="truncate tracking-[-0.01em]">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* FLEXIBLE FILLER & COURT + TRICOLOR ILLUSTRATION */}
      <div className="flex flex-1 flex-col justify-end min-h-0 overflow-hidden">
        <div
          className="relative w-full h-full min-h-[85px] max-h-[175px] shrink bg-no-repeat transition-all"
          style={{
            backgroundImage: "url('/sidebar-tricolor.png')",
            backgroundSize: '130% auto',
            backgroundPosition: 'center 60%',
          }}
        />
      </div>

      {/* SYSTEM STATUS */}
      <div className="mx-2.5 mb-2.5 shrink-0">
        <div
          className="
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-slate-200/90
            bg-white
            px-3
            py-2.5
            shadow-xs
          "
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div>
              <p className="text-[11.5px] font-semibold leading-tight text-slate-800">
                System Status
              </p>

              <p className="mt-0.5 text-[10.5px] font-medium leading-none text-slate-500">
                All Systems Operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM INDIA LINE */}
      <div className="mx-3 mb-2.5 shrink-0">
        <div className="flex h-[3px] overflow-hidden rounded-full shadow-xs">
          <div className="flex-1 bg-orange-500" />
          <div className="flex-1 bg-white border-y border-slate-200" />
          <div className="flex-1 bg-green-600" />
        </div>
      </div>

      {/* SECURITY FOOTER */}
      <div className="mx-2.5 mb-3 flex shrink-0 items-center gap-2 px-1">
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-blue-100/90
            text-blue-700
          "
        >
          <ShieldCheck className="h-4 w-4 text-blue-700" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold leading-tight text-blue-700">
            Justice. Integrity. Service.
          </p>

          <p className="mt-0.5 text-[9.5px] leading-normal text-slate-500">
            Protected. Confidential. Trusted.
          </p>
        </div>
      </div>
    </aside>
  );
}