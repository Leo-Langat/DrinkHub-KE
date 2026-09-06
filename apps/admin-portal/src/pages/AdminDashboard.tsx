import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeToggle } from '@drinkhub/ui';
import {
  LayoutDashboard, Building2, Users, CreditCard, TrendingUp, Settings,
  Bell, LogOut, ChevronDown, ArrowUpRight, ArrowDownRight, Server,
  ShieldCheck, AlertCircle, Activity, Database, Zap, Search,
  Plus, Download, Eye, EyeOff, Trash2, Edit2, CheckCircle2, X,
  Key, RefreshCcw, HardDrive, Cpu, Wifi, Upload, ClipboardList,
  ChevronLeft, Check, UserCog, Mail, Phone, MapPin,
  RotateCcw, UserX, UserCheck, Calendar, Lock, ShieldAlert,
  UtensilsCrossed, Store, Coffee, Hotel, Filter, SlidersHorizontal,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
} from 'recharts';

/* ─── Types ─── */
export type BusinessType = 'RESTAURANT' | 'CLUB' | 'BAR' | 'LOUNGE' | 'CAFE' | 'FAST_FOOD' | 'HOTEL' | 'FOOD_COURT' | 'OTHER';
export type BusinessStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE' | 'CANCELLED';

export interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  description: string;
  address: string;
  city: string;
  county: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  plan: string;
  status: string;
  isActive: boolean;
  mrr: number;
  orders: number;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  createdAt: string;
  trialDays: number;
  startDate: string;
  expiryDate: string;
}

export interface BusinessAdmin {
  id: string;
  userUuid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessUuid: string;
  businessName: string;
  businessType: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface PlatformUser {
  id: string;
  userUuid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  businessUuid?: string;
  businessName?: string;
  businessType?: string;
  isActive: boolean;
  isOnline: boolean;
  onlineStatus: string;
  lastLogin: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  role: string;
  resource: string;
  businessName?: string;
  ip: string;
  time: string;
  level: string;
}

export interface PlatformStatsData {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  totalAdmins: number;
  totalManagers: number;
  totalWaiters: number;
  totalOrders: number;
  totalRevenue: number;
  businessesByType: Record<string, number>;
  recentBusinesses: Array<{
    businessUuid: string;
    name: string;
    slug: string;
    businessType: BusinessType;
    status: string;
    city: string;
    county: string;
    createdAt: string;
    admin?: {
      fullName: string;
      email: string;
      phone?: string | null;
    } | null;
  }>;
}

/* ─── Utilities ─── */
const csvExport = (headers: string[], rows: (string | number | boolean)[][], filename: string) => {
  const e = (v: string | number | boolean) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const content = [headers.map(e).join(','), ...rows.map(r => r.map(e).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.includes('/api/v1')) base = `${base}/api/v1`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('drinkhub_token') || localStorage.getItem('drinkhub_admin_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const generatePassword = (): string => {
  const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', l = 'abcdefghjkmnpqrstuvwxyz', d = '23456789', s = '@#$!';
  const all = u + l + d + s;
  const pwd = [u, l, d, s].map(c => c[Math.floor(Math.random() * c.length)]);
  for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join('');
};

const readFile = (e: React.ChangeEvent<HTMLInputElement>, cb: (url: string) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 1. Instant local preview
  const reader = new FileReader();
  reader.onload = ev => {
    if (ev.target?.result) cb(ev.target.result as string);
  };
  reader.readAsDataURL(file);

  // 2. Upload to server in background for static persistent asset URL
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('drinkhub_token') || localStorage.getItem('drinkhub_admin_token');
  fetch(getApiUrl('/tenants/upload'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && (data.data?.imageUrl || data.data?.url)) {
        cb(data.data.imageUrl || data.data.url);
      }
    })
    .catch(() => {
      // Keep existing base64 preview on network failure
    });
};

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: 'Restaurant',
  CLUB: 'Club / Nightclub',
  BAR: 'Bar',
  LOUNGE: 'Lounge',
  CAFE: 'Café',
  FAST_FOOD: 'Fast Food',
  HOTEL: 'Hotel',
  FOOD_COURT: 'Food Court',
  OTHER: 'Other Hospitality',
};

const BUSINESS_TYPE_ICONS: Record<BusinessType, React.ReactNode> = {
  RESTAURANT: <UtensilsCrossed className="h-3.5 w-3.5" />,
  CLUB: <Activity className="h-3.5 w-3.5" />,
  BAR: <Zap className="h-3.5 w-3.5" />,
  LOUNGE: <Coffee className="h-3.5 w-3.5" />,
  CAFE: <Coffee className="h-3.5 w-3.5" />,
  FAST_FOOD: <Store className="h-3.5 w-3.5" />,
  HOTEL: <Hotel className="h-3.5 w-3.5" />,
  FOOD_COURT: <Store className="h-3.5 w-3.5" />,
  OTHER: <Building2 className="h-3.5 w-3.5" />,
};

/* ─── Toast ─── */
const Toast = ({ msg, type = 'success', onDone }: { msg: string; type?: 'success' | 'error'; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3"
      style={{ background: type === 'success' ? '#0F172A' : '#7F1D1D', border: '1px solid rgba(255,255,255,0.1)', minWidth: 280 }}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
      )}
      <span>{msg}</span>
    </div>
  );
};

/* ─── Modal ─── */
const Modal = ({ open, onClose, title, size = 'md', children }: { open: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg' | 'xl'; children: React.ReactNode }) => {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const w = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className={`w-full ${w} rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800`} onClick={ev => ev.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Confirmation Modal ─── */
const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white transition disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
            }`}
          >
            {loading && <RefreshCcw className="h-3 w-3 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Form Primitives ─── */
const FL = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);
const FE = ({ msg }: { msg?: string }) => msg ? <p className="text-xs text-red-500 mt-1 font-medium">{msg}</p> : null;
const FG = ({ children, span = 1 }: { children: React.ReactNode; span?: 1 | 2 }) => (
  <div className={span === 2 ? 'col-span-2' : ''}>{children}</div>
);

const SI = ({ error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
  <div>
    <input
      {...p}
      className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition text-slate-900 dark:text-white dark:bg-slate-800 ${
        error
          ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-300'
          : 'border-slate-200 dark:border-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      }`}
    />
    <FE msg={error} />
  </div>
);

const STA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
  />
);

