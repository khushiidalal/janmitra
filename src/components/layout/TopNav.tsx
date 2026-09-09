'use client';

import {
  Bell,
  Lock,
  ChevronDown,
  User,
  LogOut,
  CheckCircle2,
  Search,
} from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../lib/api';

export default function TopNav() {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [storedName, setStoredName] = useState('Arsh Pratap Singh');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setStoredName(name);
    }
  }, []);

  const nameParts = storedName.trim().split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName =
    nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const initials = (
    (firstName[0] || '') +
    (lastName[0] || firstName[1] || '')
  ).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleProfileClick = () => {
    alert(`Viewing profile for ${storedName}`);
    setIsProfileOpen(false);
  };

  return (
    <header className="flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-4">
      {/* LEFT SEARCH */}
      <div className="w-full max-w-[360px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search by Case ID, FIR, Title ..."
            className="
              h-9
              w-full
              rounded-lg
              border
              border-slate-200
              bg-slate-50
              pl-10
              pr-4
              text-xs
              text-slate-700
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-blue-400
              focus:bg-white
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="relative ml-4 flex items-center gap-3">
        {/* SESSION */}
        <motion.div
          whileHover={{ y: -1 }}
          className="
            hidden
            items-center
            gap-2
            rounded-full
            bg-green-50
            px-4
            py-2
            text-xs
            font-semibold
            text-green-700
            md:flex
          "
        >
          <Lock className="h-4 w-4" />
          <span>Session Encrypted</span>
        </motion.div>

        {/* NOTIFICATION */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:bg-slate-50
            "
          >
            <Bell className="h-4 w-4" />

            <span
              className="
                absolute
                right-[9px]
                top-[8px]
                h-2
                w-2
                rounded-full
                border
                border-white
                bg-red-500
              "
            />
          </motion.button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="
                  absolute
                  right-0
                  z-50
                  mt-2
                  w-72
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-2
                  shadow-xl
                "
              >
                <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                  Notifications
                </div>

                <div className="max-h-[300px] space-y-1 overflow-y-auto p-2">
                  <div className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-slate-50">
                   <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-medium leading-tight text-slate-800">
                        New case assigned to you
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        2 mins ago
                      </p>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-slate-50">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-medium leading-tight text-slate-800">
                        FIR-2023-089 approved
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ y: -1 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              px-1
              py-1
              text-left
              transition
              hover:bg-slate-50
            "
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-semibold text-green-700">
              {initials}
            </div>

            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="max-w-[115px] truncate text-xs font-semibold leading-tight text-slate-800">
                {firstName}
              </span>

              <span className="max-w-[115px] truncate text-[10px] leading-tight text-slate-500">
                {lastName || 'Officer'}
              </span>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </motion.button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="
                  absolute
                  right-0
                  z-50
                  mt-2
                  w-48
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-2
                  shadow-xl
                "
              >
                <button
                  onClick={handleProfileClick}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    px-4
                    py-2
                    text-left
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </button>

                <div className="my-1 h-px bg-slate-100" />

                <button
                  onClick={handleSignOut}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    px-4
                    py-2
                    text-left
                    text-sm
                    text-red-600
                    transition
                    hover:bg-red-50
                  "
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}