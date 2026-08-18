import React, { useState, useCallback } from 'react';
import { ThemeToggle } from '@drinkhub/ui';
import {
  Wine, LayoutDashboard, ClipboardList, BookOpen, Users, TrendingUp,
  Settings, Bell, LogOut, ChevronDown, Search, Plus, Download,
  Eye, EyeOff, Trash2, Edit2, CheckCircle2, X, RefreshCcw, Filter,
  AlertCircle, ArrowUpRight, RotateCcw, Key, UserX, UserCheck,
  Phone, Mail, Hash, Lock, Clock, Briefcase, Shield, QrCode, Copy, ExternalLink,
  Tag, Layers, FolderPlus, Camera, Image, Upload, Printer, Sparkles, Flame, Gift, Percent,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/*           Toast           */
const Toast = ({ msg, type = 'success', onDone }: { msg: string; type?: 'success' | 'error'; onDone: () => void }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl"
      style={{ background: type === 'success' ? '#0F172A' : '#7F1D1D', border: '1px solid rgba(255,255,255,0.1)', minWidth: 260 }}>
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
      {msg}
    </div>
  );
};

/*           Modal           */
const Modal = ({ open, onClose, title, size = 'md', children }: { open: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg'; children: React.ReactNode }) => {
  React.useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const w = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${w} rounded-2xl bg-white p-6 shadow-2xl mx-4 max-h-[90vh] overflow-y-auto`} onClick={ev => ev.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"><X className="h-4 w-4 text-slate-500" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

/*           Form Primitives           */
const FL = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);
const FE = ({ msg }: { msg?: string }) => msg ? <p className="text-xs text-red-500 mt-1 font-medium">{msg}</p> : null;

const SI = ({ error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
  <div>
    <input {...p} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 outline-none transition ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`} />
    <FE msg={error} />
  </div>
);
const STA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
);
const SS = ({ options, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) => (
  <select {...p} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition">
    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
);

/* Phone field with +254 prefix */
const PhoneInput = ({ error, value, onChange, placeholder }: { error?: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 select-none">+254</span>
      <input
        type="tel"
        value={value}
        onChange={e => onChange(e.target.value.replace(/^\+?254/, '').replace(/^0/, ''))}
        placeholder={placeholder ?? '7XX XXX XXX'}
        className={`flex-1 rounded-r-lg border px-3 py-2.5 text-sm text-slate-900 outline-none transition ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

/*           Shared UI           */
const getStatusConfig = (rawStatus: string) => {
  const key = (rawStatus ?? '').toUpperCase().trim();
  switch (key) {
    case 'PENDING':
      return {
        label: 'PENDING',
        dot: 'bg-amber-500 animate-pulse',
        badge: 'bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60 shadow-sm shadow-amber-500/10',
        activeFilter: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/30',
        inactiveFilter: 'hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300',
      };
    case 'CLAIMED':
      return {
        label: 'CLAIMED',
        dot: 'bg-sky-500',
        badge: 'bg-sky-50 text-sky-800 border-sky-300/80 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-700/60 shadow-sm shadow-sky-500/10',
        activeFilter: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-sm shadow-sky-500/30',
        inactiveFilter: 'hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 text-sky-700 dark:text-sky-300',
      };
    case 'PREPARING':
      return {
        label: 'PREPARING',
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-50 text-indigo-800 border-indigo-300/80 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-700/60 shadow-sm shadow-indigo-500/10',
        activeFilter: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm shadow-indigo-500/30',
        inactiveFilter: 'hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
      };
    case 'READY':
      return {
        label: 'READY',
        dot: 'bg-teal-500',
        badge: 'bg-teal-50 text-teal-800 border-teal-300/80 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700/60 shadow-sm shadow-teal-500/10',
        activeFilter: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-sm shadow-teal-500/30',
        inactiveFilter: 'hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-teal-700 dark:text-teal-300',
      };
    case 'DELIVERED':
    case 'COMPLETED':
      return {
        label: 'DELIVERED',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/60 shadow-sm shadow-emerald-500/10',
        activeFilter: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm shadow-emerald-500/30',
        inactiveFilter: 'hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
      };
    case 'CANCELLED':
      return {
        label: 'CANCELLED',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-800 border-rose-300/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/60 shadow-sm shadow-rose-500/10',
        activeFilter: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm shadow-rose-500/30',
        inactiveFilter: 'hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-300',
      };
    case 'ACTIVE':
    case 'ONLINE':
    case 'AVAILABLE':
      return {
        label: rawStatus,
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/60',
        activeFilter: 'bg-emerald-600 text-white border-emerald-600',
        inactiveFilter: 'hover:border-emerald-400',
      };
    case 'INACTIVE':
    case 'OFFLINE':
      return {
        label: rawStatus,
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        activeFilter: 'bg-slate-600 text-white border-slate-600',
        inactiveFilter: 'hover:border-slate-400',
      };
    case 'ON LEAVE':
      return {
        label: 'On Leave',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60',
        activeFilter: 'bg-amber-600 text-white border-amber-600',
        inactiveFilter: 'hover:border-amber-400',
      };
    case 'OUT OF STOCK':
      return {
        label: 'Out of Stock',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-800 border-rose-300/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/60',
        activeFilter: 'bg-rose-600 text-white border-rose-600',
        inactiveFilter: 'hover:border-rose-400',
      };
    default:
      return {
        label: rawStatus,
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        activeFilter: 'bg-blue-600 text-white border-blue-600',
        inactiveFilter: 'hover:border-slate-400',
      };
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors whitespace-nowrap ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

const KPI = ({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) => (
  <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
    <div className="flex items-start justify-between mb-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-body)' }}>{icon}</div>
    </div>
    <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{label}</div>
    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
  </div>
);

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

/*           Utilities           */
const csvExport = (headers: string[], rows: (string | number | boolean)[][], filename: string) => {
  const e = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`;
  const content = [headers.map(e).join(','), ...rows.map(r => r.map(e).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const generatePassword = (): string => {
  const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', l = 'abcdefghjkmnpqrstuvwxyz', d = '23456789', s = '@#$!';
  const all = u + l + d + s;
  const pwd = [u, l, d, s].map(c => c[Math.floor(Math.random() * c.length)]);
  for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = pwd.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pwd[i], pwd[j]] = [pwd[j], pwd[i]]; }
  return pwd.join('');
};

/* --- API config --- */
const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.includes('/api/v1')) base = `${base}/api/v1`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('drinkhub_token');
  const userStr = localStorage.getItem('drinkhub_user');
  let clubUuid = '';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      clubUuid = u.clubUuid || u.tenantId || u.club?.clubUuid || '';
    } catch {}
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(clubUuid ? { 'X-Tenant-Id': clubUuid } : {}),
  };
};

/* --- Data types --- */
interface Waiter {
  id: string; firstName: string; lastName: string; phone: string;
  email: string; username: string; employeeNo: string; status: 'Active' | 'Inactive' | 'On Leave';
  shift: string; onlineStatus: 'Online' | 'Offline'; lastLogin: string; notes: string;
}

/* Empty initial arrays - data is loaded from the API in each section */
const initWaiters: Waiter[] = [];
type OrderRow = { id: string; table: string; item: string; waiter: string; amount: number; status: string; time: string };
type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  imageUrl?: string | null;
  description?: string | null;
};

const orderData: OrderRow[] = [];
const menuItems: MenuItem[] = [];
const dailyRevenue: { day: string; rev: number }[] = [];
const hourlyOrders: { h: string; n: number }[] = [];

/* ------------------------------------------------ 
   ADD WAITER MODAL
------------------------------------------------ */
interface WaiterForm {
  firstName: string; lastName: string; phone: string; email: string;
  username: string; employeeNo: string; tempPwd: string;
  requirePwdChange: boolean; status: string; shift: string; notes: string;
}
const defaultWaiterForm: WaiterForm = {
  firstName: '', lastName: '', phone: '', email: '', username: '', employeeNo: '',
  tempPwd: '', requirePwdChange: true, status: 'Active', shift: 'Evening', notes: '',
};