const SS = ({ options, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) => (
  <select
    {...p}
    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
  >
    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
);

const PhoneInput = ({ error, value, onChange }: { error?: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 select-none">
        +254
      </span>
      <input
        type="tel"
        value={value}
        onChange={e => onChange(e.target.value.replace(/^\+?254/, '').replace(/^0/, ''))}
        placeholder="7XX XXX XXX"
        className={`flex-1 rounded-r-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-white dark:bg-slate-800 outline-none transition ${
          error
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-300'
            : 'border-slate-200 dark:border-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }`}
      />
    </div>
    <FE msg={error} />
  </div>
);

/* ─── Badges ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    Trial: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    TRIAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    Inactive: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    INACTIVE: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    Suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    Pro: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    Standard: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    Starter: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    INFO: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    WARN: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    ERROR: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    Degraded: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border inline-flex items-center gap-1 ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

const BusinessTypeBadge = ({ type }: { type: BusinessType | string }) => {
  const t = (type || 'RESTAURANT').toUpperCase() as BusinessType;
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {BUSINESS_TYPE_ICONS[t] || <Building2 className="h-3 w-3" />}
      {BUSINESS_TYPE_LABELS[t] || t}
    </span>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    SUPER_ADMIN: { cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300', label: 'Super Admin' },
    ADMIN: { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300', label: 'Business Admin' },
    MANAGER: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300', label: 'Manager' },
    WAITER: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300', label: 'Waiter' },
    CUSTOMER: { cls: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300', label: 'Customer' },
  };
  const c = map[role] || { cls: 'bg-slate-50 text-slate-600 border-slate-200', label: role };
  return <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${c.cls}`}>{c.label}</span>;
};

const KPI = ({ label, value, change, positive, icon, sub }: { label: string; value: string | number; change?: string; positive?: boolean; icon: React.ReactNode; sub?: string }) => (
  <div className="rounded-xl border p-5 transition hover:shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
    <div className="flex items-start justify-between mb-3">
      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-body)' }}>{icon}</div>
      {change ? (
        <div className={`flex items-center gap-0.5 text-xs font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{change}
        </div>
      ) : sub ? (
        <span className="text-[11px] font-semibold text-slate-400">{sub}</span>
      ) : null}
    </div>
    <div className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</div>
    <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
  </div>
);

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const UploadBox = ({ label, preview, onUpload }: { label: string; preview: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <label className="block cursor-pointer">
    <div className={`relative rounded-xl border-2 border-dashed transition-all hover:border-blue-400 overflow-hidden ${preview ? 'border-blue-300' : 'border-slate-200 dark:border-slate-700'}`} style={{ height: preview ? 110 : 75 }}>
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1 text-slate-400">
          <Upload className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
      )}
      {preview && (
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-white text-xs font-bold">Change</span>
        </div>
      )}
    </div>
    <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
  </label>
);

const ThemePreview = ({ color, businessName, businessType }: { color: string; businessName: string; businessType?: string }) => (
  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-white text-center shadow-sm" style={{ background: color || '#1D4ED8' }}>
    <div className="px-4 py-4">
      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1.5">
        <Store className="h-4 w-4 text-white" />
      </div>
      <div className="font-black text-xs truncate">{businessName || 'Business Name'}</div>
      <div className="text-[10px] opacity-75 mt-0.5">{businessType || 'Hospitality Venue'}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════
   CREATE BUSINESS STEPPER (Unified Provisioning)
══════════════════════════════════════ */
const STEPS = [
  { n: 1, label: 'Business Information', icon: <Building2 className="h-4 w-4" /> },
  { n: 2, label: 'Admin Account', icon: <UserCog className="h-4 w-4" /> },
  { n: 3, label: 'Subscription', icon: <CreditCard className="h-4 w-4" /> },
];

const StepProgress = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center mb-8">
    {STEPS.map((s, i) => {
      const done = s.n < current;
      const active = s.n === current;
      return (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
              {done ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-all ${done ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

type BusinessFormState = {
  name: string;
  businessType: BusinessType;
  description: string;
  address: string;
  city: string;
  county: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  tempPwd: string;
  plan: string;
  trialDays: string;
  subStatus: string;
  startDate: string;
  expiryDate: string;
};

const defaultBusinessForm: BusinessFormState = {
  name: '',
  businessType: 'RESTAURANT',
  description: '',
  address: '',
  city: 'Nairobi',
  county: 'Nairobi',
  phone: '',
  email: '',
  openingTime: '08:00',
  closingTime: '23:00',
  logoUrl: '',
  bannerUrl: '',
  themeColor: '#2563EB',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
  tempPwd: '',
  plan: 'Pro',
  trialDays: '14',
  subStatus: 'Trial',
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
};

/* Step 1 */
const Step1 = ({ f, set, errors }: { f: BusinessFormState; set: (k: keyof BusinessFormState, v: any) => void; errors: Partial<Record<keyof BusinessFormState, string>> }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1">
        <FL required>Business Name</FL>
        <SI value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Java House Westlands" error={errors.name} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <FL required>Business Type</FL>
        <SS
          value={f.businessType}
          onChange={e => set('businessType', e.target.value as BusinessType)}
          options={Object.entries(BUSINESS_TYPE_LABELS).map(([k, l]) => ({ v: k, l }))}
        />
      </div>
      <div className="col-span-2">
        <FL>Description</FL>
        <STA value={f.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of the establishment…" />
      </div>
      <div>
        <FL>Physical Address / Location</FL>
        <SI value={f.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Mpaka Road, Westlands" />
      </div>
      <div>
        <FL>City / Town</FL>
        <SI value={f.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Nairobi" />
      </div>
      <div>
        <FL>County</FL>
        <SS value={f.county} onChange={e => set('county', e.target.value)} options={['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Kajiado', 'Kilifi'].map(c => ({ v: c, l: c }))} />
      </div>
      <div>
        <FL>Business Phone</FL>
        <PhoneInput value={f.phone} onChange={v => set('phone', v)} />
      </div>
      <div className="col-span-2">
        <FL>Contact Email</FL>
        <SI value={f.email} onChange={e => set('email', e.target.value)} placeholder="info@business.co.ke" type="email" />
      </div>
      <div>
        <FL>Opening Hours</FL>
        <SI type="time" value={f.openingTime} onChange={e => set('openingTime', e.target.value)} />
      </div>
      <div>
        <FL>Closing Hours</FL>
        <SI type="time" value={f.closingTime} onChange={e => set('closingTime', e.target.value)} />
      </div>
    </div>

    <div className="border-t pt-5 border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Branding & Visuals</h4>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FL>Logo</FL>
          <UploadBox label="Logo" preview={f.logoUrl} onUpload={e => readFile(e, v => set('logoUrl', v))} />
        </div>
        <div className="col-span-2">
          <FL>Banner</FL>
          <UploadBox label="Cover Banner" preview={f.bannerUrl} onUpload={e => readFile(e, v => set('bannerUrl', v))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <FL>Brand Accent Color</FL>
          <div className="flex items-center gap-2">
            <input type="color" value={f.themeColor} onChange={e => set('themeColor', e.target.value)} className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white" />
            <input type="text" value={f.themeColor} onChange={e => set('themeColor', e.target.value)} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-mono dark:bg-slate-800" />
          </div>
        </div>
        <div>
          <FL>Preview</FL>
          <ThemePreview color={f.themeColor} businessName={f.name} businessType={BUSINESS_TYPE_LABELS[f.businessType]} />
        </div>
      </div>
    </div>
  </div>
);

/* Step 2 */
const Step2 = ({ f, set, errors }: { f: BusinessFormState; set: (k: keyof BusinessFormState, v: any) => void; errors: Partial<Record<keyof BusinessFormState, string>> }) => {
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 flex gap-3">
        <Lock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          The <strong>Business Admin</strong> will have full management control over this business, menus, tables, and staff. They will be required to change their temporary password upon first sign in.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FL required>Admin First Name</FL>
          <SI value={f.adminFirstName} onChange={e => set('adminFirstName', e.target.value)} placeholder="e.g. John" error={errors.adminFirstName} />
        </div>
        <div>
          <FL required>Admin Last Name</FL>
          <SI value={f.adminLastName} onChange={e => set('adminLastName', e.target.value)} placeholder="e.g. Ochieng" error={errors.adminLastName} />
        </div>
        <div className="col-span-2">
          <FL required>Admin Email Address</FL>
          <SI type="email" value={f.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@business.co.ke" error={errors.adminEmail} />
        </div>
        <div className="col-span-2">
          <FL required>Admin Phone Number</FL>
          <PhoneInput value={f.adminPhone} onChange={v => set('adminPhone', v)} />
        </div>
        <div className="col-span-2">
          <FL required>Temporary Password</FL>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SI
                type={showPwd ? 'text' : 'password'}
                value={f.tempPwd}
                onChange={e => set('tempPwd', e.target.value)}
                placeholder="Min. 8 characters"
                error={errors.tempPwd}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => set('tempPwd', generatePassword())}
              className="flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Step 3 */
const Step3 = ({ f, set }: { f: BusinessFormState; set: (k: keyof BusinessFormState, v: any) => void }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FL>Subscription Plan</FL>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[
            { v: 'Starter', price: 'KES 3,900 / mo', features: ['Up to 6 staff accounts', 'Up to 1,000 orders/mo', 'QR table ordering', 'Email support'] },
            { v: 'Pro', price: 'KES 8,900 / mo', features: ['Unlimited staff & waiters', 'Unlimited orders', 'Real-time kitchen/bar display', 'Advanced analytics & export'] },
          ].map(p => (
            <button
              key={p.v}
              type="button"
              onClick={() => set('plan', p.v)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                f.plan === p.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-slate-900 dark:text-white text-sm">{p.v}</span>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${f.plan === p.v ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                  {f.plan === p.v && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">{p.price}</div>
              <ul className="space-y-0.5">
                {p.features.map(feat => (
                  <li key={feat} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-500" /> {feat}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
      <div>
        <FL>Account Initial Status</FL>
        <SS
          value={f.subStatus}
          onChange={e => set('subStatus', e.target.value)}
          options={[{ v: 'Trial', l: 'Trial' }, { v: 'Active', l: 'Active' }]}
        />
      </div>
      <div>
        <FL>Trial Duration (Days)</FL>
        <SI type="number" value={f.trialDays} onChange={e => set('trialDays', e.target.value)} min="0" max="90" />
      </div>
    </div>
    <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
        ✓ Upon completion, the business and initial Admin account will be created atomically and linked.
      </p>
    </div>
  </div>
);

/* Create Business Stepper Wrapper */
const CreateBusinessStepper = ({ onSuccess, onCancel }: { onSuccess: (b: Business, a: BusinessAdmin) => void; onCancel: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BusinessFormState>({ ...defaultBusinessForm, tempPwd: generatePassword() });
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFormState, string>>>({});

  const set = (k: keyof BusinessFormState, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate1 = () => {
    const e: Partial<Record<keyof BusinessFormState, string>> = {};
    if (!form.name.trim()) e.name = 'Business name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Partial<Record<keyof BusinessFormState, string>> = {};
    if (!form.adminFirstName.trim()) e.adminFirstName = 'First name required';
    if (!form.adminLastName.trim()) e.adminLastName = 'Last name required';
    if (!form.adminEmail.trim()) e.adminEmail = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.adminEmail)) e.adminEmail = 'Invalid email address';
    if (!form.adminPhone.trim()) e.adminPhone = 'Phone required';
    if (form.tempPwd.length < 8) e.tempPwd = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step === 3) {
      setLoading(true);
      try {
        const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `biz-${Date.now()}`;
        const adminFullName = `${form.adminFirstName} ${form.adminLastName}`.trim();

        const payload = {
          name: form.name.trim(),
          slug,
          businessType: form.businessType,
          description: form.description.trim(),
          city: form.city.trim(),
          county: form.county.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          openingHours: form.openingTime,
          closingHours: form.closingTime,
          brandColor: form.themeColor,
          logoUrl: form.logoUrl || null,
          bannerUrl: form.bannerUrl || null,
          adminFullName,
          adminEmail: form.adminEmail.trim().toLowerCase(),
          adminPhone: form.adminPhone.trim(),
          adminPassword: form.tempPwd,
          // Compatibility aliases
          managerFullName: adminFullName,
          managerEmail: form.adminEmail.trim().toLowerCase(),
          managerPhone: form.adminPhone.trim(),
          managerPassword: form.tempPwd,
        };

        const res = await fetch(getApiUrl('/tenants/provision'), {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || data.message || 'Failed to provision business');
        }

        const bData = data.data?.business || data.data?.club || {};
        const aData = data.data?.admin || data.data?.manager || {};

        const newBusiness: Business = {
          id: bData.businessUuid || bData.clubUuid || bData.uuid || `b-${Date.now()}`,
          name: bData.name || form.name,
          slug: bData.slug || slug,
          businessType: bData.businessType || form.businessType,
          description: form.description,
          address: form.address,
          city: form.city,
          county: bData.county || form.county,
          phone: form.phone,
          email: form.email,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          logoUrl: form.logoUrl,
          bannerUrl: form.bannerUrl,
          themeColor: bData.themeColor || bData.brandColor || form.themeColor,
          plan: form.plan,
          status: 'Active',
          isActive: true,
          mrr: form.plan === 'Pro' ? 8900 : 3900,
          orders: 0,
          adminId: aData.userUuid || aData.uuid || '',
          adminName: adminFullName,
          adminEmail: form.adminEmail,
          createdAt: new Date().toISOString().split('T')[0],
          trialDays: parseInt(form.trialDays, 10) || 14,
          startDate: form.startDate,
          expiryDate: form.expiryDate,
        };

        const newAdmin: BusinessAdmin = {
          id: aData.userUuid || aData.uuid || `a-${Date.now()}`,
          userUuid: aData.userUuid || aData.uuid || `a-${Date.now()}`,
          fullName: adminFullName,
          firstName: form.adminFirstName,
          lastName: form.adminLastName,
          email: form.adminEmail,
          phone: form.adminPhone,
          businessUuid: newBusiness.id,
          businessName: newBusiness.name,
          businessType: newBusiness.businessType,
          role: 'ADMIN',
          status: 'Active',
          isActive: true,
          lastLogin: 'Never',
          createdAt: new Date().toISOString().split('T')[0],
        };

        onSuccess(newBusiness, newAdmin);
      } catch (err: any) {
        alert(err.message || 'Error creating business.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Businesses
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Register New Business</h2>
        <p className="text-sm mt-1 text-slate-500">Provision a new multi-tenant business and create its initial Business Admin.</p>
      </div>

      <StepProgress current={step} />

      <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white">{STEPS[step - 1].label}</h3>
          <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
        </div>

        {step === 1 && <Step1 f={form} set={set} errors={errors} />}
        {step === 2 && <Step2 f={form} set={set} errors={errors} />}
        {step === 3 && <Step3 f={form} set={set} />}

        <div className="flex items-center justify-between mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onCancel} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: '#2563EB' }}
            >
              {loading ? (
                <><RefreshCcw className="h-4 w-4 animate-spin" /> Provisioning…</>
              ) : step === 3 ? (
                <><Check className="h-4 w-4" /> Complete Registration</>
              ) : (
                <>Next Step <ChevronDown className="h-4 w-4 -rotate-90" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   EDIT BUSINESS MODAL
══════════════════════════════════════ */
const EditBusinessModal = ({
  business,
  open,
  onClose,
  onSaved,
  showToast,
}: {
  business: Business | null;
  open: boolean;
  onClose: () => void;
  onSaved: (b: Business) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    businessType: 'RESTAURANT' as BusinessType,
    description: '',
    address: '',
    city: 'Nairobi',
    county: 'Nairobi',
    phone: '',
    email: '',
    openingTime: '08:00',
    closingTime: '23:00',
    themeColor: '#2563EB',
    logoUrl: '',
    bannerUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        businessType: business.businessType || 'RESTAURANT',
        description: business.description || '',
        address: business.address || '',
        city: business.city || 'Nairobi',
        county: business.county || 'Nairobi',
        phone: business.phone || '',
        email: business.email || '',
        openingTime: business.openingTime || '08:00',
        closingTime: business.closingTime || '23:00',
        themeColor: business.themeColor || '#2563EB',
        logoUrl: business.logoUrl || '',
        bannerUrl: business.bannerUrl || '',
      });
    }
  }, [business]);

  if (!business) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(getApiUrl(`/tenants/${business.id}`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          businessType: form.businessType,
          address: form.address.trim(),
          city: form.city.trim(),
          county: form.county.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          openingHours: form.openingTime,
          closingHours: form.closingTime,
          brandColor: form.themeColor,
          logoUrl: form.logoUrl.trim() || null,
          bannerUrl: form.bannerUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to update business');
      }

      const updated: Business = {
        ...business,
        name: form.name.trim(),
        businessType: form.businessType,
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        county: form.county.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        themeColor: form.themeColor,
        logoUrl: form.logoUrl.trim(),
        bannerUrl: form.bannerUrl.trim(),
      };

      onSaved(updated);
      showToast('Business details updated successfully');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update business', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Business: ${business.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FG span={2}>
            <FL required>Business Name</FL>
            <SI required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </FG>
          <FG>
            <FL required>Business Type</FL>
            <SS
              value={form.businessType}
              onChange={e => setForm(p => ({ ...p, businessType: e.target.value as BusinessType }))}
              options={Object.entries(BUSINESS_TYPE_LABELS).map(([k, l]) => ({ v: k, l }))}
            />
          </FG>
          <FG>
            <FL>County</FL>
            <SS
              value={form.county}
              onChange={e => setForm(p => ({ ...p, county: e.target.value }))}
              options={['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Kajiado', 'Kilifi'].map(c => ({ v: c, l: c }))}
            />
          </FG>
          <FG>
            <FL>Address / Street</FL>
            <SI value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </FG>
          <FG>
            <FL>City</FL>
            <SI value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          </FG>
          <FG>
            <FL>Phone</FL>
            <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          </FG>
          <FG>
            <FL>Email</FL>
            <SI type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </FG>
          <FG>
            <FL>Opening Hours</FL>
            <SI type="time" value={form.openingTime} onChange={e => setForm(p => ({ ...p, openingTime: e.target.value }))} />
          </FG>
          <FG>
            <FL>Closing Hours</FL>
            <SI type="time" value={form.closingTime} onChange={e => setForm(p => ({ ...p, closingTime: e.target.value }))} />
          </FG>
        </div>

        <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Branding</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FL>Logo</FL>
              <UploadBox label="Logo" preview={form.logoUrl} onUpload={e => readFile(e, v => setForm(p => ({ ...p, logoUrl: v })))} />
            </div>
            <div className="col-span-2">
              <FL>Banner</FL>
              <UploadBox label="Banner" preview={form.bannerUrl} onUpload={e => readFile(e, v => setForm(p => ({ ...p, bannerUrl: v })))} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50">
            {saving ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ══════════════════════════════════════
   BUSINESS DETAILS VIEW
══════════════════════════════════════ */
const BusinessDetailsView = ({
  business,
  admins,
  onBack,
  onUpdateBusiness,
  onToggleStatus,
  showToast,
}: {
  business: Business;
  admins: BusinessAdmin[];
  onBack: () => void;
  onUpdateBusiness: (b: Business) => void;
  onToggleStatus: (b: Business) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [showEdit, setShowEdit] = useState(false);
  const admin = admins.find(a => a.businessUuid === business.id || a.id === business.adminId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Businesses
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 transition shadow-sm"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit Business
          </button>
          <button
            onClick={() => onToggleStatus(business)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition ${
              business.status === 'Active' || business.status === 'ACTIVE'
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            }`}
          >
            {business.status === 'Active' || business.status === 'ACTIVE' ? (
              <><ShieldAlert className="h-3.5 w-3.5" /> Suspend Business</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Activate Business</>
            )}
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden h-36" style={{ background: business.themeColor || '#2563EB' }}>
        {business.bannerUrl && <img src={business.bannerUrl} alt="banner" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-end p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 overflow-hidden">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-7 w-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{business.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <BusinessTypeBadge type={business.businessType} />
                <StatusBadge status={business.status} />
                <span className="text-white/80 text-xs">{business.city}, {business.county}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Admin Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Business Profile</h3>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { k: 'Business Slug', v: business.slug },
                { k: 'Business Type', v: BUSINESS_TYPE_LABELS[business.businessType] || business.businessType },
                { k: 'Address', v: `${business.address || '—'}, ${business.city}` },
                { k: 'County', v: business.county || 'Nairobi' },
                { k: 'Phone', v: business.phone || '—' },
                { k: 'Email', v: business.email || '—' },
                { k: 'Operating Hours', v: `${business.openingTime} – ${business.closingTime}` },
                { k: 'Registered On', v: business.createdAt },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{k}</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Business Admin */}
          <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Primary Business Admin</h3>
            {admin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center">
                    {admin.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{admin.fullName}</div>
                    <div className="text-xs text-slate-400">{admin.email}</div>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={admin.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div><span className="text-slate-400 font-bold block">Phone</span><span className="font-semibold text-slate-700 dark:text-slate-300">{admin.phone || '—'}</span></div>
                  <div><span className="text-slate-400 font-bold block">Last Login</span><span className="font-semibold text-slate-700 dark:text-slate-300">{admin.lastLogin}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No primary admin assigned yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: High-Level Activity */}
        <div className="space-y-5">
          <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">Live Metrics</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Total Orders', val: business.orders },
                { label: 'Estimated MRR', val: `KES ${business.mrr.toLocaleString()}` },
                { label: 'Subscription Plan', val: <StatusBadge status={business.plan} /> },
                { label: 'Account Status', val: <StatusBadge status={business.status} /> },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">{s.label}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EditBusinessModal
        business={business}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={onUpdateBusiness}
        showToast={showToast}
      />
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 1: DASHBOARD OVERVIEW
══════════════════════════════════════ */
const DashboardOverviewPage = ({
  stats,
  loading,
  onNavigate,
  showToast,
}: {
  stats: PlatformStatsData | null;
  loading: boolean;
  onNavigate: (key: NavKey) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(getApiUrl('/reports/analytics?period=WEEKLY&businessUuid=ALL'), { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.data);
        }
      } catch {
        /* ignore */
      }
    };
    fetchAnalytics();
  }, []);

  const weeklyData = analytics?.dailyRevenue?.map((d: any) => ({
    day: d.day,
    revenue: Number(d.revenue || 0),
    orders: d.revenue > 0 ? Math.max(1, Math.round(d.revenue / 2500)) : 0,
  })) || [];

  const typeData = useMemo(() => {
    if (!stats?.businessesByType) return [];
    return Object.entries(stats.businessesByType).map(([k, count]) => ({
      name: BUSINESS_TYPE_LABELS[k as BusinessType] || k,
      count,
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Super Admin Dashboard"
        subtitle="Platform-wide telemetry, multi-tenant businesses, and operations overview"
        action={
          <button
            onClick={() => onNavigate('businesses')}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-90 transition"
            style={{ background: '#2563EB' }}
          >
            <Plus className="h-3.5 w-3.5" /> Register Business
          </button>
        }
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Total Businesses"
          value={loading ? '—' : stats?.totalBusinesses ?? 0}
          sub={`${stats?.activeBusinesses ?? 0} active · ${stats?.suspendedBusinesses ?? 0} suspended`}
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
        />
        <KPI
          label="Total Orders"
          value={loading ? '—' : stats?.totalOrders ?? 0}
          sub="Platform Completed Orders"
          icon={<ClipboardList className="h-5 w-5 text-purple-500" />}
        />
        <KPI
          label="Platform Revenue"
          value={loading ? '—' : `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          sub="Gross Paid Settlements"
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <KPI
          label="Total Platform Users"
          value={loading ? '—' : stats?.totalUsers ?? 0}
          sub={`${stats?.totalAdmins ?? 0} Admins · ${stats?.totalManagers ?? 0} Mgrs · ${stats?.totalWaiters ?? 0} Waiters`}
          icon={<Users className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Platform Weekly Revenue & Orders</h3>
            <span className="text-xs text-slate-400 font-medium">Real-Time Database</span>
          </div>
          {weeklyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">No order revenue data recorded this week</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown by Business Type */}
        <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Businesses by Type</h3>
            <p className="text-xs text-slate-400 mb-4">Distribution across hospitality verticals</p>
            {typeData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No registered businesses</div>
            ) : (
              <div className="space-y-2.5">
                {typeData.map(t => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <Store className="h-3 w-3 text-blue-500" /> {t.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('businesses')}
            className="w-full mt-4 text-center text-xs font-bold text-blue-600 hover:text-blue-700 py-2 border-t border-slate-100 dark:border-slate-800"
          >
            Manage All Businesses →
          </button>
        </div>
      </div>

      {/* Recent Businesses Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Recently Registered Businesses</h3>
            <p className="text-xs text-slate-400">Latest venues onboarded to the platform</p>
          </div>
          <button onClick={() => onNavigate('businesses')} className="text-xs font-bold text-blue-600 hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Business</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Type</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Location</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Admin Contact</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {!stats?.recentBusinesses || stats.recentBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">No registered businesses found</td>
                </tr>
              ) : (
                stats.recentBusinesses.map(b => (
                  <tr key={b.businessUuid} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3 font-semibold text-xs text-slate-900 dark:text-white">{b.name}</td>
                    <td className="px-5 py-3"><BusinessTypeBadge type={b.businessType} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{b.city}, {b.county}</td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{b.admin?.fullName || '—'} ({b.admin?.email || '—'})</td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 2: BUSINESS MANAGEMENT
══════════════════════════════════════ */
const BusinessesPage = ({
  businesses,
  admins,
  onRefresh,
  showToast,
}: {
  businesses: Business[];
  admins: BusinessAdmin[];
  onRefresh: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    business: Business | null;
    action: 'suspend' | 'activate' | 'delete';
  }>({ open: false, business: null, action: 'suspend' });
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return businesses.filter(b => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city.toLowerCase().includes(search.toLowerCase()) ||
        b.county.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || b.businessType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [businesses, search, typeFilter, statusFilter]);

  const handleConfirmAction = async () => {
    const { business, action } = confirmModal;
    if (!business) return;
    setActionLoading(true);
    try {
      if (action === 'suspend') {
        const res = await fetch(getApiUrl(`/tenants/${business.id}/suspend`), {
          method: 'PATCH',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to suspend business');
        showToast(`${business.name} suspended successfully`);
      } else if (action === 'activate') {
        const res = await fetch(getApiUrl(`/tenants/${business.id}/activate`), {
          method: 'PATCH',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to activate business');
        showToast(`${business.name} activated successfully`);
      } else if (action === 'delete') {
        const res = await fetch(getApiUrl(`/tenants/${business.id}`), {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete business');
        showToast(`${business.name} deleted successfully`);
      }
      setConfirmModal({ open: false, business: null, action: 'suspend' });
      onRefresh();
      if (view === 'details') setView('list');
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (view === 'create') {
    return (
      <CreateBusinessStepper
        onSuccess={(newB) => {
          showToast(`Business '${newB.name}' registered successfully!`);
          onRefresh();
          setSelectedBusiness(newB);
          setView('details');
        }}
        onCancel={() => setView('list')}
      />
    );
  }

  if (view === 'details' && selectedBusiness) {
    return (
      <BusinessDetailsView
        business={selectedBusiness}
        admins={admins}
        onBack={() => { setView('list'); setSelectedBusiness(null); }}
        onUpdateBusiness={(updated) => {
          setSelectedBusiness(updated);
          onRefresh();
        }}
        onToggleStatus={(b) => {
          const isAct = b.status === 'Active' || b.status === 'ACTIVE';
          setConfirmModal({ open: true, business: b, action: isAct ? 'suspend' : 'activate' });
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Businesses & Establishments"
        subtitle={`${businesses.length} registered hospitality businesses`}
        action={
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-90 transition"
            style={{ background: '#2563EB' }}
          >
            <Plus className="h-3.5 w-3.5" /> Register Business
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by business name or location…"
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Business Types</option>
            {Object.entries(BUSINESS_TYPE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Trial">Trial</option>
          </select>

          <button
            onClick={() => {
              csvExport(
                ['Business Name', 'Type', 'City', 'County', 'Plan', 'Status', 'Orders', 'Created Date'],
                filtered.map(b => [b.name, b.businessType, b.city, b.county, b.plan, b.status, b.orders, b.createdAt]),
                'businesses-export.csv'
              );
              showToast('Businesses exported to CSV');
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Business Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Type</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Location</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Admin</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Created</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No businesses match your search filters
                  </td>
                </tr>
              ) : (
                filtered.map(business => {
                  const admin = admins.find(a => a.businessUuid === business.id || a.id === business.adminId);
                  const isAct = business.status === 'Active' || business.status === 'ACTIVE';
                  return (
                    <tr
                      key={business.id}
                      className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition"
                    >
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => { setSelectedBusiness(business); setView('details'); }}
                          className="flex items-center gap-3 hover:text-blue-600 transition text-left"
                        >
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700"
                            style={{ background: business.logoUrl ? undefined : (business.themeColor || '#2563EB') }}
                          >
                            {business.logoUrl ? (
                              <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600">
                            {business.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5"><BusinessTypeBadge type={business.businessType} /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{business.city} · {business.county}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {admin ? admin.fullName : '—'}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={business.plan} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={business.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{business.createdAt}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedBusiness(business); setView('details'); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                            title="View Business Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingBusiness(business)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 transition"
                            title="Edit Business"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({ open: true, business, action: isAct ? 'suspend' : 'activate' })}
                            className={`p-1.5 rounded-lg transition ${
                              isAct
                                ? 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600'
                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600'
                            }`}
                            title={isAct ? 'Suspend Business' : 'Activate Business'}
                          >
                            {isAct ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setConfirmModal({ open: true, business, action: 'delete' })}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                            title="Delete Business"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Business Modal */}
      <EditBusinessModal
        business={editingBusiness}
        open={!!editingBusiness}
        onClose={() => setEditingBusiness(null)}
        onSaved={() => {
          setEditingBusiness(null);
          onRefresh();
        }}
        showToast={showToast}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, business: null, action: 'suspend' })}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        title={
          confirmModal.action === 'suspend'
            ? 'Suspend Business'
            : confirmModal.action === 'activate'
            ? 'Reactivate Business'
            : 'Delete Business'
        }
        isDestructive={confirmModal.action === 'suspend' || confirmModal.action === 'delete'}
        confirmText={
          confirmModal.action === 'suspend'
            ? 'Suspend Access'
            : confirmModal.action === 'activate'
            ? 'Activate Access'
            : 'Delete Permanently'
        }
        message={
          confirmModal.action === 'suspend' ? (
            <p>
              Are you sure you want to suspend <strong>{confirmModal.business?.name}</strong>? Staff and customers will not be able to access menus or place orders until reactivated. Historical data is preserved.
            </p>
          ) : confirmModal.action === 'activate' ? (
            <p>
              Reactivate <strong>{confirmModal.business?.name}</strong>? Normal business operations, staff logins, and QR ordering will be restored.
            </p>
          ) : (
            <p>
              Are you sure you want to delete <strong>{confirmModal.business?.name}</strong>? This action soft-deletes the business and cancels its subscriptions.
            </p>
          )
        }
      />
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 6: BUSINESS ADMINS
══════════════════════════════════════ */
const BusinessAdminsPage = ({
  admins,
  businesses,
  onRefresh,
  showToast,
}: {
  admins: BusinessAdmin[];
  businesses: Business[];
  onRefresh: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [search, setSearch] = useState('');
  const [businessFilter, setBusinessFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return admins.filter(a => {
      const matchSearch =
        a.fullName.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search);
      const matchBusiness = businessFilter === 'ALL' || a.businessUuid === businessFilter;
      return matchSearch && matchBusiness;
    });
  }, [admins, search, businessFilter]);

  const toggleAdminStatus = async (admin: BusinessAdmin) => {
    setActionLoading(admin.userUuid);
    try {
      const newStatus = !admin.isActive;
      const res = await fetch(getApiUrl(`/auth/users/${admin.userUuid}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update admin account status');
      showToast(`${admin.fullName} is now ${newStatus ? 'Active' : 'Suspended'}`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Business Admins"
        subtitle="Manage primary administrator accounts provisioned for each business"
        action={
          <button
            onClick={() => {
              csvExport(
                ['Admin Name', 'Email', 'Phone', 'Business', 'Role', 'Status', 'Last Login', 'Created Date'],
                filtered.map(a => [a.fullName, a.email, a.phone, a.businessName, a.role, a.status, a.lastLogin, a.createdAt]),
                'business-admins-export.csv'
              );
              showToast('Admins list exported');
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by admin name, email, or phone…"
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <select
          value={businessFilter}
          onChange={e => setBusinessFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Businesses</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Admin Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Contact Info</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Business</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Last Login</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No business admins found
                  </td>
                </tr>
              ) : (
                filtered.map(admin => (
                  <tr
                    key={admin.userUuid}
                    className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {admin.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {admin.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">{admin.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div>{admin.email}</div>
                      <div className="text-slate-400">{admin.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {admin.businessName || '—'}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={admin.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{admin.lastLogin}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleAdminStatus(admin)}
                        disabled={actionLoading === admin.userUuid}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          admin.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {actionLoading === admin.userUuid ? (
                          <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : admin.isActive ? (
                          <><UserX className="h-3 w-3" /> Deactivate</>
                        ) : (
                          <><UserCheck className="h-3 w-3" /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 7: PLATFORM USERS
══════════════════════════════════════ */
const PlatformUsersPage = ({
  businesses,
  showToast,
}: {
  businesses: Business[];
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [businessFilter, setBusinessFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/users'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const rawUsers: any[] = data.data?.users ?? [];
        setUsers(
          rawUsers.map(u => ({
            id: u.userUuid || u.uuid,
            userUuid: u.userUuid || u.uuid,
            fullName: u.fullName || 'User',
            email: u.email,
            phone: u.phone,
            role: u.role,
            businessUuid: u.businessUuid,
            businessName: u.business?.name ?? '—',
            businessType: u.business?.businessType ?? '—',
            isActive: u.isActive !== false,
            isOnline: Boolean(u.isOnline),
            onlineStatus: u.onlineStatus || (u.isActive ? 'Active' : 'Inactive'),
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchBusiness = businessFilter === 'ALL' || u.businessUuid === businessFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'INACTIVE' && !u.isActive);
      return matchSearch && matchRole && matchBusiness && matchStatus;
    });
  }, [users, search, roleFilter, businessFilter, statusFilter]);

  const toggleUserStatus = async (user: PlatformUser) => {
    setActionLoading(user.userUuid);
    try {
      const newStatus = !user.isActive;
      const res = await fetch(getApiUrl(`/auth/users/${user.userUuid}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update account status');
      showToast(`${user.fullName} is now ${newStatus ? 'Active' : 'Suspended'}`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Platform Users"
        subtitle="Platform-wide user directory across all businesses and roles"
        action={
          <button
            onClick={() => {
              csvExport(
                ['Name', 'Email', 'Phone', 'Role', 'Business', 'Status', 'Created At'],
                filtered.map(u => [u.fullName, u.email, u.phone || '', u.role, u.businessName || '', u.isActive ? 'Active' : 'Inactive', u.createdAt]),
                'platform-users.csv'
              );
              showToast('Users exported');
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export Users
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-lg border px-3.5 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Business Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="WAITER">Waiter</option>
        </select>

        <select
          value={businessFilter}
          onChange={e => setBusinessFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none max-w-xs"
        >
          <option value="ALL">All Businesses</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Suspended / Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">User</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Role</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Assigned Business</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Registered</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCcw className="h-4 w-4 animate-spin inline mr-1.5" /> Loading platform users…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No users found matching your filters
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr
                    key={user.userUuid}
                    className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-slate-400">{user.email} {user.phone && `· ${user.phone}`}</div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {user.businessName || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.isActive ? 'Active' : 'Suspended'} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{user.createdAt}</td>
                    <td className="px-5 py-3.5 text-right">
                      {user.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(user)}
                          disabled={actionLoading === user.userUuid}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            user.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {actionLoading === user.userUuid ? (
                            <RefreshCcw className="h-3 w-3 animate-spin" />
                          ) : user.isActive ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 8: PLATFORM ANALYTICS
══════════════════════════════════════ */
const PlatformAnalyticsPage = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [report, setReport] = useState<any>(null);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/reports/analytics?period=${period}&businessUuid=ALL`), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReport(data.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const weeklyData = report?.dailyRevenue?.map((d: any) => ({
    day: d.day,
    revenue: Number(d.revenue || 0),
    orders: d.revenue > 0 ? Math.max(1, Math.round(d.revenue / 2500)) : 0,
  })) || [];

  const payBreakdown = [
    { name: 'M-Pesa STK', value: report?.paymentBreakdown?.mpesa?.percentage ?? 85, color: '#10B981' },
    { name: 'Card POS', value: report?.paymentBreakdown?.card?.percentage ?? 10, color: '#2563EB' },
    { name: 'Cash', value: report?.paymentBreakdown?.cash?.percentage ?? 5, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform Analytics"
        subtitle="Cross-tenant aggregated revenue, orders, and payment performance"
        action={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="DAILY">Today (Daily)</option>
              <option value="WEEKLY">This Week (Weekly)</option>
              <option value="MONTHLY">This Month (Monthly)</option>
              <option value="YEARLY">This Year (Yearly)</option>
            </select>
            <button
              onClick={() => {
                csvExport(
                  ['Day', 'Revenue (KES)', 'Orders'],
                  weeklyData.map((o: any) => [o.day, o.revenue, o.orders]),
                  `analytics-${period.toLowerCase()}.csv`
                );
                showToast('Analytics exported');
              }}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Total Orders" value={String(report?.kpis?.totalOrdersCount ?? 0)} sub="All Platform Orders" icon={<ClipboardList className="h-5 w-5 text-blue-500" />} />
        <KPI label="Platform Revenue" value={`KES ${(report?.kpis?.totalRevenue ?? 0).toLocaleString()}`} sub="Gross Completed Settlements" icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        <KPI label="Avg Order Value" value={`KES ${(report?.kpis?.averageOrderValue ?? 0).toLocaleString()}`} sub="Per Checkout Average" icon={<Store className="h-5 w-5 text-purple-500" />} />
        <KPI label="Active Staff" value={String(report?.kpis?.activeWaitersCount ?? 0)} sub="Active Waiters & Staff" icon={<Users className="h-5 w-5 text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Revenue Breakdown ({period})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">Payment Method Split</h3>
          <ResponsiveContainer width="100%" height={150}>
            <RePieChart>
              <Pie data={payBreakdown} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                {payBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {payBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      {report?.topProducts && report.topProducts.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Top Selling Products Across Establishments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Product', 'Category', 'Units Sold', 'Total Revenue'].map(h => (
                    <th key={h} className="pb-2 text-left text-xs font-bold text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p: any) => (
                  <tr key={p.name} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-xs text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-2.5 text-xs text-slate-500">{p.category}</td>
                    <td className="py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">{p.unitsSold} units</td>
                    <td className="py-2.5 text-xs font-bold text-emerald-600">KES {Number(p.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   FEATURE 9: AUDIT LOGS
══════════════════════════════════════ */
const AuditLogsPage = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/notifications/audit-logs'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const raw: any[] = data.data ?? [];
        setLogs(
          raw.map((l, idx) => ({
            id: l.auditUuid || `log-${idx}`,
            action: l.action,
            actor: l.user?.fullName || l.user?.email || 'System Worker',
            role: l.user?.role || 'SYSTEM',
            resource: l.entityType ? `${l.entityType} (${l.entityUuid || 'global'})` : l.resource || '/system',
            businessName: l.business?.name || l.club?.name || 'Platform-Wide',
            ip: l.ipAddress || '127.0.0.1',
            time: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'Just now',
            level: l.action.toLowerCase().includes('suspend') || l.action.toLowerCase().includes('delete') ? 'WARN' : 'INFO',
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filtered = useMemo(() => {
    return logs.filter(l =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Audit Logs & Compliance"
        subtitle="Platform security events, admin actions, and state changes recorded in the audit trail"
        action={
          <button
            onClick={() => {
              csvExport(
                ['Level', 'Action', 'Actor', 'Role', 'Target Resource', 'Business', 'IP Address', 'Timestamp'],
                filtered.map(l => [l.level, l.action, l.actor, l.role, l.resource, l.businessName || '', l.ip, l.time]),
                'audit-logs.csv'
              );
              showToast('Audit logs exported');
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export Audit Logs
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit events by action, actor, or business…"
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Severity</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Action / Event</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Actor</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Target Resource</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Business Scope</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">IP Address</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCcw className="h-4 w-4 animate-spin inline mr-1.5" /> Loading audit logs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No audit records match your query
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr
                    key={log.id}
                    className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition"
                  >
                    <td className="px-5 py-3.5"><StatusBadge status={log.level} /></td>
                    <td className="px-5 py-3.5 font-medium text-xs sm:text-sm text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {log.actor} <span className="text-slate-400">({log.role})</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{log.resource}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{log.businessName}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{log.ip}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   SUBSCRIPTIONS & BILLING
══════════════════════════════════════ */
const SubscriptionsPage = ({
  businesses,
  showToast,
}: {
  businesses: Business[];
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const planBreakdown = [
    { plan: 'Pro', price: 8900, count: businesses.filter(b => b.plan === 'Pro').length, mrr: businesses.filter(b => b.plan === 'Pro' && b.status === 'Active').length * 8900 },
    { plan: 'Standard', price: 4900, count: businesses.filter(b => b.plan === 'Standard').length, mrr: businesses.filter(b => b.plan === 'Standard' && b.status === 'Active').length * 4900 },
    { plan: 'Starter', price: 3900, count: businesses.filter(b => b.plan === 'Starter').length, mrr: businesses.filter(b => b.plan === 'Starter' && b.status === 'Active').length * 3900 },
  ];
  const totalMrr = planBreakdown.reduce((s, p) => s + p.mrr, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Subscriptions & Billing Overview"
        subtitle="Platform subscription tiers and MRR calculations based on active businesses"
        action={
          <button
            onClick={() => {
              csvExport(
                ['Plan', 'Price (KES)', 'Businesses Count', 'MRR (KES)'],
                planBreakdown.map(p => [p.plan, p.price, p.count, p.mrr]),
                'subscriptions-breakdown.csv'
              );
              showToast('Subscriptions exported');
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planBreakdown.map(p => (
          <div key={p.plan} className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge status={p.plan} />
              <span className="text-xs font-bold text-slate-400">{p.count} businesses</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">KES {p.price.toLocaleString()}</div>
              <div className="text-xs text-slate-400">per month</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-sm font-black text-emerald-600">MRR: KES {p.mrr.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">Total Monthly Recurring Revenue (Estimated)</h3>
        <p className="text-2xl font-black text-emerald-600">KES {totalMrr.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ month</span></p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   PLATFORM SETTINGS
══════════════════════════════════════ */
const PlatformSettingsPage = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [trialDays, setTrialDays] = useState('14');

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Platform Settings" subtitle="Global configuration for the Multi-Tenant Business Platform" />
      <div className="rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <div className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">Default Trial Period</div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={trialDays}
              onChange={e => setTrialDays(e.target.value)}
              className="w-20 rounded-lg border px-3 py-2 text-sm text-center font-bold outline-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <span className="text-sm text-slate-500">days for newly provisioned businesses</span>
          </div>
        </div>
      </div>

      {[
        { label: 'Email Security Notifications', desc: 'Send system security alerts and audit summaries to super admins.', val: emailNotifs, set: setEmailNotifs },
        { label: 'Maintenance Mode', desc: 'Temporarily lock public storefronts while platform updates run.', val: maintenance, set: setMaintenance },
      ].map(item => (
        <div key={item.label} className="rounded-xl border p-5 flex items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.label}</div>
            <div className="text-xs mt-0.5 text-slate-400">{item.desc}</div>
          </div>
          <button
            onClick={() => item.set(!item.val)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${item.val ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${item.val ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}

      <button
        onClick={() => showToast('Platform configuration saved')}
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-md shadow-blue-500/20"
        style={{ background: '#2563EB' }}
      >
        Save Platform Settings
      </button>
    </div>
  );
};

/* ─── Navigation Item Definition ─── */
type NavKey = 'dashboard' | 'businesses' | 'admins' | 'analytics' | 'users' | 'audit-logs' | 'subscriptions' | 'settings';

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'businesses', label: 'Businesses', icon: <Building2 className="h-4 w-4" /> },
  { key: 'admins', label: 'Business Admins', icon: <UserCog className="h-4 w-4" /> },
  { key: 'analytics', label: 'Platform Analytics', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { key: 'audit-logs', label: 'Audit Logs', icon: <ShieldCheck className="h-4 w-4" /> },
  { key: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'settings', label: 'Platform Settings', icon: <Settings className="h-4 w-4" /> },
];

const PAGE_TITLES: Record<NavKey, string> = {
  dashboard: 'Platform Overview',
  businesses: 'Businesses & Establishments',
  admins: 'Business Admins',
  analytics: 'Platform Analytics',
  users: 'Platform Users Directory',
  'audit-logs': 'Audit Logs & Compliance',
  subscriptions: 'Subscriptions & Billing',
  settings: 'Platform Settings',
};

/* ─── Main Super Admin Dashboard Component ─── */
export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [page, setPage] = useState<NavKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type }), []);

  /* Data States */
  const [stats, setStats] = useState<PlatformStatsData | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [admins, setAdmins] = useState<BusinessAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  /* User Info */
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('drinkhub_user');
      return u ? JSON.parse(u) : { fullName: 'Super Admin', email: 'superadmin@drinkhub.co.ke' };
    } catch {
      return { fullName: 'Super Admin', email: 'superadmin@drinkhub.co.ke' };
    }
  }, []);

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  /* Click outside to close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Data Fetching */
  const loadPlatformData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Platform Stats
      const statsRes = await fetch(getApiUrl('/tenants/platform/stats'), { headers: authHeaders() });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.data);
      }

      // 2. All Businesses
      const tenantRes = await fetch(getApiUrl('/tenants'), { headers: authHeaders() });
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        const rawTenants: any[] = tenantData.data ?? [];
        const parsedBusinesses: Business[] = rawTenants.map(t => {
          const primaryUser = t.users?.find((u: any) => u.role === 'ADMIN' || u.role === 'MANAGER') ?? t.users?.[0];
          return {
            id: t.businessUuid || t.clubUuid || t.uuid || t.id,
            name: t.name,
            slug: t.slug,
            businessType: t.businessType || 'RESTAURANT',
            description: t.description ?? '',
            address: t.address ?? '',
            city: t.city ?? '',
            county: t.county ?? 'Nairobi',
            phone: t.phone ?? '',
            email: t.email ?? '',
            openingTime: t.openingHours ?? '08:00',
            closingTime: t.closingHours ?? '23:00',
            logoUrl: t.logoUrl ?? '',
            bannerUrl: t.bannerUrl ?? '',
            themeColor: t.themeColor || t.brandColor || '#2563EB',
            plan: t.subscriptionStatus === 'TRIAL' ? 'Starter' : t.subscriptionStatus === 'SUSPENDED' ? 'Standard' : 'Pro',
            status: t.isActive === false || t.status === 'SUSPENDED' ? 'Suspended' : (t.status ?? 'Active'),
            isActive: t.isActive !== false && t.status !== 'SUSPENDED',
            mrr: t.isActive === false || t.status === 'SUSPENDED' ? 0 : 8900,
            orders: t._count?.orders ?? t.orders?.length ?? 0,
            adminId: primaryUser ? (primaryUser.userUuid || primaryUser.uuid || '') : '',
            adminName: primaryUser ? primaryUser.fullName : undefined,
            adminEmail: primaryUser ? primaryUser.email : undefined,
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
            trialDays: 14,
            startDate: '',
            expiryDate: '',
          };
        });
        setBusinesses(parsedBusinesses);
      }

      // 3. Business Admins
      const staffRes = await fetch(getApiUrl('/auth/staff?role=ADMIN'), { headers: authHeaders() });
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const rawStaff: any[] = staffData.data?.staff ?? staffData.data ?? [];
        const parsedAdmins: BusinessAdmin[] = rawStaff.map(s => ({
          id: s.uuid ?? s.userUuid,
          userUuid: s.uuid ?? s.userUuid,
          fullName: s.fullName || 'Admin',
          firstName: s.fullName ? s.fullName.split(' ')[0] : 'Admin',
          lastName: s.fullName ? s.fullName.split(' ').slice(1).join(' ') : '',
          email: s.email,
          phone: s.phone ?? '',
          businessUuid: s.businessUuid ?? s.clubUuid ?? '',
          businessName: s.business?.name ?? s.club?.name ?? 'Assigned Business',
          businessType: s.business?.businessType ?? 'RESTAURANT',
          role: s.role,
          status: s.isActive !== false ? 'Active' : 'Suspended',
          isActive: s.isActive !== false,
          lastLogin: s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never',
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
        }));
        setAdmins(parsedAdmins);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardOverviewPage stats={stats} loading={loading} onNavigate={setPage} showToast={showToast} />;
      case 'businesses':
        return <BusinessesPage businesses={businesses} admins={admins} onRefresh={loadPlatformData} showToast={showToast} />;
      case 'admins':
        return <BusinessAdminsPage admins={admins} businesses={businesses} onRefresh={loadPlatformData} showToast={showToast} />;
      case 'analytics':
        return <PlatformAnalyticsPage showToast={showToast} />;
      case 'users':
        return <PlatformUsersPage businesses={businesses} showToast={showToast} />;
      case 'audit-logs':
        return <AuditLogsPage showToast={showToast} />;
      case 'subscriptions':
        return <SubscriptionsPage businesses={businesses} showToast={showToast} />;
      case 'settings':
        return <PlatformSettingsPage showToast={showToast} />;
      default:
        return <DashboardOverviewPage stats={stats} loading={loading} onNavigate={setPage} showToast={showToast} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-body)' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ─── SIDEBAR ─── */}
      <aside
        className="flex-shrink-0 flex flex-col sticky top-0 h-screen transition-all duration-200 z-30"
        style={{ width: collapsed ? '64px' : '230px', background: 'var(--bg-sidebar)', borderRight: '1px solid #1E293B' }}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="h-8 w-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center hover:bg-blue-700 transition"
            title="Toggle Sidebar"
          >
            <Store className="h-4 w-4 text-white" />
          </button>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-black text-white truncate">DrinkHub</div>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase">Super Admin</div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                page === item.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-800">
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="border-b px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
          style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}
        >
          <div>
            <h1 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {PAGE_TITLES[page]}
            </h1>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Super Admin Console · Platform Control
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Zap className="h-3.5 w-3.5 text-emerald-500" /> Platform Operational
            </div>

            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--border)', background: profileOpen ? 'var(--bg-muted)' : 'transparent' }}
              >
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">SA</span>
                </div>
                <span className="text-xs font-bold hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                  {currentUser.fullName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform text-slate-400" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 animate-in fade-in"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.fullName}</div>
                    <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                    <span className="inline-block mt-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      Super Administrator
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setPage('settings'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" /> Platform Settings
                    </button>
                    <button
                      onClick={() => { setPage('audit-logs'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Audit Trail
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
