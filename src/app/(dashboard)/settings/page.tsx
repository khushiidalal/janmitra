"use client";

import { useEffect, useState } from "react";
import {
  getMe,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  getTwoFactorStatus,
  toggleTwoFactor,
  updatePreferences,
  downloadUserData,
  getSessionPassword,
  setSessionPassword,
} from "@/lib/api";
import {
  broadcastPreferencesUpdate,
  broadcastProfileUpdate,
} from "@/lib/preferences";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  SlidersHorizontal,
  Shield,
  Download,
  User,
  Smartphone,
  Laptop,
  Check,
  X,
  AlertTriangle,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  BadgeCheck,
} from "lucide-react";

type SettingsSection = "account" | "security" | "preferences" | "privacy";

type UserProfile = {
  id?: string;
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
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  twoFactorLastVerified?: string | null;
  preferences?: {
    language?: string;
    textSize?: "Small" | "Medium" | "Large";
    highContrast?: boolean;
  };
};

type SessionItem = {
  sessionId: string;
  device: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  isTrusted: boolean;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Preferences state
  const [textSize, setTextSize] = useState<"Small" | "Medium" | "Large">("Medium");
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [prefSaveStatus, setPrefSaveStatus] = useState<string | null>(null);

  // Load user data & preferences
  const fetchUserProfile = async () => {
    try {
      const currentUser = await getMe();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
        localStorage.setItem("userName", currentUser.fullName || "");

        if (currentUser.preferences) {
          if (currentUser.preferences.language) setLanguage(currentUser.preferences.language);
          if (currentUser.preferences.textSize) setTextSize(currentUser.preferences.textSize);
          if (typeof currentUser.preferences.highContrast === "boolean") {
            setHighContrast(currentUser.preferences.highContrast);
          }
          broadcastPreferencesUpdate(currentUser.preferences);
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      // Fallback to cached data if available
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    broadcastPreferencesUpdate({ language: newLang, textSize, highContrast });
    setPrefSaveStatus("Saving...");
    try {
      await updatePreferences({ language: newLang });
      setPrefSaveStatus("Preferences saved");
      setTimeout(() => setPrefSaveStatus(null), 2500);
    } catch {
      setPrefSaveStatus("Failed to save preference");
    }
  };

  const handleTextSizeChange = async (newSize: "Small" | "Medium" | "Large") => {
    setTextSize(newSize);
    broadcastPreferencesUpdate({ language, textSize: newSize, highContrast });
    setPrefSaveStatus("Saving...");
    try {
      await updatePreferences({ textSize: newSize });
      setPrefSaveStatus("Preferences saved");
      setTimeout(() => setPrefSaveStatus(null), 2500);
    } catch {
      setPrefSaveStatus("Failed to save preference");
    }
  };

  const handleContrastToggle = async () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    broadcastPreferencesUpdate({ language, textSize, highContrast: nextVal });
    setPrefSaveStatus("Saving...");
    try {
      await updatePreferences({ highContrast: nextVal });
      setPrefSaveStatus("Preferences saved");
      setTimeout(() => setPrefSaveStatus(null), 2500);
    } catch {
      setPrefSaveStatus("Failed to save preference");
    }
  };

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

  const getTextSizeClass = () => {
    switch (textSize) {
      case "Small":
        return "text-[13px] leading-relaxed";
      case "Large":
        return "text-[16px] leading-relaxed";
      case "Medium":
      default:
        return "text-[14px] leading-normal";
    }
  };

  return (
    <div
      className={`min-h-full transition-all duration-200 ${
        highContrast ? "contrast-125 saturate-125 bg-slate-100 text-black" : ""
      } ${getTextSizeClass()}`}
    >
      {/* PAGE HEADER - Duplicate "Session Encrypted" badge removed as requested */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your authenticated profile, security credentials, interface preferences, and privacy controls.
          </p>
        </div>
        {prefSaveStatus && (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 animate-fade-in border border-blue-200">
            <Check className="h-3.5 w-3.5 text-blue-600" />
            {prefSaveStatus}
          </div>
        )}
      </div>

      {/* MAIN CARD */}
      <div className="flex min-h-[580px] w-full flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* LEFT SETTINGS MENU */}
        <aside className="w-full md:w-[250px] shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-[#f8faff] p-4">
          <div className="mb-4 px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settings Menu
            </p>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{section.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="min-w-0 flex-1 bg-white p-6 sm:p-8">
          {activeSection === "account" && (
            <AccountInformation
              user={user}
              loading={loading}
              onUserUpdated={(updated) => {
                setUser(updated);
                broadcastProfileUpdate(updated);
              }}
            />
          )}

          {activeSection === "security" && (
            <SecuritySettings user={user} onRefreshUser={fetchUserProfile} />
          )}

          {activeSection === "preferences" && (
            <PreferencesSettings
              language={language}
              onLanguageChange={handleLanguageChange}
              textSize={textSize}
              onTextSizeChange={handleTextSizeChange}
              highContrast={highContrast}
              onContrastToggle={handleContrastToggle}
            />
          )}

          {activeSection === "privacy" && <DataPrivacy />}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   1. ACCOUNT INFORMATION — REAL USER DATA
========================================================= */

function AccountInformation({
  user,
  loading,
  onUserUpdated,
}: {
  user: UserProfile | null;
  loading: boolean;
  onUserUpdated: (u: UserProfile) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    officialPhone: "",
    officialEmail: "",
    department: "",
    designation: "",
    employeeId: "",
    jurisdiction: "",
    dateOfBirth: "",
    address: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const value = (field: keyof UserProfile) => {
    const val = user?.[field];
    if (val === undefined || val === null || val === "") {
      return "Not provided";
    }
    return String(val);
  };

  const startEdit = () => {
    if (!user) return;
    setEditForm({
      fullName: user.fullName || "",
      officialPhone: user.officialPhone || "",
      officialEmail: user.officialEmail || user.email || "",
      department: user.department || "",
      designation: user.designation || "",
      employeeId: user.employeeId || "",
      jurisdiction: user.jurisdiction || "",
      dateOfBirth: user.dateOfBirth || "",
      address: user.address || "",
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      setEditError("Full name cannot be empty");
      return;
    }
    setIsSaving(true);
    setEditError(null);
    try {
      const updated = await updateProfile(editForm);
      onUserUpdated(updated);
      setEditSuccess("Profile information updated successfully");
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess(null);
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading official credentials...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Top Banner with Officer Badge and Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.fullName || "Officer"}
              className="h-14 w-14 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg border border-blue-200 shadow-inner">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "JM"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {value("fullName")}
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {value("role")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Employee ID: <span className="font-medium text-slate-700">{value("employeeId")}</span>
              {" · "}
              {value("department")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <Edit3 className="h-3.5 w-3.5 text-blue-600" />
          Edit Profile Information
        </button>
      </div>

      {/* 10 Required Fields + Registration Extras */}
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Official Police Account Record
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrieved directly from your verified registration record in the JANMITRA database.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <SettingItem label="Full Name" value={value("fullName")} />
          <SettingItem label="Email Address" value={value("email")} />
          <SettingItem label="Mobile Number" value={value("officialPhone")} />
          <SettingItem label="System Role" value={value("role")} />
          <SettingItem label="Official Email" value={value("officialEmail")} />
          <SettingItem label="Department" value={value("department")} />
          <SettingItem label="Designation" value={value("designation")} />
          <SettingItem label="Employee ID" value={value("employeeId")} />
          <SettingItem label="Jurisdiction" value={value("jurisdiction")} />
          <SettingItem label="Date of Birth" value={value("dateOfBirth")} />
          <SettingItem label="Gender" value={value("gender")} />
          <SettingItem
            label="Government ID"
            value={
              user?.govIdType
                ? `${user.govIdType}${user.govIdNumber ? ` (${user.govIdNumber})` : ""}`
                : "Not provided"
            }
          />
          <SettingItem label="Date of Joining" value={value("joiningDate")} />
          <SettingItem label="Supervising Officer" value={value("supervisingOfficer")} />
          <div className="sm:col-span-2">
            <SettingItem label="Station / Jurisdiction Address" value={value("address")} />
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update Account Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your official contact and departmental details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700 border border-green-200">
                <Check className="h-4 w-4 shrink-0 text-green-600" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.officialPhone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, officialPhone: e.target.value })
                    }
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={editForm.officialEmail}
                    onChange={(e) =>
                      setEditForm({ ...editForm, officialEmail: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) =>
                      setEditForm({ ...editForm, designation: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, employeeId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={editForm.jurisdiction}
                    onChange={(e) =>
                      setEditForm({ ...editForm, jurisdiction: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dateOfBirth: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station / Address
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   2. SECURITY SETTINGS — REAL SESSIONS & 2FA & PASSWORDS
========================================================= */

function SecuritySettings({
  user,
  onRefreshUser,
}: {
  user: UserProfile | null;
  onRefreshUser: () => void;
}) {
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Card view password state
  const [showCardPassword, setShowCardPassword] = useState(false);
  const [cardPasswordPlain, setCardPasswordPlain] = useState(() => getSessionPassword());

  const handleToggleCardPassword = () => {
    if (showCardPassword) {
      setShowCardPassword(false);
      return;
    }
    const cached = getSessionPassword();
    if (cached) {
      setCardPasswordPlain(cached);
      setShowCardPassword(true);
    } else {
      setShowPasswordModal(true);
      setPassError("Verify your current password to view or update credentials.");
    }
  };

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaMessage, setTwoFaMessage] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load 2FA and Sessions from real APIs
  const fetchSecurityData = async () => {
    try {
      const [twoFaData, sessionsData] = await Promise.all([
        getTwoFactorStatus(),
        getSessions(),
      ]);

      if (twoFaData && typeof twoFaData.twoFactorEnabled === "boolean") {
        setTwoFaEnabled(twoFaData.twoFactorEnabled);
      }
      if (sessionsData && Array.isArray(sessionsData.sessions)) {
        setSessions(sessionsData.sessions);
      }
    } catch (err) {
      console.error("Failed to load security status:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 8) {
      setPassError("New password must be at least 8 characters (PIN or password).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassSuccess("Password updated successfully.");
      setSessionPassword(newPassword);
      setCardPasswordPlain(newPassword);
      setShowCardPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || "Failed to change password");
    } finally {
      setPassLoading(false);
    }
  };

  // Toggle 2FA
  const handleToggleTwoFa = async () => {
    setTwoFaLoading(true);
    setTwoFaMessage(null);
    try {
      const nextState = !twoFaEnabled;
      const res = await toggleTwoFactor(nextState, "sms");
      setTwoFaEnabled(res.twoFactorEnabled);
      setTwoFaMessage(
        res.twoFactorEnabled
          ? "Two-Factor Authentication is now ENABLED."
          : "Two-Factor Authentication is now DISABLED."
      );
      onRefreshUser();
      setTimeout(() => setTwoFaMessage(null), 3000);
    } catch (err: any) {
      setTwoFaMessage(err.message || "Failed to update 2FA status");
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Revoke specific session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      setActionMessage("Session device revoked successfully.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || "Failed to revoke session");
    }
  };

  // Sign out of all other sessions
  const handleRevokeAllOther = async () => {
    try {
      const res = await revokeAllOtherSessions();
      if (res && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      } else {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
      }
      setActionMessage("All other sessions have been signed out.");
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage(err.message || "Failed to sign out of other sessions");
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Security Settings
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage your credentials, two-factor authentication, and active device sessions.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs font-medium text-blue-700 border border-blue-200">
          <Check className="h-4 w-4 text-blue-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Grid of Security Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Password Card */}
        <SettingCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Authentication Credential
            </span>
            <span className="text-xs text-slate-400">Stored via Bcrypt Hash</span>
          </div>

          <p className="text-sm font-semibold text-slate-900 mt-2">
            Officer PIN / Password
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 select-all">
                {showCardPassword ? (cardPasswordPlain || "••••••••") : "••••••••"}
              </span>

              <button
                type="button"
                onClick={handleToggleCardPassword}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                title={showCardPassword ? "Hide password" : "View password"}
                aria-label={showCardPassword ? "Hide password" : "View password"}
              >
                {showCardPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                    <span>View</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(true);
                setPassError(null);
                setPassSuccess(null);
              }}
              className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
            >
              Update Password
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Requires your existing password to verify before applying changes.
          </p>
        </SettingCard>

        {/* Two-Factor Authentication Card */}
        <SettingCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Two-Factor Authentication (2FA)
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                twoFaEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {twoFaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-900 mt-2">
            OTP via Verified Mobile
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {twoFaEnabled
              ? "Secondary OTP prompt required during new sign-in sessions."
              : "Enable OTP verification for elevated law-enforcement security."}
          </p>

          {user?.twoFactorLastVerified && twoFaEnabled && (
            <p className="mt-1 text-[11px] text-slate-400">
              Last verified: {new Date(user.twoFactorLastVerified).toLocaleDateString()}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-600 font-medium">
              {twoFaEnabled ? "2FA Protection Active" : "2FA Inactive"}
            </span>
            <button
              type="button"
              disabled={twoFaLoading}
              onClick={handleToggleTwoFa}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                twoFaEnabled
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {twoFaLoading ? "Processing..." : twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>

          {twoFaMessage && (
            <p className="mt-2 text-xs font-medium text-blue-600 animate-fade-in">
              {twoFaMessage}
            </p>
          )}
        </SettingCard>
      </div>

      {/* Active Sessions & Trusted Devices List */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Active Sessions & Trusted Devices
              </h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live hardware and network sessions authenticated with your credentials.
            </p>
          </div>

          <button
            type="button"
            disabled={otherSessionsCount === 0}
            onClick={handleRevokeAllOther}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
          >
            Sign Out of All Other Sessions
          </button>
        </div>

        {sessionsLoading ? (
          <div className="flex justify-center py-8 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No active session data recorded.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {sessions.map((session) => {
              const isDesktop = session.deviceType?.toLowerCase().includes("desktop");

              return (
                <div
                  key={session.sessionId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition ${
                    session.isCurrent
                      ? "border-blue-200 bg-blue-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        session.isCurrent
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isDesktop ? (
                        <Laptop className="h-4 w-4" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {session.device || "Verified Device"}
                        </p>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                            Current Session
                          </span>
                        )}
                        {session.isTrusted && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-blue-700">
                            <BadgeCheck className="h-3 w-3" />
                            Trusted
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        IP: <span className="font-mono">{session.ipAddress}</span>
                        {" · "}
                        {session.location || "Secure Network"}
                        {" · Active: "}
                        {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    {session.isCurrent ? (
                      <span className="text-xs font-medium text-slate-400 italic">
                        Active in this window
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(session.sessionId)}
                        className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition"
                      >
                        Remove Device
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Change Password / PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {passError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700 border border-green-200">
                <Check className="h-4 w-4 shrink-0 text-green-600" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your existing password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters (PIN or password)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {passLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   3. PREFERENCES — FUNCTIONAL & PERSISTED
========================================================= */

type PreferencesProps = {
  language: string;
  onLanguageChange: (value: string) => void;
  textSize: "Small" | "Medium" | "Large";
  onTextSizeChange: (value: "Small" | "Medium" | "Large") => void;
  highContrast: boolean;
  onContrastToggle: () => void;
};

function PreferencesSettings({
  language,
  onLanguageChange,
  textSize,
  onTextSizeChange,
  highContrast,
  onContrastToggle,
}: PreferencesProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Interface Preferences
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Personalize your JANMITRA workspace. All selections are saved to your account in the database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SettingCard>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Display Language
          </label>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            System & Interface Locale
          </p>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="mt-3 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="English (US)">English (US)</option>
            <option value="English (UK)">English (UK)</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
          </select>
          <p className="mt-2 text-xs text-slate-400">
            Applied to system menus, notifications, and form templates.
          </p>
        </SettingCard>

        <SettingCard>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Typography Scale
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            Text Size
          </p>

          <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-300">
            {(["Small", "Medium", "Large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onTextSizeChange(size)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                  textSize === size
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Scales fonts dynamically across all dashboard panels.
          </p>
        </SettingCard>
      </div>

      <SettingCard>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accessibility
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              High Contrast Mode
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sharpens card borders, background contrast, and element borders for enhanced readability.
            </p>
          </div>

          <button
            type="button"
            onClick={onContrastToggle}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              highContrast ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${
                highContrast ? "left-[23px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>
      </SettingCard>
    </section>
  );
}

/* =========================================================
   4. DATA & PRIVACY — EXPORT & LEGAL POLICIES
========================================================= */

function DataPrivacy() {
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  // Accordion state
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadMessage(null);
    try {
      await downloadUserData();
      setDownloadMessage("Export downloaded successfully.");
      setTimeout(() => setDownloadMessage(null), 3500);
    } catch (err: any) {
      setDownloadMessage(err.message || "Failed to download export");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Data & Privacy
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Control data exports, review legal policies, and inspect evidentiary retention rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Download My Data */}
        <SettingCard>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-slate-900">
              Download My Data (JSON)
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Exports your authenticated officer profile, preferences, assigned cases, uploaded document metadata, active session log, and personal audit trail.
          </p>

          <div className="mt-2 rounded-md bg-slate-100 p-2.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Security Notice: </span>
            Password hashes, salts, raw JWT tokens, and OTP secrets are strictly excluded from the export for your security.
          </div>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
          >
            {downloading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {downloading ? "Generating Export..." : "Download My Data"}
          </button>

          {downloadMessage && (
            <p className="mt-2 text-xs font-medium text-blue-600 animate-fade-in">
              {downloadMessage}
            </p>
          )}
        </SettingCard>

        {/* Data Retention Statement */}
        <SettingCard>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-slate-900">
              Data Retention & Evidentiary Rules
            </p>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Pursuant to the Bharatiya Nagarik Suraksha Sanhita (BNSS) and statutory digital evidence protocols:
          </p>

          <ul className="mt-2 space-y-1.5 text-xs text-slate-500 list-disc list-inside">
            <li>
              <strong className="text-slate-700">Primary Case Files & FIRs:</strong> Retained permanently as legal evidentiary court records.
            </li>
            <li>
              <strong className="text-slate-700">Chain-of-Custody Audit Logs:</strong> Tamper-evident logs are immutable and cannot be expunged manually.
            </li>
            <li>
              <strong className="text-slate-700">User Session Tokens:</strong> Cryptographic auth tokens expire after 7 days of inactivity.
            </li>
          </ul>
        </SettingCard>
      </div>

      {/* Expandable Accordions for Legal Policies */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Legal & Compliance Documentation
        </h3>

        {/* Privacy Policy Accordion */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenPrivacy(!openPrivacy)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">
                  JANMITRA Privacy Policy
                </span>
                <p className="text-xs text-slate-500">
                  8 detailed legal sections covering law-enforcement data protection and privacy standards.
                </p>
              </div>
            </div>
            {openPrivacy ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openPrivacy && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-5 text-xs text-slate-700 space-y-4 leading-relaxed max-h-[400px] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-900">1. Information Collection & Identity Verification</h4>
                <p className="mt-1">
                  JANMITRA collects official law enforcement credentials, including full legal name, government employee identification, official email address, mobile number, department assignment, and biometric verification photographs during officer registration. System access is monitored through hardware telemetry, operating system identifiers, and IP routing logs.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">2. Purpose & Use of Law Enforcement Data</h4>
                <p className="mt-1">
                  All collected data is utilized exclusively for sovereign policing operations, case management, First Information Report (FIR) processing, optical character recognition (OCR) evidentiary transcription, and official inter-departmental case transfers. Data is never repurposed for commercial or non-official purposes.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">3. Data Security & Cryptographic Protection</h4>
                <p className="mt-1">
                  All sensitive records, officer passwords, and judicial evidence are protected using AES-256 encryption at rest and TLS 1.3 encryption in transit. User passwords are salted and hashed utilizing industry-standard bcrypt algorithms. Evidentiary documents are indexed with SHA-256 checksums to verify cryptographic integrity.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">4. Role-Based Access Control (RBAC)</h4>
                <p className="mt-1">
                  Access to criminal records, witness details, and sensitive case materials is strictly compartmentalized based on verified officer roles (Admin, Senior Officer, Investigator, Officer, Clerk, Viewer) adhering strictly to the principle of least privilege.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">5. Mandatory Evidentiary Data Retention</h4>
                <p className="mt-1">
                  Pursuant to national criminal procedure and forensic evidentiary standards, case files, FIR registries, evidence artifacts, and chain-of-custody audit logs are preserved permanently as official legal records. User session tokens expire automatically after 7 days of inactivity.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">6. Disclosure to Third Parties & Judicial Authorities</h4>
                <p className="mt-1">
                  Information contained within JANMITRA shall only be disclosed pursuant to formal judicial subpoenas, High Court directives, or statutory investigative mandates. No private contractor or external entity is granted unmonitored access to case records.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">7. Officer Rights & Profile Corrections</h4>
                <p className="mt-1">
                  Authenticated officers have the right to review their personal account information and request administrative corrections through their supervising officer or the system administrator. Official case logs remain immutable for audit compliance.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">8. Supervisory Oversight & Contact</h4>
                <p className="mt-1">
                  For privacy queries or statutory compliance questions, contact the Department Data Protection Officer (DPO) at <span className="font-mono text-blue-700">dpo@police.gov.in</span> or via the Police IT Directorate.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Terms of Service Accordion */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenTerms(!openTerms)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">
                  JANMITRA Terms of Service
                </span>
                <p className="text-xs text-slate-500">
                  10 detailed legal sections governing official system access, chain of custody, and security obligations.
                </p>
              </div>
            </div>
            {openTerms ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openTerms && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-5 text-xs text-slate-700 space-y-4 leading-relaxed max-h-[400px] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-900">1. Authorized Official Purpose Only</h4>
                <p className="mt-1">
                  JANMITRA is a sovereign law enforcement platform. Access is strictly granted to authorized police personnel for official duty. Unauthorized access, private investigations without FIR registration, or personal queries constitute serious departmental misconduct.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">2. Credential Security & Account Non-Transferability</h4>
                <p className="mt-1">
                  Officers must safeguard their authentication credentials, OTPs, and access tokens. Sharing login credentials with colleagues, clerks, or unauthorized personnel is strictly prohibited. Each action performed under an account is legally attributed to the account holder.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">3. Chain of Custody & Evidence Integrity</h4>
                <p className="mt-1">
                  All documents uploaded to JANMITRA are assigned unique cryptographic SHA-256 hashes. Altering, falsifying, or deleting evidentiary materials is a criminal offense under the Bharatiya Nyaya Sanhita (BNS) and the Information Technology Act.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">4. Automated Activity Logging & Surveillance</h4>
                <p className="mt-1">
                  Every user query, case view, document download, and search term is permanently logged in immutable audit records. Logs capture timestamp, IP address, device fingerprints, and officer credentials for supervisory oversight.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">5. Prohibited Conduct & Penalties</h4>
                <p className="mt-1">
                  Prohibited conduct includes attempted penetration testing, unauthorized data extraction, exporting records outside secure intranet channels, and attempting to bypass role permissions. Violations result in immediate suspension and statutory prosecution.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">6. System Availability & Service Levels</h4>
                <p className="mt-1">
                  While JANMITRA strives for 99.99% operational uptime for emergency response, scheduled maintenance windows are coordinated during low-activity hours with advance notification to all control rooms.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">7. Intellectual Property & Government Ownership</h4>
                <p className="mt-1">
                  All software code, user interface designs, algorithms, databases, and evidentiary case records are the exclusive property of the Government Police Department.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">8. Revocation & Suspension of Access</h4>
                <p className="mt-1">
                  User accounts are automatically suspended or revoked upon departmental transfer, disciplinary suspension, resignation, or retirement. Supervising officers hold administrative authority to terminate active sessions immediately.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">9. Limitation of Liability & Official Immunity</h4>
                <p className="mt-1">
                  Officers acting in good faith pursuant to lawful police duty are protected under sovereign immunity provisions. The department assumes no liability for damages resulting from user credential compromise due to officer negligence.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">10. Governing Law & Judicial Jurisdiction</h4>
                <p className="mt-1">
                  These terms are governed by the Police Act, Bharatiya Nagarik Suraksha Sanhita (BNSS), and the Information Technology Act. All disputes are subject to the exclusive jurisdiction of the state High Court.
                </p>
              </div>
            </div>
          )}
        </div>
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
  onAction,
}: {
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-slate-300">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p
          className={`text-sm font-medium ${
            value === "Not provided" ? "text-slate-400 italic" : "text-slate-900"
          }`}
        >
          {value}
        </p>

        {action && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 transition hover:border-slate-300 shadow-sm">
      {children}
    </div>
  );
}