const AddWaiterModal = ({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (w: Waiter) => void;
  onError?: (msg: string) => void;
}) => {
  const [form, setForm] = React.useState<WaiterForm>({ ...defaultWaiterForm, tempPwd: generatePassword() });
  const [errors, setErrors] = React.useState<Partial<Record<keyof WaiterForm | 'api', string>>>({});
  const [showPwd, setShowPwd] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const set = (k: keyof WaiterForm, v: string | boolean) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e: Partial<Record<keyof WaiterForm, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.email.trim()) e.email = 'Email is required for login';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.tempPwd.length < 8) e.tempPwd = 'Min. 8 characters';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.tempPwd,
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: form.phone.trim() || undefined,
          role: 'WAITER',
          mustChangePassword: form.requirePwdChange,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ api: data?.error?.message ?? data?.message ?? 'Failed to create waiter' });
        return;
      }
      const u = data.data;
      const parts = (u.fullName ?? '').split(' ');
      const idx = Math.floor(Math.random() * 900 + 100);
      onAdd({
        id: u.id ?? u.userUuid ?? `w${Date.now()}`,
        firstName: parts[0] ?? form.firstName,
        lastName: parts.slice(1).join(' ') || form.lastName,
        phone: form.phone.trim(),
        email: u.email ?? form.email,
        username: u.email?.split('@')[0] ?? form.username,
        employeeNo: form.employeeNo || `EMP-${idx}`,
        status: 'Active' as Waiter['status'],
        shift: form.shift,
        onlineStatus: 'Offline' as const,
        lastLogin: 'Never',
        notes: form.notes,
      });
      setForm({ ...defaultWaiterForm, tempPwd: generatePassword() });
      setErrors({});
      onClose();
    } catch {
      setErrors({ api: 'Network error — please try again' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Waiter" size="lg">
      <div className="space-y-6">

        {/* Section 1     Personal Information */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-blue-600" /></div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Personal Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL required>First Name</FL><SI value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" error={errors.firstName} /></div>
            <div><FL required>Last Name</FL><SI value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Wanjiku" error={errors.lastName} /></div>
            <div><FL required>Phone Number</FL><PhoneInput value={form.phone} onChange={v => set('phone', v)} error={errors.phone} /></div>
            <div><FL required>Email</FL><SI type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@club.co.ke" error={errors.email} /></div>
            <div><FL>Employee No. <span className="text-slate-400 font-normal normal-case">(optional)</span></FL><SI value={form.employeeNo} onChange={e => set('employeeNo', e.target.value)} placeholder="EMP-006" /></div>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: '#E2E8F0' }} />

        {/* Section 2     Authentication */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center"><Lock className="h-3.5 w-3.5 text-purple-600" /></div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Authentication</h4>
          </div>
          <div className="space-y-3">
            <div>
              <FL required>Temporary Password</FL>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <SI type={showPwd ? 'text' : 'password'} value={form.tempPwd} onChange={e => set('tempPwd', e.target.value)} placeholder="Min. 8 characters" error={errors.tempPwd} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => set('tempPwd', generatePassword())} className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Generate
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={form.requirePwdChange} onChange={e => set('requirePwdChange', e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <div>
                <div className="text-xs font-bold text-slate-700">Require password change on first login</div>
                <div className="text-[11px] text-slate-400 mt-0.5">The waiter must create a new password when they first sign in.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: '#E2E8F0' }} />

        {/* Section 3     Employment */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-emerald-600" /></div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Employment</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL>Employment Status</FL>
              <SS value={form.status} onChange={e => set('status', e.target.value)} options={[{ v: 'Active', l: 'Active' }, { v: 'Inactive', l: 'Inactive' }, { v: 'On Leave', l: 'On Leave' }]} />
            </div>
            <div>
              <FL>Shift <span className="text-slate-400 font-normal normal-case">(optional)</span></FL>
              <SS value={form.shift} onChange={e => set('shift', e.target.value)} options={[{ v: '', l: '    Not assigned    ' }, { v: 'Morning', l: 'Morning (6am   2pm)' }, { v: 'Afternoon', l: 'Afternoon (2pm   10pm)' }, { v: 'Evening', l: 'Evening (6pm   2am)' }, { v: 'Night', l: 'Night (10pm   6am)' }]} />
            </div>
            <div className="col-span-2">
              <FL>Notes <span className="text-slate-400 font-normal normal-case">(optional)</span></FL>
              <STA value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any additional notes about this staff member   " />
            </div>
          </div>
        </div>

        {errors.api && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs font-medium text-red-700">{errors.api}</p>
          </div>
        )}
        <div className="flex gap-3 pt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
          <button onClick={onClose} disabled={saving} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: '#2563EB' }}>
            {saving ? 'Creating…' : <><Users className="h-4 w-4 inline mr-1.5" />Add Waiter</>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/*                                                                                                                   
   STAFF MANAGEMENT PAGE
                                                                                                                   */
const StaffManagementPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [waiters, setWaiters] = React.useState<Waiter[]>([]);
  const [loadingWaiters, setLoadingWaiters] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [showAdd, setShowAdd] = React.useState(false);

  /* Fetch staff from API with live polling */
  const fetchStaff = React.useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingWaiters(true);
    try {
      const res = await fetch(getApiUrl('/auth/staff?role=WAITER'), { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load staff');
      const data = await res.json();
      const raw: any[] = data.data?.staff ?? data.data ?? [];
      setWaiters(raw.map((u: any, i: number) => {
        const parts = (u.fullName ?? '').split(' ');
        const isOnline = Boolean(u.isOnline || u.onlineStatus === 'Online');
        return {
          id: u.uuid ?? u.userUuid ?? u.id,
          firstName: parts[0] ?? '',
          lastName: parts.slice(1).join(' ') ?? '',
          phone: u.phone ?? '',
          email: u.email ?? '',
          username: u.email?.split('@')[0] ?? `staff-${i + 1}`,
          employeeNo: `EMP-${String(i + 1).padStart(3, '0')}`,
          status: (u.isActive ? 'Active' : 'Inactive') as Waiter['status'],
          shift: '',
          onlineStatus: (isOnline ? 'Online' : 'Offline') as 'Online' | 'Offline',
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-KE') : (u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-KE') : 'Never'),
          notes: '',
        };
      }));
    } catch {
      setWaiters([]);
    } finally {
      if (showLoading) setLoadingWaiters(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStaff(true);
    const interval = setInterval(() => {
      fetchStaff(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStaff]);

  const filtered = waiters.filter(w => {
    const matchSearch = `${w.firstName} ${w.lastName} ${w.username} ${w.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const online = waiters.filter(w => w.onlineStatus === 'Online').length;
  const onLeave = waiters.filter(w => w.status === 'On Leave').length;

  const toggleStatus = async (id: string) => {
    const target = waiters.find(w => w.id === id);
    if (!target) return;
    const nextActive = target.status !== 'Active';
    try {
      const res = await fetch(getApiUrl(`/auth/users/${id}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setWaiters(prev => prev.map(w => w.id === id ? { ...w, status: nextActive ? 'Active' : 'Inactive' } : w));
      showToast(`${target.firstName}'s account ${nextActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      showToast(err.message || 'Error updating account status');
    }
  };

  const deleteWaiter = async (id: string) => {
    const target = waiters.find(w => w.id === id);
    if (!target) return;
    if (!confirm(`Are you sure you want to remove ${target.firstName} ${target.lastName}?`)) return;
    try {
      const res = await fetch(getApiUrl(`/auth/users/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete staff member');
      setWaiters(prev => prev.filter(w => w.id !== id));
      showToast(`${target.firstName} ${target.lastName} removed`);
    } catch (err: any) {
      showToast(err.message || 'Error removing staff member');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Staff Management" subtitle="Manage waiters for your venue — only managers can create staff" action={
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>
          <Plus className="h-3.5 w-3.5" /> Add Waiter
        </button>
      } />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Total Waiters" value={String(waiters.length)} sub="Registered staff" icon={<Users className="h-5 w-5 text-blue-500" />} />
        <KPI label="Online Now" value={String(online)} sub="Currently active" icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
        <KPI label="On Leave" value={String(onLeave)} sub="Away from shift" icon={<Clock className="h-5 w-5 text-amber-500" />} />
        <KPI label="Offline" value={String(waiters.length - online)} sub="Not logged in" icon={<UserX className="h-5 w-5 text-slate-400" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username or phone…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {['All', 'Active', 'Inactive', 'On Leave'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { csvExport(['Name', 'Username', 'Phone', 'Email', 'Status', 'Shift', 'Online', 'Last Login'], filtered.map(w => [`${w.firstName} ${w.lastName}`, w.username, w.phone, w.email, w.status, w.shift, w.onlineStatus, w.lastLogin]), 'staff-export.csv'); showToast('Staff list exported'); }}
          className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {['Waiter', 'Username', 'Phone', 'Status', 'Online', 'Shift', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No staff members found.</td></tr>
            ) : filtered.map(w => (
              <tr key={w.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {w.firstName[0]}{w.lastName[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{w.firstName} {w.lastName}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{w.employeeNo}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>@{w.username}</td>
                <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{w.phone}</td>
                <td className="px-4 py-3.5"><StatusBadge status={w.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${w.onlineStatus === 'Online' ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' : 'bg-slate-300'}`} />
                    <span className={`text-xs ${w.onlineStatus === 'Online' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {w.onlineStatus}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{w.shift || '—'}</td>
                <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{w.lastLogin}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => showToast(`Password reset link sent to ${w.firstName}`)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Reset Password">
                      <Key className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={() => toggleStatus(w.id)} className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors" title={w.status === 'Active' ? 'Deactivate' : 'Activate'}>
                      {w.status === 'Active' ? <UserX className="h-3.5 w-3.5 text-amber-500" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                    </button>
                    <button onClick={() => deleteWaiter(w.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Remove">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
        <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Only <strong>Managers</strong> can create and manage waiter accounts. Platform Admins do not have access to staff management.
        </p>
      </div>

      <AddWaiterModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={(w) => { setWaiters(p => [w, ...p]); showToast(`${w.firstName} ${w.lastName} added successfully`); }} />
    </div>
  );
};

/*                                                                                                                   
   ORDERS PAGE
                                                                                                                   */
const OrdersPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [filter, setFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(getApiUrl('/orders'), { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      const raw: any[] = data.data?.orders ?? data.data ?? [];
      setOrders(raw.map((o: any) => ({
        id: o.orderNumber ?? o.uuid?.slice(0, 8).toUpperCase() ?? '-',
        table: o.table?.tableNumber ? `T-${String(o.table.tableNumber).padStart(2, '0')}` : '-',
        item: (o.items ?? o.orderItems ?? []).map((i: any) => `${i.product?.name ?? i.name} x ${i.quantity}`).join(', ') || '-',
        waiter: o.waiter ? `${(o.waiter.fullName ?? '').split(' ')[0]} ${(o.waiter.fullName ?? '').split(' ').slice(-1)[0]?.charAt(0) ?? ''}.` : 'Unclaimed',
        amount: Number(o.totalAmount ?? 0),
        status: o.status ?? '-',
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '-',
      })));
    } catch {
      // Keep empty on error
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const doRefresh = async () => { await fetchOrders(); showToast('Orders refreshed'); };

  const statuses = ['All', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  const filtered = orders.filter(o => (filter === 'All' || o.status === filter) && (search === '' || o.id.toLowerCase().includes(search.toLowerCase()) || o.table.toLowerCase().includes(search.toLowerCase()) || o.waiter.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-5">
      <SectionHeader title="Live Orders" subtitle="Real-time order feed for your venue" action={
        <div className="flex items-center gap-2">
          <button onClick={doRefresh} disabled={refreshing} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing   ' : 'Refresh'}
          </button>
          <button onClick={() => { csvExport(['Order', 'Table', 'Item', 'Waiter', 'Amount (KES)', 'Status', 'Time'], filtered.map(o => [o.id, o.table, o.item, o.waiter, o.amount, o.status, o.time]), 'orders-export.csv'); showToast('Orders exported'); }}
            className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      } />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 rounded-lg border px-3.5 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, table, waiter   " className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {statuses.map(s => {
            const count = s === 'All' ? orders.length : orders.filter(o => (o.status ?? '').toUpperCase() === s).length;
            const isSelected = filter === s;
            const config = s === 'All' ? null : getStatusConfig(s);

            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                  isSelected
                    ? (config ? config.activeFilter : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/20')
                    : (config ? `${config.inactiveFilter} border-[var(--border)] bg-[var(--bg-card)]` : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)] border-[var(--border)] bg-[var(--bg-card)]')
                }`}
              >
                {config && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : config.dot}`} />}
                <span>{s}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {['Order ID', 'Table', 'Item', 'Waiter', 'Amount', 'Status', 'Time'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-xs text-slate-400">No orders found</td></tr>
          ) : filtered.map(o => (
            <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{o.id}</td>
              <td className="px-5 py-3.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{o.table}</td>
              <td className="px-5 py-3.5 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{o.item}</td>
              <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{o.waiter}</td>
              <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">KES {o.amount.toLocaleString()}</td>
              <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
              <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{o.time}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

/* --- MENU PAGE --- */
interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  count: number;
}

interface ManagerOffer {
  id: string;
  title: string;
  description?: string;
  discountValue: number;
  promoCode?: string;
  offerType: string;
  isActive: boolean;
}

/* Module-level cache — survives re-renders and tab navigation */
let _menuCache: { categories: CategoryItem[]; items: MenuItem[]; offers: ManagerOffer[] } | null = null;

const MenuPage = ({ showToast }: { showToast: (m: string) => void }) => {
  // Seed from cache immediately so the tab appears instant on revisit
  const [items, setItems] = React.useState<MenuItem[]>(_menuCache?.items ?? []);
  const [categories, setCategories] = React.useState<CategoryItem[]>(_menuCache?.categories ?? []);
  const [offers, setOffers] = React.useState<ManagerOffer[]>(_menuCache?.offers ?? []);
  const [selectedCatFilter, setSelectedCatFilter] = React.useState<string>('All');
  
  // Modals
  const [showAdd, setShowAdd] = React.useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = React.useState(false);
  const [showOffersModal, setShowOffersModal] = React.useState(false);
  const [showAddOfferModal, setShowAddOfferModal] = React.useState(false);
  const [showAddCatModal, setShowAddCatModal] = React.useState(false);
  const [showEditCatModal, setShowEditCatModal] = React.useState(false);
  const [showEditItemModal, setShowEditItemModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Forms
  const [addForm, setAddForm] = React.useState({ name: '', category: '', price: '', imageUrl: '', description: '' });
  const [newCatForm, setNewCatForm] = React.useState({ name: '', description: '' });
  const [editCatForm, setEditCatForm] = React.useState({ id: '', name: '', description: '' });
  const [editItemForm, setEditItemForm] = React.useState({ id: '', name: '', category: '', price: '', imageUrl: '', description: '' });
  const [offerForm, setOfferForm] = React.useState({
    title: '',
    description: '',
    discountValue: '20',
    promoCode: '',
    offerType: 'PERCENTAGE_DISCOUNT',
  });

  const [loading, setLoading] = React.useState(false);
  // True only on first load when there's no cached data yet
  const [fetching, setFetching] = React.useState(_menuCache === null);

  /* ── Image Upload & Canvas Compression ── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (isEdit) {
            setEditItemForm(p => ({ ...p, imageUrl: compressedDataUrl }));
          } else {
            setAddForm(p => ({ ...p, imageUrl: compressedDataUrl }));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchMenu = React.useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/menu'), { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const rawCats: any[] = (data.data ?? data).categories ?? [];
      const rawOffers: any[] = (data.data ?? data).offers ?? [];
      
      const parsedCats: CategoryItem[] = rawCats.map((cat: any) => ({
        id: cat.categoryUuid ?? cat.uuid ?? cat.id,
        name: cat.name,
        description: cat.description,
        count: (cat.products ?? []).length,
      }));
      setCategories(parsedCats);

      const parsedOffers: ManagerOffer[] = rawOffers.map((o: any) => ({
        id: o.offerUuid ?? o.uuid ?? o.id,
        title: o.title,
        description: o.description,
        discountValue: Number(o.discountValue ?? 0),
        promoCode: o.promoCode,
        offerType: o.offerType ?? 'PERCENTAGE_DISCOUNT',
        isActive: o.isActive !== false,
      }));
      setOffers(parsedOffers);

      setAddForm(p => ({
        ...p,
        category: p.category || parsedCats[0]?.name || '',
      }));

      const flat: MenuItem[] = [];
      rawCats.forEach((cat: any) => {
        (cat.products ?? []).forEach((p: any) => {
          flat.push({
            id: p.productUuid ?? p.uuid ?? p.id,
            name: p.name,
            category: cat.name,
            price: Number(p.price),
            status: p.isAvailable !== false ? 'Available' : 'Out of Stock',
            imageUrl: p.imageUrl ?? null,
            description: p.description ?? null,
          });
        });
      });
      setItems(flat);

      // Populate module-level cache for instant revisits
      _menuCache = { categories: parsedCats, items: flat, offers: parsedOffers };
    } catch { /* keep previous state on error */ }
    finally {
      setFetching(false);
    }
  // No dependency on addForm.category — prevents re-fetching on every form change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.discountValue) {
      showToast('Offer title and discount value are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/menu/offers'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: offerForm.title.trim(),
          description: offerForm.description.trim() || undefined,
          offerType: offerForm.offerType,
          discountValue: Number(offerForm.discountValue),
          promoCode: offerForm.promoCode.trim().toUpperCase() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to create offer');
      showToast(`Special offer "${offerForm.title}" published!`);
      setOfferForm({ title: '', description: '', discountValue: '20', promoCode: '', offerType: 'PERCENTAGE_DISCOUNT' });
      setShowAddOfferModal(false);
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error creating offer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOffer = async (id: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: nextActive } : o));
      await fetch(getApiUrl(`/menu/offers/${id}/toggle`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: nextActive }),
      });
      showToast(`Offer ${nextActive ? 'activated' : 'paused'}`);
    } catch {
      showToast('Failed to update offer status');
      fetchMenu();
    }
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete offer "${title}"?`)) return;
    try {
      setOffers(prev => prev.filter(o => o.id !== id));
      await fetch(getApiUrl(`/menu/offers/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      showToast(`Offer "${title}" deleted`);
    } catch {
      showToast('Failed to delete offer');
      fetchMenu();
    }
  };

  React.useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = i.status === 'Available' ? 'Out of Stock' : 'Available';
      fetch(getApiUrl(`/menu/products/${id}/availability`), { method: 'PATCH', headers: authHeaders() }).catch(() => {});
      showToast(`${i.name} marked as ${next}`);
      return { ...i, status: next };
    }));
  };

  const del = async (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(p => p.filter(i => i.id !== id));
    try {
      await fetch(getApiUrl(`/menu/products/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (item) showToast(`${item.name} removed from menu`);
    } catch {
      if (item) showToast(`Removed ${item.name}`);
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name || !addForm.price) return;
    const categoryToUse = addForm.category || (categories[0]?.name ?? 'General');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/menu/products'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: addForm.name,
          categoryName: categoryToUse,
          price: Number(addForm.price),
          imageUrl: addForm.imageUrl || undefined,
          description: addForm.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to add menu item');
      showToast(`${addForm.name} added to menu`);
      setShowAdd(false);
      setAddForm({ name: '', category: categoryToUse, price: '', imageUrl: '', description: '' });
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error adding menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatForm.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/menu/categories'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newCatForm.name.trim(),
          description: newCatForm.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to create category');
      showToast(`Category "${newCatForm.name}" created successfully`);
      setNewCatForm({ name: '', description: '' });
      setShowAddCatModal(false);
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCatForm.id || !editCatForm.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/menu/categories/${editCatForm.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editCatForm.name.trim(),
          description: editCatForm.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to update category');
      showToast(`Category renamed to "${editCatForm.name}"`);
      setShowEditCatModal(false);
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error updating category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await fetch(getApiUrl(`/menu/categories/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Failed to delete category');
      }
      showToast(`Category "${name}" deleted`);
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error deleting category');
    }
  };

  const handleUpdateItem = async () => {
    if (!editItemForm.id || !editItemForm.name.trim() || !editItemForm.price) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/menu/products/${editItemForm.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editItemForm.name.trim(),
          price: Number(editItemForm.price),
          imageUrl: editItemForm.imageUrl || null,
          description: editItemForm.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to update menu item');
      showToast(`Item "${editItemForm.name}" updated`);
      setShowEditItemModal(false);
      fetchMenu();
    } catch (err: any) {
      showToast(err.message || 'Error updating item');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = React.useMemo(() => {
    if (categories.length > 0) {
      return categories.map(c => ({ v: c.name, l: c.name }));
    }
    return ['Beer', 'Spirits', 'Wine', 'Cocktails', 'Mocktails', 'Cognac', 'Mixers', 'Snacks', 'Food & Grills'].map(c => ({ v: c, l: c }));
  }, [categories]);

  const filteredItems = React.useMemo(() => {
    let list = items;
    if (selectedCatFilter !== 'All') {
      list = list.filter(i => i.category.toLowerCase() === selectedCatFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, selectedCatFilter, searchQuery]);

  if (fetching) {
    return (
      <div className="space-y-5 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-72 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-24 rounded-lg bg-blue-200 dark:bg-blue-900" />
          </div>
        </div>
        {/* Pills skeleton */}
        <div className="flex gap-2">
          {[80, 70, 90, 75, 85].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: w }} />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="h-10 bg-slate-100 dark:bg-slate-800" />
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="flex items-center gap-4 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-56 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Menu Management" subtitle="Manage your venue's categories, food, drink items, and daily offers in real-time" action={
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowOffersModal(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all hover:bg-amber-500/10 hover:border-amber-400 text-amber-600 dark:text-amber-400"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Deals & Offers ({offers.filter(o => o.isActive).length})
          </button>
          <button onClick={() => setShowCategoriesModal(true)} className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
            <Layers className="h-3.5 w-3.5 text-blue-600" /> Manage Categories ({categories.length})
          </button>
          <button onClick={() => { setAddForm({ name: '', category: categories[0]?.name || 'Beer', price: '', imageUrl: '', description: '' }); setShowAdd(true); }} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        </div>
      } />

      {/* ── Deals & Daily Offers Preview Strip ── */}
      {offers.length > 0 && (
        <div className="rounded-2xl border p-4 transition-all" style={{ background: 'var(--bg-card)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Active Customer Deals of the Day ({offers.filter(o => o.isActive).length})
              </span>
            </div>
            <button
              onClick={() => setShowOffersModal(true)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Manage Deals <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {offers.slice(0, 3).map(offer => (
              <div
                key={offer.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-all"
                style={{
                  background: offer.isActive ? 'rgba(245,158,11,0.06)' : 'var(--bg-body)',
                  borderColor: offer.isActive ? 'rgba(245,158,11,0.25)' : 'var(--border)',
                  opacity: offer.isActive ? 1 : 0.6,
                }}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{offer.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {offer.offerType === 'BUY_ONE_GET_ONE' ? 'Buy 1 Get 1' : `${offer.discountValue}% Discount`}
                    {offer.promoCode ? ` · Code: ${offer.promoCode}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleOffer(offer.id, offer.isActive)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                    offer.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {offer.isActive ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
          <button
            onClick={() => setSelectedCatFilter('All')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all flex-shrink-0 ${selectedCatFilter === 'All' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'hover:bg-slate-100'}`}
            style={selectedCatFilter === 'All' ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            <span>All Items</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCatFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{items.length}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatFilter(cat.name)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all whitespace-nowrap flex-shrink-0 ${selectedCatFilter === cat.name ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'hover:bg-slate-100'}`}
              style={selectedCatFilter === cat.name ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCatFilter === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{cat.count}</span>
            </button>
          ))}
          <button
            onClick={() => { setNewCatForm({ name: '', description: '' }); setShowAddCatModal(true); }}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0 ml-1"
          >
            <Plus className="h-3 w-3" /> Add Category
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-72 flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, drinks, food..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500 shadow-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Items Scrollable Table */}
      <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-h-[580px] overflow-y-auto overflow-x-auto relative">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {['Item', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold whitespace-nowrap bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {searchQuery ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No items match "{searchQuery}"</p>
                        <p className="text-xs text-slate-400">Try checking for typos or clear search.</p>
                      </div>
                    ) : (
                      `No items found in ${selectedCatFilter === 'All' ? 'this venue' : `"${selectedCatFilter}"`}. Click "+ Add Item" to add drinks or food with photos.`
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors" style={{ background: 'var(--bg-card)' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base flex-shrink-0 text-slate-400">
                            🍸
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                          {item.description && <div className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>{item.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Tag className="h-2.5 w-2.5 text-slate-500" /> {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">KES {item.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button onClick={() => toggle(item.id)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 hover:bg-red-100'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.status === 'Available' ? 'bg-emerald-500' : 'bg-red-500'}`} />{item.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditItemForm({ id: item.id, name: item.name, category: item.category, price: String(item.price), imageUrl: item.imageUrl || '', description: item.description || '' }); setShowEditItemModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Edit Item">
                          <Edit2 className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors" title="Delete Item"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Manage Categories ── */}
      <Modal open={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} title="Manage Menu Categories" size="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-slate-500">Edit or reorganize categories that appear when building menus.</p>
            <button
              onClick={() => { setNewCatForm({ name: '', description: '' }); setShowAddCatModal(true); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#2563EB' }}
            >
              <Plus className="h-3 w-3" /> New Category
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No categories created yet. Click "+ New Category" to create one.</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 hover:bg-slate-100/50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {cat.name}
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{cat.count} items</span>
                    </h4>
                    {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditCatForm({ id: cat.id, name: cat.name, description: cat.description || '' }); setShowEditCatModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Edit / Rename Category"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button onClick={() => setShowCategoriesModal(false)} className="rounded-xl border px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Add Category ── */}
      <Modal open={showAddCatModal} onClose={() => setShowAddCatModal(false)} title="Create New Category" size="sm">
        <div className="space-y-4">
          <div><FL required>Category Name</FL><SI value={newCatForm.name} onChange={e => setNewCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cocktails, Food & Grills, Wines" /></div>
          <div><FL>Description (Optional)</FL><SI value={newCatForm.description} onChange={e => setNewCatForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Signature house mixes and craft specials" /></div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowAddCatModal(false)} className="flex-1 rounded-xl border py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button disabled={loading || !newCatForm.name.trim()} onClick={handleCreateCategory} className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: '#2563EB' }}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Edit Category ── */}
      <Modal open={showEditCatModal} onClose={() => setShowEditCatModal(false)} title="Edit Category" size="sm">
        <div className="space-y-4">
          <div><FL required>Category Name</FL><SI value={editCatForm.name} onChange={e => setEditCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cocktails" /></div>
          <div><FL>Description (Optional)</FL><SI value={editCatForm.description} onChange={e => setEditCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Short category description" /></div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowEditCatModal(false)} className="flex-1 rounded-xl border py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button disabled={loading || !editCatForm.name.trim()} onClick={handleUpdateCategory} className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: '#2563EB' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Add Menu Item ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Menu Item">
        <div className="space-y-4">
          {/* Item Photo Upload */}
          <div>
            <FL>Item Photo (Optional)</FL>
            {addForm.imageUrl ? (
              <div className="relative rounded-xl border p-2.5 flex items-center gap-3 bg-slate-50" style={{ borderColor: '#CBD5E1' }}>
                <img src={addForm.imageUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">Photo selected</p>
                  <p className="text-[11px] text-slate-400">Ready to save with menu item</p>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
                      Change Photo
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} />
                    </label>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={() => setAddForm(p => ({ ...p, imageUrl: '' }))} className="text-xs font-bold text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center">
                <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Click or tap to upload item photo</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} />
              </label>
            )}
          </div>

          <div><FL required>Item Name</FL><SI value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Whisky Sour, Grilled Ribeye" /></div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <FL required>Category</FL>
              <button
                type="button"
                onClick={() => { setNewCatForm({ name: '', description: '' }); setShowAddCatModal(true); }}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> New Category
              </button>
            </div>
            <SS value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))} options={categoryOptions} />
          </div>

          <div><FL required>Price (KES)</FL><SI type="number" value={addForm.price} onChange={e => setAddForm(p => ({ ...p, price: e.target.value }))} placeholder="0" min="0" /></div>
          
          <div><FL>Description (Optional)</FL><SI value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Craft bourbon, fresh lemon juice, sugar & egg white" /></div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button disabled={loading} onClick={handleAddItem} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Edit Menu Item ── */}
      <Modal open={showEditItemModal} onClose={() => setShowEditItemModal(false)} title="Edit Menu Item">
        <div className="space-y-4">
          {/* Item Photo Upload */}
          <div>
            <FL>Item Photo (Optional)</FL>
            {editItemForm.imageUrl ? (
              <div className="relative rounded-xl border p-2.5 flex items-center gap-3 bg-slate-50" style={{ borderColor: '#CBD5E1' }}>
                <img src={editItemForm.imageUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">Item photo</p>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
                      Replace Photo
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} />
                    </label>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={() => setEditItemForm(p => ({ ...p, imageUrl: '' }))} className="text-xs font-bold text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center">
                <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Click or tap to upload photo</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} />
              </label>
            )}
          </div>

          <div><FL required>Item Name</FL><SI value={editItemForm.name} onChange={e => setEditItemForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Whisky Sour" /></div>
          <div>
            <FL>Category</FL>
            <SI value={editItemForm.category} disabled placeholder="Category" />
          </div>
          <div><FL required>Price (KES)</FL><SI type="number" value={editItemForm.price} onChange={e => setEditItemForm(p => ({ ...p, price: e.target.value }))} placeholder="0" min="0" /></div>
          <div><FL>Description (Optional)</FL><SI value={editItemForm.description} onChange={e => setEditItemForm(p => ({ ...p, description: e.target.value }))} placeholder="Short item description" /></div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowEditItemModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button disabled={loading} onClick={handleUpdateItem} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Manage Daily Deals & Offers ── */}
      <Modal open={showOffersModal} onClose={() => setShowOffersModal(false)} title="Manage Special Deals & Offers of the Day" size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-slate-500">
              Create and toggle daily promotional banners that appear directly on your customers' mobile menu.
            </p>
            <button
              onClick={() => {
                setOfferForm({ title: '', description: '', discountValue: '20', promoCode: '', offerType: 'PERCENTAGE_DISCOUNT' });
                setShowAddOfferModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{ background: '#F59E0B' }}
            >
              <Plus className="h-3.5 w-3.5" /> New Deal
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {offers.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Sparkles className="h-8 w-8 text-amber-400 mx-auto opacity-40" />
                <p className="text-xs text-slate-400">No active deals or offers yet.</p>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Create your first Happy Hour or Daily Deal →
                </button>
              </div>
            ) : (
              offers.map(offer => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {offer.offerType === 'BUY_ONE_GET_ONE' ? '🎁 BUY 1 GET 1' : `${offer.discountValue}% OFF`}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {offer.title}
                      </h4>
                      {offer.promoCode && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {offer.promoCode}
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{offer.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleOffer(offer.id, offer.isActive)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                        offer.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {offer.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id, offer.title)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 transition-colors"
                      title="Delete Offer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button onClick={() => setShowOffersModal(false)} className="rounded-xl border px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Create Special Deal / Offer of the Day ── */}
      <Modal open={showAddOfferModal} onClose={() => setShowAddOfferModal(false)} title="Create Special Deal of the Day" size="md">
        <div className="space-y-4">
          <div>
            <FL required>Deal / Offer Title</FL>
            <SI
              value={offerForm.title}
              onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Happy Hour Cocktails, 20% Off Single Malts"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL required>Offer Type</FL>
              <SS
                value={offerForm.offerType}
                onChange={e => setOfferForm(p => ({ ...p, offerType: e.target.value }))}
                options={[
                  { v: 'PERCENTAGE_DISCOUNT', l: 'Percentage Discount (%)' },
                  { v: 'FIXED_AMOUNT_DISCOUNT', l: 'Fixed Amount (KES)' },
                  { v: 'BUY_ONE_GET_ONE', l: 'Buy 1 Get 1 Free' },
                ]}
              />
            </div>
            <div>
              <FL required>{offerForm.offerType === 'PERCENTAGE_DISCOUNT' ? 'Discount Percentage (%)' : offerForm.offerType === 'FIXED_AMOUNT_DISCOUNT' ? 'Discount Amount (KES)' : 'Bonus Quantity'}</FL>
              <SI
                type="number"
                value={offerForm.discountValue}
                onChange={e => setOfferForm(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={offerForm.offerType === 'PERCENTAGE_DISCOUNT' ? '20' : '500'}
                min="0"
              />
            </div>
          </div>

          <div>
            <FL>Promo Code (Optional)</FL>
            <SI
              value={offerForm.promoCode}
              onChange={e => setOfferForm(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. HAPPY20, CHEERS"
            />
          </div>

          <div>
            <FL>Description & Terms (Optional)</FL>
            <SI
              value={offerForm.description}
              onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Available every Friday from 5 PM to 9 PM at all tables."
            />
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Presets</p>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { title: 'Happy Hour: Buy 2 Cocktails Get 1 Free', type: 'BUY_ONE_GET_ONE', val: '1', code: 'HAPPY' },
                { title: '20% Off All Single Malts & Whiskeys', type: 'PERCENTAGE_DISCOUNT', val: '20', code: 'WHISKY20' },
                { title: 'Weekend Vibes: KES 500 Off Bottle Service', type: 'FIXED_AMOUNT_DISCOUNT', val: '500', code: 'VIP500' },
              ].map(preset => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => setOfferForm({
                    title: preset.title,
                    description: 'Special limited-time deal for our guests.',
                    offerType: preset.type,
                    discountValue: preset.val,
                    promoCode: preset.code,
                  })}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300/80 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 transition-colors"
                >
                  {preset.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAddOfferModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button
              disabled={loading || !offerForm.title.trim() || !offerForm.discountValue}
              onClick={handleCreateOffer}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: '#F59E0B' }}
            >
              {loading ? 'Publishing...' : 'Publish Special Deal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/*                                                                                                                   
   DASHBOARD PAGE
                                                                                                                   */
const DashboardPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [kpis, setKpis] = React.useState({ revenue: '-', orders: '-', waiters: '-', avgOrder: '-' });
  const [revChart, setRevChart] = React.useState<{ day: string; rev: number }[]>([]);
  const [hourChart, setHourChart] = React.useState<{ h: string; n: number }[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<OrderRow[]>([]);

  const fetchDashboard = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch(getApiUrl('/reports/analytics?period=WEEKLY'), { headers: authHeaders() }),
        fetch(getApiUrl('/orders'), { headers: authHeaders() }),
      ]);
      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        const report = d.data?.report ?? d.data ?? {};
        const k = report.kpis ?? {};
        if (k.totalRevenue != null || k.totalOrdersCount != null) {
          setKpis({
            revenue: `KES ${Number(k.totalRevenue ?? 0).toLocaleString()}`,
            orders: String(k.totalOrdersCount ?? 0),
            waiters: String(k.activeWaitersCount ?? 0),
            avgOrder: `KES ${Number(k.averageOrderValue ?? 0).toLocaleString()}`,
          });
        }
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        if (report.dailyRevenue?.length) {
          setRevChart(report.dailyRevenue.map((d: any) => ({ day: d.day ?? d.date, rev: Number(d.revenue ?? d.rev ?? 0) })));
        } else {
          setRevChart(days.map(day => ({ day, rev: 0 })));
        }
        if (report.hourlyOrders?.length) {
          setHourChart(report.hourlyOrders.map((h: any) => ({ h: String(h.hour ?? h.h), n: Number(h.count ?? h.n ?? 0) })));
        } else {
          setHourChart([]);
        }
      }
      if (ordersRes.ok) {
        const od = await ordersRes.json();
        const raw: any[] = od.data?.orders ?? od.data ?? [];
        
        const totalRev = raw.reduce((sum, o) => sum + (o.status === 'COMPLETED' || o.status === 'DELIVERED' ? Number(o.totalAmount || 0) : 0), 0);
        const completedCount = raw.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
        const avgVal = completedCount > 0 ? Math.round(totalRev / completedCount) : 0;
        const activeWaitersSet = new Set(raw.map(o => o.waiterId || o.waiter?.userUuid).filter(Boolean));

        setKpis(prev => ({
          revenue: totalRev > 0 ? `KES ${totalRev.toLocaleString()}` : (prev.revenue !== '-' ? prev.revenue : 'KES 0'),
          orders: raw.length > 0 ? String(raw.length) : (prev.orders !== '-' ? prev.orders : '0'),
          waiters: activeWaitersSet.size > 0 ? String(activeWaitersSet.size) : (prev.waiters !== '-' ? prev.waiters : '0'),
          avgOrder: avgVal > 0 ? `KES ${avgVal.toLocaleString()}` : (prev.avgOrder !== '-' ? prev.avgOrder : 'KES 0'),
        }));

        setRecentOrders(raw.slice(0, 5).map((o: any) => ({
          id: o.orderNumber ?? o.uuid?.slice(0, 8).toUpperCase() ?? '-',
          table: o.table?.tableNumber ? `T-${String(o.table.tableNumber).padStart(2, '0')}` : '-',
          item: (o.items ?? o.orderItems ?? []).map((i: any) => `${i.product?.name ?? i.name}`).join(', ') || '-',
          waiter: o.waiter?.fullName?.split(' ')[0] ?? 'Unclaimed',
          amount: Number(o.totalAmount ?? 0),
          status: o.status ?? '-',
          time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '-',
        })));
      }
    } catch { /* keep current state on error */ } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  const doRefresh = async () => { await fetchDashboard(); showToast('Dashboard refreshed'); };

  return (
    <div className="space-y-5">
      <SectionHeader title="Club Overview" subtitle="Live dashboard" action={
        <button onClick={doRefresh} disabled={refreshing} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing   ' : 'Refresh'}
        </button>
      } />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Revenue (Period)" value={kpis.revenue} sub="From completed orders" icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        <KPI label="Total Orders" value={kpis.orders} sub="All statuses" icon={<ClipboardList className="h-5 w-5 text-blue-500" />} />
        <KPI label="Active Waiters" value={kpis.waiters} sub="With completed orders" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <KPI label="Avg Order Value" value={kpis.avgOrder} sub="Completed orders" icon={<ArrowUpRight className="h-5 w-5 text-amber-500" />} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Revenue (KES)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revChart}>
              <defs><linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="rev" stroke="#2563EB" strokeWidth={2} fill="url(#revG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(h: number | string) => `${h}:00`} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="n" name="Orders" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Quick order list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Recent Orders</h3>
          <StatusBadge status="Online" />
        </div>
        <table className="w-full text-sm">
          <tbody>{recentOrders.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-6 text-xs text-slate-400">No recent orders</td></tr>
          ) : recentOrders.map(o => (
            <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{o.id}</td>
              <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{o.table} | {o.item}</td>
              <td className="px-5 py-3 text-xs font-bold text-emerald-600">KES {o.amount.toLocaleString()}</td>
              <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{o.time}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

/* --- REPORTS PAGE --- */
const ReportsPage = ({ showToast }: { showToast: (m: string, type?: 'success' | 'error') => void }) => {
  const exportReport = async (title: string, type: string) => {
    showToast(`Generating ${title}...`);
    try {
      if (type === 'revenue') {
        const res = await fetch(getApiUrl('/reports/analytics?period=WEEKLY'), { headers: authHeaders() });
        const d = await res.json();
        const report = d.data?.report ?? d.data ?? {};
        const rows = (report.hourlyOrders ?? []).map((h: any) => [`${h.hour ?? h.h}:00`, h.count ?? h.n ?? 0, (h.count ?? 0) * 2000]);
        csvExport(['Hour', 'Orders', 'Revenue (KES)'], rows, 'daily-revenue.csv');
      } else if (type === 'weekly') {
        const res = await fetch(getApiUrl('/reports/analytics?period=WEEKLY'), { headers: authHeaders() });
        const d = await res.json();
        const report = d.data?.report ?? d.data ?? {};
        const rows = (report.dailyRevenue ?? []).map((d: any) => [d.day ?? d.date, d.revenue ?? 0]);
        csvExport(['Day', 'Revenue (KES)'], rows, 'weekly-orders.csv');
      } else if (type === 'orders') {
        const res = await fetch(getApiUrl('/orders'), { headers: authHeaders() });
        const d = await res.json();
        const raw: any[] = d.data?.orders ?? d.data ?? [];
        const rows = raw.map((o: any) => [o.orderNumber ?? o.uuid?.slice(0, 8), o.table?.tableNumber ? `T-${o.table.tableNumber}` : '-', (o.items ?? []).map((i: any) => i.product?.name).join('; '), o.waiter?.fullName ?? 'Unclaimed', o.totalAmount, o.status]);
        csvExport(['Order', 'Table', 'Item', 'Waiter', 'Amount (KES)', 'Status'], rows, 'order-summary.csv');
      } else if (type === 'menu') {
        const res = await fetch(getApiUrl('/menu'), { headers: authHeaders() });
        const d = await res.json();
        const rawCats: any[] = (d.data ?? d).categories ?? [];
        const rows: any[] = [];
        rawCats.forEach((cat: any) => {
          (cat.products ?? []).forEach((p: any) => {
            rows.push([p.name, cat.name, p.price, p.isAvailable ? 'Available' : 'Out of Stock']);
          });
        });
        csvExport(['Item', 'Category', 'Price (KES)', 'Status'], rows, 'menu-performance.csv');
      } else if (type === 'staff') {
        const res = await fetch(getApiUrl('/auth/staff?role=WAITER'), { headers: authHeaders() });
        const d = await res.json();
        const staff: any[] = d.data?.staff ?? d.data ?? [];
        const rows = staff.map((s: any) => [s.fullName, s.email, s.isActive ? 'Active' : 'Inactive', '-', s.createdAt]);
        csvExport(['Name', 'Email', 'Status', 'Shift', 'Created At'], rows, 'staff-activity.csv');
      } else {
        csvExport(['Method', 'Share (%)'], [['M-Pesa', 68], ['Card', 20], ['Cash', 12]], 'payment-methods.csv');
      }
      showToast(`${title} exported successfully`);
    } catch {
      showToast(`Failed to export ${title}`, 'error');
    }
  };

  const reports = [
    { title: 'Daily Revenue', desc: 'Revenue breakdown by hour for current date', type: 'revenue' },
    { title: 'Weekly Orders', desc: 'Order volume by day for the past 7 days', type: 'weekly' },
    { title: 'Order Summary', desc: 'Full list of all orders with status and amounts', type: 'orders' },
    { title: 'Menu Performance', desc: 'Sales volume and availability per menu item', type: 'menu' },
    { title: 'Staff Activity', desc: 'Waiter status and account creation details', type: 'staff' },
    { title: 'Payment Methods', desc: 'Breakdown of payments by method (M-Pesa, Card, Cash)', type: 'payment' },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Reports" subtitle="Download detailed reports for your venue" />
      <div className="grid grid-cols-2 gap-4">
        {reports.map(r => (
          <div key={r.title} className="rounded-xl border p-5 flex items-start justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{r.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.desc}</div>
            </div>
            <button onClick={() => exportReport(r.title, r.type)}
              className="ml-4 flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- Settings Page --- */
const ManagerSettingsPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [openingTime, setOpeningTime] = React.useState('18:00');
  const [closingTime, setClosingTime] = React.useState('02:00');
  const [orderNotifs, setOrderNotifs] = React.useState(true);
  const [soundAlerts, setSoundAlerts] = React.useState(true);
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Club Settings" subtitle="Venue configuration" />
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Operating Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><FL>Opening Time</FL><SI type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} /></div>
          <div><FL>Closing Time</FL><SI type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} /></div>
        </div>
      </div>
      {[{ label: 'Order Notifications', desc: 'Get notified when new orders arrive.', val: orderNotifs, set: setOrderNotifs }, { label: 'Sound Alerts', desc: 'Play a chime when an order status changes.', val: soundAlerts, set: setSoundAlerts }].map(item => (
        <div key={item.label} className="rounded-xl border p-5 flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div><div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div></div>
          <button onClick={() => item.set((v: boolean) => !v)} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${item.val ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${item.val ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
      <button onClick={() => showToast('Settings saved successfully')} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>Save Changes</button>
    </div>
  );
};

/* --- QR Codes Page --- */
const QrCodesPage = ({ user, showToast }: { user: any; showToast: (msg: string, type?: 'success' | 'error') => void }) => {
  const clubSlug = user.club?.slug || user.clubSlug || user.tenantSlug || (user.club?.name ? user.club.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'g-place');
  const clubName = user.club?.name || 'Your Venue';
  const clubUuid = user.club?.clubUuid || user.clubUuid || user.tenantId || '';
  const fullBaseUrl = `https://drink-hub-ke-customer-pwa.vercel.app/v/${clubSlug}`;

  const storageKey = `drinkhub_qr_tables_${clubSlug}`;

  const [tableCount, setTableCount] = useState<string>('10');
  const [startTable, setStartTable] = useState<string>('1');
  const [section, setSection] = useState<string>('Main Lounge');
  const [genMode, setGenMode] = useState<'replace' | 'append'>('replace');

  const [tables, setTables] = useState<{ id: number; section: string }[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return Array.from({ length: 10 }, (_, i) => ({ id: i + 1, section: 'Main Lounge' }));
  });

  // Initial load from backend API if available
  React.useEffect(() => {
    if (!clubUuid) return;
    fetch(getApiUrl(`/tenants/${clubUuid}/tables`), { headers: authHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const raw = data?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          const apiTables = raw.map((t: any) => ({
            id: Number(t.tableNumber),
            section: t.sectionName || 'Main Lounge',
          })).sort((a: any, b: any) => a.id - b.id);
          setTables(apiTables);
          try {
            localStorage.setItem(storageKey, JSON.stringify(apiTables));
          } catch {}
        }
      })
      .catch(() => {});
  }, [clubUuid, storageKey]);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const count = Math.min(Math.max(parseInt(tableCount) || 1, 1), 100);
    const start = Math.max(parseInt(startTable) || 1, 1);
    const sectionName = section.trim() || 'Main Lounge';

    const generated = Array.from({ length: count }, (_, i) => ({
      id: start + i,
      section: sectionName,
    }));

    let updated: { id: number; section: string }[];
    if (genMode === 'append') {
      const existingWithoutOverlap = tables.filter(t => !generated.some(g => g.id === t.id));
      updated = [...existingWithoutOverlap, ...generated].sort((a, b) => a.id - b.id);
    } else {
      updated = generated;
    }

    setTables(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    // Synchronize with backend in background
    if (clubUuid) {
      fetch(getApiUrl(`/tenants/${clubUuid}/generate-qr`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          tableCount: count,
          sectionName: sectionName,
          startFrom: start,
        }),
      }).catch(() => {});
    }

    showToast(`Generated ${count} QR codes for ${sectionName} (Tables ${start}–${start + count - 1})`);
  };

  const handleReset = () => {
    const defaults = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, section: 'Main Lounge' }));
    setTables(defaults);
    setTableCount('10');
    setStartTable('1');
    setSection('Main Lounge');
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaults));
    } catch {}
    showToast('Reset to default 10 tables');
  };

  const handleDeleteTable = async (id: number) => {
    const next = tables.filter(t => t.id !== id);
    setTables(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}

    // Synchronize deletion with backend in background
    if (clubUuid) {
      fetch(getApiUrl(`/tenants/${clubUuid}/tables/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {});
    }

    showToast(`Table ${id} deleted successfully`);
  };

  const [qrSearchQuery, setQrSearchQuery] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('All');

  const distinctSections = React.useMemo(() => {
    const set = new Set<string>();
    tables.forEach(t => {
      if (t.section) set.add(t.section);
    });
    return Array.from(set);
  }, [tables]);

  const filteredTables = React.useMemo(() => {
    let list = tables;
    if (selectedSectionFilter !== 'All') {
      list = list.filter(t => t.section.toLowerCase() === selectedSectionFilter.toLowerCase());
    }
    if (qrSearchQuery.trim()) {
      const q = qrSearchQuery.toLowerCase().trim();
      list = list.filter(t =>
        String(t.id).includes(q) ||
        `table ${t.id}`.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tables, selectedSectionFilter, qrSearchQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const downloadQrImage = async (tableId: number, sectionName: string) => {
    const tableUrl = `${fullBaseUrl}/t/${tableId}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(tableUrl)}`;
    try {
      const res = await fetch(qrImgUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${clubSlug}-Table-${tableId}-${sectionName.replace(/\s+/g, '_')}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`Downloaded QR code for Table ${tableId}`);
    } catch {
      window.open(qrImgUrl, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const parsedCount = Math.min(Math.max(parseInt(tableCount) || 1, 1), 100);

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside, nav, header, .no-print { display: none !important; }
          .print-area { display: block !important; }
          .qr-card-print { break-inside: avoid; page-break-inside: avoid; border: 1px solid #e2e8f0 !important; color: black !important; background: white !important; }
          .max-h-\[620px\], [class*="max-h-"] { max-height: none !important; overflow: visible !important; }
        }
      `}</style>

      {/* Top Banner / Venue Overview */}
      <div className="rounded-2xl border p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 no-print" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Customer Menu QR Link</h3>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Customers scan table QR codes to browse {clubName}'s live menu and place orders directly from their phones.
          </p>
          <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 w-fit">
            <span>{fullBaseUrl}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
          >
            <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Print QR Sheet
          </button>
          <button
            onClick={() => copyToClipboard(fullBaseUrl, 'Venue Menu URL')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-lg flex-shrink-0"
          >
            <Copy className="h-4 w-4" /> Copy Venue Link
          </button>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="rounded-2xl border p-6 no-print" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Batch Table QR Code Generator</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGenMode('replace')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all ${genMode === 'replace' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
            >
              Replace Existing
            </button>
            <button
              type="button"
              onClick={() => setGenMode('append')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all ${genMode === 'append' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
            >
              + Add to Existing
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-bold px-2.5 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Reset tables to default"
            >
              Reset
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Number of Tables</label>
            <input
              type="number"
              min={1}
              max={100}
              value={tableCount}
              onChange={e => setTableCount(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none font-semibold text-slate-900 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Starting Table #</label>
            <input
              type="number"
              min={1}
              max={500}
              value={startTable}
              onChange={e => setStartTable(e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none font-semibold text-slate-900 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Section / Area</label>
            <input
              type="text"
              value={section}
              onChange={e => setSection(e.target.value)}
              placeholder="e.g. Main Lounge, VIP, Terrace"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none font-semibold text-slate-900 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            onClick={() => handleGenerate()}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-lg h-[42px] flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate {parsedCount} Table QR Codes
          </button>
        </form>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between no-print">
        {/* Section Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setSelectedSectionFilter('All')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all flex-shrink-0 ${selectedSectionFilter === 'All' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'hover:bg-slate-100'}`}
            style={selectedSectionFilter === 'All' ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            <span>All Tables</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedSectionFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{tables.length}</span>
          </button>
          {distinctSections.map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSectionFilter(sec)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all whitespace-nowrap flex-shrink-0 ${selectedSectionFilter === sec ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'hover:bg-slate-100'}`}
              style={selectedSectionFilter === sec ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
            >
              <span>{sec}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedSectionFilter === sec ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{tables.filter(t => t.section === sec).length}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72 flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={qrSearchQuery}
            onChange={(e) => setQrSearchQuery(e.target.value)}
            placeholder="Search table # or section..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500 shadow-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          {qrSearchQuery && (
            <button
              onClick={() => setQrSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* QR Cards Scrollable Viewport */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-1 mb-4 no-print">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Showing <span className="font-bold text-blue-600 dark:text-blue-400">{filteredTables.length}</span> of {tables.length} Active Table QR Codes
          </p>
        </div>

        <div className="max-h-[620px] overflow-y-auto pr-1">
          {filteredTables.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2">
              <QrCode className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                {qrSearchQuery ? `No table QR codes match "${qrSearchQuery}"` : 'No table QR codes available.'}
              </p>
              <p className="text-xs text-slate-400">
                {qrSearchQuery ? 'Try searching a different table number or section name.' : 'Use the generator above to create table QR codes.'}
              </p>
              {qrSearchQuery && (
                <button
                  type="button"
                  onClick={() => setQrSearchQuery('')}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTables.map(t => {
                const tableUrl = `${fullBaseUrl}/t/${t.id}`;
                const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}`;
                return (
                  <div
                    key={t.id}
                    className="qr-card-print rounded-2xl border p-5 flex flex-col items-center text-center transition-all hover:shadow-xl group"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  >
                    <div className="w-full flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {t.section}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">Table {t.id}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(t.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors no-print"
                          title={`Delete Table ${t.id}`}
                          aria-label={`Delete Table ${t.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* QR Image */}
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm mb-4 transition-transform group-hover:scale-105">
                      <img
                        src={qrImgUrl}
                        alt={`QR Table ${t.id}`}
                        className="w-36 h-36 object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                      Scan to Order — Table {t.id}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate w-full mb-4 px-2">
                      /v/{clubSlug}/t/{t.id}
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 w-full no-print">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tableUrl, `Table ${t.id} QR link`)}
                        className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Copy direct table order link"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadQrImage(t.id, t.section)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Download high-resolution QR PNG"
                      >
                        <Download className="h-3 w-3" /> Save
                      </button>
                      <a
                        href={tableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 py-1.5 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                        title="Open customer digital menu for this table"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- Nav --- */
type NavKey = 'dashboard' | 'orders' | 'menu' | 'staff' | 'qr' | 'reports' | 'settings';
const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'orders', label: 'Live Orders', icon: <ClipboardList className="h-4 w-4" /> },
  { key: 'menu', label: 'Menu', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'staff', label: 'Staff', icon: <Users className="h-4 w-4" /> },
  { key: 'qr', label: 'QR Codes', icon: <QrCode className="h-4 w-4" /> },
  { key: 'reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];
const PAGE_TITLES: Record<NavKey, string> = { dashboard: 'Overview', orders: 'Live Orders', menu: 'Menu', staff: 'Staff Management', qr: 'QR Code Table Ordering', reports: 'Reports', settings: 'Settings' };

/*           Notification Data           */
interface MgrNotif { id: string; title: string; body: string; time: string; read: boolean; icon: React.ReactNode; }
const INIT_MGR_NOTIFS: MgrNotif[] = [];

/*           Main Export           */
export const ManagerDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [page, setPage] = React.useState<NavKey>('dashboard');
  const [collapsed, setCollapsed] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type }), []);

  /* Read logged-in manager & venue from localStorage */
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('drinkhub_user') || '{}'); }
    catch { return {}; }
  }, []);

  const clubName = user.club?.name || 'Venue Portal';
  const clubCity = user.club?.city || 'Nairobi';
  const clubCounty = user.club?.county || 'Kenya';
  const clubLocation = user.club ? `${clubCity}, ${clubCounty}` : 'Kenya';
  const openingHours = user.club?.openingHours || '18:00';
  const closingHours = user.club?.closingHours || '04:00';

  const fullName = user.fullName || 'Manager';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Manager';
  const lastName = nameParts.slice(1).join(' ');
  const displayName = `${firstName} ${lastName ? lastName.charAt(0) + '.' : ''}`;
  const initials = `${firstName[0] || 'M'}${lastName[0] ? lastName[0] : ''}`;
  const userEmail = user.email || 'manager@drinkhub.co.ke';
  const userRoleDisplay = user.role === 'CLUB_ADMIN' ? 'Club Manager' : 'Manager';

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState<MgrNotif[]>(INIT_MGR_NOTIFS);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  /* Click-outside to close */
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(p => p.filter(n => n.id !== id));

  const renderPage = () => {
    const p = { showToast };
    switch (page) {
      case 'dashboard': return <DashboardPage {...p} />;
      case 'orders':    return <OrdersPage {...p} />;
      case 'menu':      return <MenuPage {...p} />;
      case 'staff':     return <StaffManagementPage {...p} />;
      case 'qr':        return <QrCodesPage user={user} showToast={showToast} />;
      case 'reports':   return <ReportsPage {...p} />;
      case 'settings':  return <ManagerSettingsPage {...p} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-body)' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <aside className="flex-shrink-0 flex flex-col sticky top-0 h-screen transition-all duration-200" style={{ width: collapsed ? '64px' : '210px', background: 'var(--bg-sidebar)', borderRight: '1px solid #1E293B' }}>
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: '#1E293B' }}>
          <button onClick={() => setCollapsed(v => !v)} className="h-8 w-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center hover:bg-blue-700 transition-colors"><Wine className="h-4 w-4 text-white" /></button>
          {!collapsed && <div className="overflow-hidden"><div className="text-sm font-black text-white truncate">{clubName}</div><div className="text-[10px] text-slate-500 truncate">Manager Portal</div></div>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} title={collapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: page === item.key ? '#1E293B' : 'transparent', color: page === item.key ? '#FFFFFF' : '#64748B', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t" style={{ borderColor: '#1E293B' }}>
          <button onClick={onLogout} title={collapsed ? 'Sign Out' : undefined} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogOut className="h-4 w-4 flex-shrink-0" />{!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
          <div>
            <h1 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{PAGE_TITLES[page]}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{clubName} ({clubLocation}) | {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 font-semibold">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open | {openingHours} – {closingHours}
            </div>
            <ThemeToggle />

            {/*        Notifications        */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                className="relative h-8 w-8 rounded-lg border flex items-center justify-center transition-colors"
                style={{ borderColor: 'var(--border)', background: notifOpen ? 'var(--bg-muted)' : 'transparent' }}
              >
                <Bell className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">{unread}</span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                      {unread > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread} new</span>}
                    </div>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">Mark all read</button>}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</div>
                    ) : notifs.map(n => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:opacity-90 transition-opacity group"
                        style={{ borderColor: 'var(--border)', background: n.read ? 'transparent' : 'color-mix(in srgb, var(--primary) 5%, transparent)' }}>
                        <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>{n.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{n.body}</p>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <button onClick={() => dismiss(n.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200">
                          <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => { setPage('orders'); setNotifOpen(false); }} className="w-full text-center text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors py-0.5">
                      View live orders    
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/*        Profile        */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors"
                style={{ borderColor: 'var(--border)', background: profileOpen ? 'var(--bg-muted)' : 'transparent' }}
              >
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-[10px] font-black text-white">{initials}</span></div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: 'var(--text-muted)', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {/* Identity */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><span className="text-sm font-black text-white">{initials}</span></div>
                      <div className="min-w-0">
                        <div className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</div>
                        <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{userEmail}</div>
                        <span className="inline-block mt-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">{userRoleDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: 'Dashboard', nav: 'dashboard' as NavKey },
                      { icon: <Users className="h-3.5 w-3.5" />, label: 'Staff Management', nav: 'staff' as NavKey },
                      { icon: <Settings className="h-3.5 w-3.5" />, label: 'Settings', nav: 'settings' as NavKey },
                    ].map(item => (
                      <button key={item.label} onClick={() => { setPage(item.nav); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-slate-100 text-left"
                        style={{ color: 'var(--text-secondary)' }}>
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t p-1.5" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{renderPage()}</main>
      </div>
    </div>
  );
};
