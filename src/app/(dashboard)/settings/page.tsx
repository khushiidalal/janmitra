"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import {
  ChevronRight,
  CircleAlert,
  Lock,
  SlidersHorizontal,
  Shield,
  Download,
  User,
  ShieldCheck,
} from "lucide-react";

type SettingsSection =
  | "account"
  | "security"
  | "preferences"
  | "privacy";

type UserProfile = {
  fullName?: string;
  email?: string;
  role?: string;
  dateOfBirth?: string;
  gender?: string;
  govIdType?: string;
  govIdNumber?: string;
  address?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  jurisdiction?: string;
  joiningDate?: string;
  supervisingOfficer?: string;
  officialEmail?: string;
  officialPhone?: string;
  profilePhoto?: string;
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");

  const [textSize, setTextSize] = useState<
    "Small" | "Medium" | "Large"
  >("Medium");

  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("English (US)");

  const sections = [
    {
      id: "account" as SettingsSection,
      label: "Account Information",
      icon: User,
    },
    {
      id: "security" as SettingsSection,
      label: "Security",
      icon: Lock,
    },
    {
      id: "preferences" as SettingsSection,
      label: "Preferences",
      icon: SlidersHorizontal,
    },
    {
      id: "privacy" as SettingsSection,
      label: "Data & Privacy",
      icon: Shield,
    },
  ];

  return (
    <div
      className={`min-h-full ${
        highContrast ? "contrast-125" : ""
      }`}
    >
      {/* PAGE HEADER */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account, security, preferences, and privacy settings.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-xs font-medium text-green-700">
          <ShieldCheck className="h-4 w-4" />
          Session Encrypted
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="flex min-h-[560px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* LEFT SETTINGS MENU */}
        <aside className="w-[240px] shrink-0 border-r border-slate-200 bg-[#f7fbff] p-4">
          <div className="mb-4 px-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Settings Menu
            </p>
          </div>

          <div className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(section.id)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </div>

                  {isActive && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="min-w-0 flex-1 bg-white p-6">
          {activeSection === "account" && (
            <AccountInformation />
          )}

          {activeSection === "security" && (
            <SecuritySettings />
          )}

          {activeSection === "preferences" && (
            <PreferencesSettings
              language={language}
              setLanguage={setLanguage}
              textSize={textSize}
              setTextSize={setTextSize}
              highContrast={highContrast}
              setHighContrast={setHighContrast}
            />
          )}

          {activeSection === "privacy" && (
            <DataPrivacy />
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   ACCOUNT INFORMATION
========================================================= */

function AccountInformation() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    getMe()
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
        localStorage.setItem("userName", currentUser.fullName || "");
      })
      .catch(() => {
        // Cached signup data remains visible when the profile request fails.
      });
  }, []);

  const value = (field: keyof UserProfile) => user?.[field] || "Not provided";

  return (
    <section>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <CircleAlert className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Account Information
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Review your official account details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SettingItem
          label="Full Name"
          value={value("fullName")}
        />

        <SettingItem
          label="Email Address"
          value={value("email")}
        />

        <SettingItem
          label="System Role"
          value={value("role")}
        />

        <SettingItem
          label="Mobile Number"
          value={value("officialPhone")}
        />

        <SettingItem label="Official Email" value={value("officialEmail")} />
        <SettingItem label="Department" value={value("department")} />
        <SettingItem label="Designation" value={value("designation")} />
        <SettingItem label="Employee ID" value={value("employeeId")} />
        <SettingItem label="Jurisdiction" value={value("jurisdiction")} />
        <SettingItem label="Date of Birth" value={value("dateOfBirth")} />
        <SettingItem label="Gender" value={value("gender")} />
        <SettingItem label="Government ID Type" value={value("govIdType")} />
        <SettingItem label="Government ID Number" value={value("govIdNumber")} />
        <SettingItem label="Joining Date" value={value("joiningDate")} />
        <SettingItem
          label="Supervising Officer"
          value={value("supervisingOfficer")}
        />
        <SettingItem label="Address" value={value("address")} />
        <SettingItem
          label="Profile Photo"
          value={user?.profilePhoto ? "Captured during signup" : "Not provided"}
        />
      </div>
    </section>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecuritySettings() {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Lock className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Security Settings
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage password, devices, authentication and sessions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <SettingCard>
          <p className="text-sm font-semibold text-slate-900">
            Password
          </p>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              ••••••••
            </p>

            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Update
            </button>
          </div>
        </SettingCard>

        <SettingCard>
          <p className="text-sm font-semibold text-slate-900">
            Trusted Devices
          </p>

          <p className="mt-2 text-sm text-slate-700">
            MacBook Pro - Chrome
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              London, UK · Oct 29, 2025
            </span>

            <button className="text-xs font-medium text-red-500">
              Remove
            </button>
          </div>
        </SettingCard>

        <SettingCard>
          <p className="text-sm font-semibold text-slate-900">
            Two-Factor Authentication
          </p>

          <p className="mt-2 text-sm text-slate-700">
            OTP via registered mobile
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Last verified: Oct 24, 2023
          </p>

          <span className="mt-3 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            Enabled
          </span>
        </SettingCard>

        <SettingCard>
          <p className="text-sm font-semibold text-slate-900">
            Active Sessions
          </p>

          <p className="mt-2 text-sm text-slate-700">
            Current Session
          </p>

          <p className="mt-1 text-xs text-slate-500">
            MacBook Pro - Chrome
          </p>

          <button className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Sign Out of All Other Sessions
          </button>
        </SettingCard>
      </div>
    </section>
  );
}

/* =========================================================
   PREFERENCES
========================================================= */

type PreferencesProps = {
  language: string;
  setLanguage: (value: string) => void;

  textSize: "Small" | "Medium" | "Large";
  setTextSize: (
    value: "Small" | "Medium" | "Large"
  ) => void;

  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
};

function PreferencesSettings({
  language,
  setLanguage,
  textSize,
  setTextSize,
  highContrast,
  setHighContrast,
}: PreferencesProps) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <SlidersHorizontal className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Preferences
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Customize your KORA interface.
          </p>
        </div>
      </div>

      <div className="space-y-4">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <SettingCard>
            <label className="text-sm font-semibold text-slate-900">
              Display Language
            </label>

            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              className="mt-3 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Hindi</option>
            </select>
          </SettingCard>

          <SettingCard>
            <p className="text-sm font-semibold text-slate-900">
              Text Size
            </p>

            <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-300">
              {(["Small", "Medium", "Large"] as const).map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setTextSize(size)
                    }
                    className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                      textSize === size
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {size}
                  </button>
                )
              )}
            </div>
          </SettingCard>
        </div>

        <SettingCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                High Contrast
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Increase interface contrast for better visibility.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setHighContrast(!highContrast)
              }
              className={`relative h-6 w-11 rounded-full transition ${
                highContrast
                  ? "bg-blue-600"
                  : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition ${
                  highContrast
                    ? "left-[22px]"
                    : "left-[3px]"
                }`}
              />
            </button>
          </div>
        </SettingCard>
      </div>
    </section>
  );
}

/* =========================================================
   DATA & PRIVACY
========================================================= */

function DataPrivacy() {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Shield className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Data & Privacy
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Control access to your information and records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <SettingCard>
          <p className="text-sm font-semibold text-slate-900">
            Download My Data
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Request a copy of your account and case history records.
          </p>

          <button className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Request Download
          </button>
        </SettingCard>

        <SettingCard>
          <button className="flex w-full items-center justify-between border-b border-slate-200 pb-3 text-left">
            <span className="text-sm font-medium text-slate-800">
              View Privacy Policy
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button className="flex w-full items-center justify-between border-b border-slate-200 py-3 text-left">
            <span className="text-sm font-medium text-slate-800">
              View Terms of Service
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <div className="pt-3">
            <p className="text-sm font-semibold text-slate-900">
              Data Retention
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Case records are subject to legal retention requirements and
              cannot be deleted manually.
            </p>
          </div>
        </SettingCard>
      </div>
    </section>
  );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SettingItem({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">
          {value}
        </p>

        {action && (
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

function SettingCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      {children}
    </div>
  );
}
