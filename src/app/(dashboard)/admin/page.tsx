'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  Sliders,
  ClipboardList,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  RefreshCw,
  Lock,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import {
  getAdminStats,
  getSystemSettings,
  updateSystemSettings,
  adminGetUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getAuditLogs,
} from '@/lib/api';

type AdminTab = 'overview' | 'users' | 'settings' | 'audit';

const VALID_ROLES = [
  'Admin',
  'Senior Officer',
  'Investigator',
  'Officer',
  'Clerk',
  'Viewer',
];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'overview';

  // Authorization state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);

  // Current tab
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Stats state
  const [stats, setStats] = useState<any>(null);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Viewer',
    department: '',
    designation: '',
    officialEmail: '',
    officialPhone: '',
  });
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<any>({
    systemName: '',
    stationName: '',
    maintenanceMode: false,
    announcement: '',
    twoFactorPolicy: 'optional',
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    allowSelfRegistration: true,
    ocrAutoProcess: true,
    defaultCaseCategory: 'Theft',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('All');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // 1. Authenticate & Verify Admin Role
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        if (u?.role === 'Admin') {
          setIsAuthorizedAdmin(true);
        }
      }
    } catch {
      setIsAuthorizedAdmin(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab;
    if (tabParam && ['overview', 'users', 'settings', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load Overview Data
  const loadOverviewStats = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    try {
      const res = await getAdminStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  }, [isAuthorizedAdmin]);

  // Load Users Data
  const loadUsers = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await adminGetUsers({
        search: userSearch,
        role: userRoleFilter || undefined,
        limit: 50,
      });
      if (res?.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [isAuthorizedAdmin, userSearch, userRoleFilter]);

  // Load Settings Data
  const loadSettings = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    try {
      const res = await getSystemSettings();
      if (res?.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, [isAuthorizedAdmin]);

  // Load Audit Trail Data
  const loadAuditLogs = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    setLoadingAudit(true);
    try {
      const params: any = { limit: 100 };
      if (auditSearch.trim()) params.search = auditSearch.trim();
      if (auditSeverity !== 'All') params.severity = auditSeverity.toLowerCase();
      if (auditActionFilter !== 'All') params.action = auditActionFilter;

      const logs = await getAuditLogs(params);
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [isAuthorizedAdmin, auditSearch, auditSeverity, auditActionFilter]);

  // Trigger loads based on active tab
  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    if (activeTab === 'overview') {
      loadOverviewStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'settings') {
      loadSettings();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, isAuthorizedAdmin, loadOverviewStats, loadUsers, loadSettings, loadAuditLogs]);

  // ---------------- Handlers ----------------

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await updateSystemSettings(settings);
      if (res?.success) {
        setSettingsMsg({ type: 'success', text: 'System settings updated successfully.' });
        if (res.settings) setSettings(res.settings);
      } else {
        setSettingsMsg({ type: 'error', text: res?.error || 'Failed to update settings.' });
      }
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err?.message || 'Error updating settings.' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);
    try {
      const res = await adminCreateUser(userForm);
      if (res?.success) {
        setUserActionMsg({ type: 'success', text: `User ${userForm.fullName} provisioned successfully.` });
        setIsAddUserOpen(false);
        setUserForm({
          fullName: '',
          email: '',
          password: '',
          role: 'Viewer',
          department: '',
          designation: '',
          officialEmail: '',
          officialPhone: '',
        });
        loadUsers();
      } else {
        setUserActionMsg({ type: 'error', text: res?.error || 'Failed to create user.' });
      }
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err?.message || 'Failed to create user.' });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await adminUpdateUser(userId, { role: newRole });
      if (res?.success) {
        setUserActionMsg({ type: 'success', text: `Role updated to "${newRole}".` });
        loadUsers();
      } else {
        setUserActionMsg({ type: 'error', text: res?.error || 'Failed to update role.' });
      }
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err?.message || 'Error updating role.' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account "${userName}"? This action is logged.`)) {
      return;
    }
    try {
      const res = await adminDeleteUser(userId);
      if (res?.success) {
        setUserActionMsg({ type: 'success', text: `User "${userName}" deleted successfully.` });
        loadUsers();
      } else {
        setUserActionMsg({ type: 'error', text: res?.error || 'Failed to delete user.' });
      }
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err?.message || 'Error deleting user.' });
    }
  };

  const toggleDiffExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportAuditJson = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `janmitra-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------------- ACCESS DENIED (NON-ADMIN GUARD) ----------------
  if (authChecked && !isAuthorizedAdmin) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            403 - Administrator Clearance Required
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Access to the JANMITRA Admin Console and Audit Trail is strictly restricted to authenticated system administrators.
            Your role (<span className="font-semibold text-red-600">{currentUser?.role || 'Unverified'}</span>) does not hold the required clearance.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 font-mono">
            Security Rule: RBAC-ADMIN-STRICT (Violation Logged)
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span>Verifying Administrator Authorization...</span>
        </div>
      </div>
    );
  }

  // ---------------- AUTHORIZED ADMIN DASHBOARD ----------------
  return (
    <div className="space-y-6 pb-12">
      {/* PORTAL HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
              <span className="rounded bg-indigo-500/30 border border-indigo-400/40 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
                Authorized Admin
              </span>
            </div>
            <p className="mt-0.5 text-xs text-indigo-200/80">
              System governance, user administration, configuration policies, and immutable audit logs.
            </p>
          </div>
        </div>

        {/* ADMIN CLEARANCE PILL */}
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Logged as: <strong className="text-white">{currentUser?.fullName || currentUser?.email}</strong></span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: Layers },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'settings', label: 'System Settings', icon: Sliders },
          { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminTab);
                router.replace(`/admin?tab=${tab.id}`);
              }}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- TAB 1: OVERVIEW ---------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.users?.total ?? '—'}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {stats?.users?.byRole?.Admin ?? 0} Admins • {stats?.users?.byRole?.Officer ?? 0} Officers • {stats?.users?.byRole?.Investigator ?? 0} Investigators
              </p>
            </Card>

            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cases</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.cases?.total ?? '—'}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {stats?.cases?.active ?? 0} Active • {stats?.cases?.pending ?? 0} Pending • {stats?.cases?.closed ?? 0} Closed
              </p>
            </Card>

            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidentiary Docs</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.documents?.total ?? '—'}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Forensic files and automated OCR records
              </p>
            </Card>

            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Trail Events</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.audit?.totalLogs ?? '—'}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {stats?.audit?.adminActions ?? 0} Admin Operations • {stats?.audit?.securityAlerts ?? 0} Security Alerts
              </p>
            </Card>
          </div>

          {/* SYSTEM HEALTH & QUICK ACTIONS */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-900">System Status & Environment</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Station HQ</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">{stats?.system?.stationName || 'Central Cyber HQ'}</p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Maintenance Mode</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {stats?.system?.maintenanceMode ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">2FA Policy</span>
                  <p className="mt-1 text-xs font-bold capitalize text-slate-800">
                    {stats?.system?.twoFactorPolicy?.replace('_', ' ') || 'Optional'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Manage Users & Roles</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Modify System Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>Review Audit Trail</span>
                </button>
              </div>
            </Card>

            <Card className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-800">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold">Admin Governance Notice</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-indigo-950">
                Every action executed inside this portal—including role modifications, account deletions, and configuration changes—is cryptographically recorded in the Audit Trail with complete before/after state diffs.
              </p>
              <div className="mt-4 rounded-lg bg-white p-3 border border-indigo-200/60 text-[11px] text-slate-600">
                <p className="font-semibold text-slate-800">Security Invariant:</p>
                <p className="mt-0.5">Non-admin personnel cannot view this page, access the API endpoints, or view audit records.</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: USER MANAGEMENT ---------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* FEEDBACK ALERT */}
          {userActionMsg && (
            <div
              className={`flex items-center justify-between rounded-lg p-3.5 text-xs font-medium ${
                userActionMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{userActionMsg.text}</span>
              <button onClick={() => setUserActionMsg(null)} className="text-sm">×</button>
            </div>
          )}

          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, department..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setTimeout(() => loadUsers(), 50);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
              >
                <option value="">All Roles</option>
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <button
                onClick={() => loadUsers()}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh user list"
              >
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Provision User</span>
            </button>
          </div>

          {/* ADD USER MODAL */}
          <AnimatePresence>
            {isAddUserOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">Provision New User</h3>
                    <button
                      onClick={() => setIsAddUserOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={userForm.fullName}
                        onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        placeholder="Officer Rajesh Kumar"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="r.kumar@police.gov.in"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
                        <input
                          type="password"
                          required
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Assigned Role *</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          {VALID_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Department</label>
                        <input
                          type="text"
                          value={userForm.department}
                          onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="Cyber Forensics Unit"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Designation</label>
                        <input
                          type="text"
                          value={userForm.designation}
                          onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="Senior Inspector"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Official Phone</label>
                        <input
                          type="text"
                          value={userForm.officialPhone}
                          onChange={(e) => setUserForm({ ...userForm, officialPhone: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddUserOpen(false)}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                      >
                        Create User
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* USERS TABLE */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Officer / User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingUsers && users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                        <span className="mt-2 block">Loading users...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = String(u.id || u._id) === String(currentUser?.id || currentUser?._id);

                      return (
                        <tr key={u.id || u._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3 font-medium text-slate-800">
                            <div>
                              <p className="font-semibold text-slate-900">{u.fullName}</p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleUpdateUserRole(u.id || u._id, e.target.value)}
                              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                u.role === 'Admin'
                                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                  : u.role === 'Senior Officer'
                                  ? 'border-purple-200 bg-purple-50 text-purple-700'
                                  : u.role === 'Investigator'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              } focus:outline-none focus:border-indigo-500 disabled:opacity-50`}
                            >
                              {VALID_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            {isSelf && (
                              <span className="ml-1 text-[10px] text-slate-400 italic">(You)</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {u.department || '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {u.designation || '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id || u._id, u.fullName)}
                              disabled={isSelf}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-30"
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: SYSTEM SETTINGS ---------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* FEEDBACK ALERT */}
          {settingsMsg && (
            <div
              className={`flex items-center justify-between rounded-lg p-4 text-xs font-semibold ${
                settingsMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{settingsMsg.text}</span>
              <button onClick={() => setSettingsMsg(null)} className="text-sm">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* GENERAL SYSTEM CONFIGURATION */}
            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold">General System Configuration</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Application Title</label>
                <input
                  type="text"
                  value={settings.systemName || ''}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="JANMITRA - Legal Investigation System"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Jurisdiction / Station Headquarters</label>
                <input
                  type="text"
                  value={settings.stationName || ''}
                  onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="Central Cyber & Forensic Jurisdiction HQ"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Global Announcement Banner</label>
                <textarea
                  rows={2}
                  value={settings.announcement || ''}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="Optional notice displayed to officers upon system sign-in..."
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">System Maintenance Mode</span>
                    <p className="text-[11px] text-slate-500">Temporarily restrict new case creation while maintaining read-only audit access</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode || false}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </Card>

            {/* SECURITY & OPERATIONAL POLICIES */}
            <Card className="rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                <Lock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold">Security & Operational Policies</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Two-Factor Authentication Policy</label>
                <select
                  value={settings.twoFactorPolicy || 'optional'}
                  onChange={(e) => setSettings({ ...settings, twoFactorPolicy: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="optional">Optional (Recommended for all)</option>
                  <option value="officers_required">Mandatory for Investigating Officers & Admins</option>
                  <option value="all_required">Strict Mandatory for All Personnel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.sessionTimeoutMinutes || 60}
                    onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Max Login Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.maxLoginAttempts || 5}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Default Crime / Case Category</label>
                <select
                  value={settings.defaultCaseCategory || 'Theft'}
                  onChange={(e) => setSettings({ ...settings, defaultCaseCategory: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Theft">Theft</option>
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Fraud">Fraud</option>
                  <option value="Assault">Assault</option>
                  <option value="Property Dispute">Property Dispute</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Auto-Run Optical Character Recognition (OCR)</span>
                    <p className="text-[11px] text-slate-500">Automatically extract text from newly uploaded evidentiary documents</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ocrAutoProcess ?? true}
                    onChange={(e) => setSettings({ ...settings, ocrAutoProcess: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </Card>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadSettings()}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Reset to Current
            </button>
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              {settingsSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Recording Changes to Audit Trail...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save & Record Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TAB 4: COMPLETE AUDIT TRAIL ---------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* SEARCH */}
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, action, target, text..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* SEVERITY */}
              <select
                value={auditSeverity}
                onChange={(e) => {
                  setAuditSeverity(e.target.value);
                  setTimeout(() => loadAuditLogs(), 50);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
              >
                <option value="All">All Severity</option>
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>

              {/* ACTION TYPE */}
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setTimeout(() => loadAuditLogs(), 50);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
              >
                <option value="All">All Action Types</option>
                <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
                <option value="SYSTEM_SETTINGS_UPDATED">SYSTEM_SETTINGS_UPDATED</option>
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="USER_DELETED">USER_DELETED</option>
                <option value="USER_UPDATED">USER_UPDATED</option>
              </select>

              <button
                onClick={() => loadAuditLogs()}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh audit trail"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAudit ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* EXPORT BUTTON */}
            <button
              onClick={handleExportAuditJson}
              disabled={auditLogs.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition shadow-xs"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export Audit Trail (JSON)</span>
            </button>
          </div>

          {/* AUDIT RECORDS TABLE */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3 text-right">Details & Diffs</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingAudit && auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                        <span className="mt-2 block">Loading immutable audit logs...</span>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No audit events match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => {
                      const logId = log.id || log._id || `${log.time}-${log.text}`;
                      const hasChanges =
                        log.changes &&
                        (log.changes.before !== undefined || log.changes.after !== undefined);
                      const isExpanded = expandedLogIds.has(logId);

                      const date = log.time ? new Date(log.time) : new Date();

                      return (
                        <tr key={logId} className="hover:bg-slate-50/70 transition flex-col">
                          <td colSpan={6} className="p-0">
                            <div className="flex items-center px-4 py-3">
                              {/* TIMESTAMP */}
                              <div className="w-[150px] shrink-0">
                                <p className="font-semibold text-slate-800">
                                  {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              </div>

                              {/* ACTOR */}
                              <div className="w-[180px] shrink-0 px-2">
                                <p className="font-semibold text-slate-900 truncate">{log.accessedBy || 'System'}</p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {log.userRole && <span className="font-medium text-slate-600">[{log.userRole}] </span>}
                                  {log.userEmail || log.ipAddress || ''}
                                </p>
                              </div>

                              {/* ACTION */}
                              <div className="w-[180px] shrink-0 px-2">
                                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  log.action === 'USER_ROLE_UPDATED' || log.action === 'USER_DELETED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : log.action === 'SYSTEM_SETTINGS_UPDATED'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : log.action === 'USER_CREATED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : log.status === 'failed'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {log.action || log.type?.toUpperCase() || 'EVENT'}
                                </span>
                              </div>

                              {/* TARGET */}
                              <div className="flex-1 px-2 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {log.target || log.caseId || 'System Entity'}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">{log.text}</p>
                              </div>

                              {/* SEVERITY */}
                              <div className="w-[90px] shrink-0 px-2">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  log.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : log.severity === 'warning'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {log.severity || 'info'}
                                </span>
                              </div>

                              {/* ACTIONS & DIFF TOGGLE */}
                              <div className="w-[120px] shrink-0 text-right pr-2">
                                {hasChanges ? (
                                  <button
                                    onClick={() => toggleDiffExpand(logId)}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                  >
                                    <span>{isExpanded ? 'Hide Diff' : 'View Diff'}</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">No diff</span>
                                )}
                              </div>
                            </div>

                            {/* EXPANDABLE BEFORE / AFTER DIFF PANEL */}
                            {hasChanges && isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-slate-100 bg-slate-50/80 px-6 py-3.5"
                              >
                                <div className="text-[11px] font-bold text-slate-700 mb-2">
                                  State Change Diff (Before vs. After):
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {/* BEFORE */}
                                  <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
                                    <div className="flex items-center gap-1.5 text-red-700 font-semibold text-[11px] mb-1.5">
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                      <span>Before Changes:</span>
                                    </div>
                                    <pre className="font-mono text-[11px] text-red-950 overflow-x-auto whitespace-pre-wrap bg-white/70 p-2 rounded border border-red-100">
                                      {JSON.stringify(log.changes.before || {}, null, 2)}
                                    </pre>
                                  </div>

                                  {/* AFTER */}
                                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] mb-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      <span>After Changes:</span>
                                    </div>
                                    <pre className="font-mono text-[11px] text-emerald-950 overflow-x-auto whitespace-pre-wrap bg-white/70 p-2 rounded border border-emerald-100">
                                      {JSON.stringify(log.changes.after || {}, null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                {log.ipAddress && (
                                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                    Captured Client IP: {log.ipAddress} • User-Agent: {log.browser} ({log.operatingSystem})
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
