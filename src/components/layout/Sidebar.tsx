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
        w-[220px]
        flex-col
        overflow-hidden
        rounded-[18px]
        border
        border-blue-100
        bg-[#f7fbff]
        shadow-sm
      "
    >
      {/* KORA BRANDING */}
      <Link
        href="/dashboard"
        className="
          flex
          items-center
          gap-3
          px-5
          pb-4
          pt-5
          transition
          hover:bg-blue-50/50
        "
      >
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="
            flex
            h-12
            w-12
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
      <div className="mx-4 border-t border-slate-200" />

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 px-3 py-3">
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
                    block
                    rounded-md
                    text-[12px]
                    font-medium
                    transition-all
                  `,
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                )
              )}
            >
              <motion.div
                whileHover={{ x: isActive ? 0 : 3 }}
                className="flex w-full items-center gap-3 px-3 py-2.5"
              >
                <item.icon
                  className={clsx(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-white' : 'text-slate-500'
                  )}
                />

                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* COURT + TRICOLOR ILLUSTRATION */}
      <div
        className="relative h-[180px] w-full overflow-hidden bg-no-repeat"
        style={{
          backgroundImage: "url('/sidebar-tricolor.png')",
          backgroundSize: '125% auto',
          backgroundPosition: 'center 62%',
        }}
      />

      {/* SYSTEM STATUS */}
      <div className="mx-3 mb-3">
        <div
          className="
            flex
            items-center
            justify-between
            rounded-lg
            border
            border-slate-200
            bg-white
            px-3
            py-2.5
            shadow-sm
          "
        >
          <div className="flex items-start gap-2">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-green-500" />

            <div>
              <p className="text-[9px] font-semibold text-slate-700">
                System Status
              </p>

              <p className="mt-0.5 text-[8px] text-slate-400">
                All Systems Operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM INDIA LINE */}
      <div className="mx-4 mb-3">
        <div className="flex h-[3px] overflow-hidden rounded-full">
          <div className="flex-1 bg-orange-400" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-green-500" />
        </div>
      </div>

      {/* SECURITY FOOTER */}
      <div className="mx-3 mb-4 flex items-center gap-2 px-1">
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-blue-100
          "
        >
          <ShieldCheck className="h-4 w-4 text-blue-700" />
        </div>

        <div>
          <p className="text-[9px] font-semibold text-blue-700">
            Justice. Integrity. Service.
          </p>

          <p className="mt-0.5 text-[8px] text-slate-400">
            Protected. Confidential. Trusted.
          </p>
        </div>
      </div>
    </aside>
  );
}