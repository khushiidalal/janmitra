"use client";

import {
  Bell,
  Lock,
  ChevronDown,
  User,
  LogOut,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../lib/api";

export default function TopNav() {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("Officer");
  const [userRole, setUserRole] = useState("Officer");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [initials, setInitials] = useState("OF");

  useEffect(() => {
    const computeInitials = (fullName?: string, uname?: string) => {
      const name = (fullName || uname || "").trim();
      if (!name) return "OF";
      const parts = name.split(/\s+/);
      if (parts.length > 1) {
        return (
          (parts[0][0] || "") + (parts[parts.length - 1][0] || "")
        ).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };

    const updateFromStorage = () => {
      const storedUserName = localStorage.getItem("userName");
      const storedUser = localStorage.getItem("user");

      let parsedUser: any = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch {}
      }

      const resolvedUsername =
        (parsedUser && (parsedUser.username || parsedUser.userName)) ||
        storedUserName ||
        (parsedUser && parsedUser.email ? parsedUser.email.split("@")[0] : "") ||
        "Officer";

      setUsername(resolvedUsername);

      if (parsedUser) {
        if (parsedUser.role || parsedUser.designation) {
          setUserRole(parsedUser.role || parsedUser.designation || "Officer");
        }
        if (typeof parsedUser.profilePhoto === "string") {
          setProfilePhoto(parsedUser.profilePhoto);
        }
        setInitials(computeInitials(parsedUser.fullName, resolvedUsername));
      } else if (storedUserName) {
        setInitials(computeInitials(undefined, storedUserName));
      }
    };

    updateFromStorage();

    const handleProfileUpdate = (event: Event) => {
      const customEvt = event as CustomEvent<any>;
      const user = customEvt.detail;

      if (user) {
        const resolvedUsername =
          user.username ||
          user.userName ||
          localStorage.getItem("userName") ||
          (user.email ? user.email.split("@")[0] : "") ||
          "Officer";

        setUsername(resolvedUsername);
        if (user.role || user.designation) {
          setUserRole(user.role || user.designation || "Officer");
        }
        if (typeof user.profilePhoto === "string") {
          setProfilePhoto(user.profilePhoto);
        }
        setInitials(computeInitials(user.fullName, resolvedUsername));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "userName" || event.key === "user") {
        updateFromStorage();
      }
    };

    window.addEventListener("janmitra:profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "janmitra:profile-updated",
        handleProfileUpdate,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    router.push("/settings");
  };

  return (
    <header className="flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="min-w-0">
        <p className="text-lg font-extrabold tracking-wide text-[#0b2f73]">
          Legal Investigation System
        </p>
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

        {/* ADMIN CONSOLE ENTRY POINT (ONLY FOR AUTHORIZED ADMIN) */}
        {userRole === "Admin" && (
          <motion.button
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/admin")}
            className="
              hidden
              items-center
              gap-1.5
              rounded-full
              border
              border-indigo-200
              bg-indigo-50
              px-3.5
              py-1.5
              text-xs
              font-bold
              text-indigo-700
              shadow-xs
              transition
              hover:bg-indigo-100
              hover:text-indigo-900
              md:flex
            "
          >
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
            <span>Admin Console</span>
            <span className="rounded bg-indigo-200 px-1 py-0.2 text-[9px] font-extrabold text-indigo-800 uppercase">
              Admin
            </span>
          </motion.button>
        )}

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
                      <p className="mt-1 text-xs text-slate-500">2 mins ago</p>
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
                      <p className="mt-1 text-xs text-slate-500">1 hour ago</p>
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-xs font-semibold text-green-700">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${username} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="max-w-[115px] truncate text-xs font-semibold leading-tight text-slate-800">
                {username}
              </span>

              <span className="max-w-[115px] truncate text-[10px] leading-tight text-slate-500">
                {userRole || "Officer"}
              </span>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
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
                {userRole === "Admin" && (
                  <>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/admin");
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        px-4
                        py-2.5
                        text-left
                        text-sm
                        font-semibold
                        text-indigo-700
                        transition
                        hover:bg-indigo-50
                      "
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-indigo-600" />
                        <span>Admin Console</span>
                      </div>
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-800 uppercase">
                        Admin
                      </span>
                    </button>

                    <div className="my-1 h-px bg-slate-100" />
                  </>
                )}

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
