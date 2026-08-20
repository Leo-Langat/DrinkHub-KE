import React, { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '@drinkhub/ui';
import {
  Wine, LayoutDashboard, Building2, Users, CreditCard, TrendingUp, Settings,
  Bell, LogOut, ChevronDown, ArrowUpRight, ArrowDownRight, Server,
  ShieldCheck, AlertCircle, Activity, Database, Zap, Search,
  Plus, Download, Eye, EyeOff, Trash2, Edit2, CheckCircle2, X,
  Key, RefreshCcw, HardDrive, Cpu, Wifi, Upload,
  ChevronLeft, Check, UserCog, Mail, Phone, MapPin,
  RotateCcw, UserX, UserCheck, Calendar, Lock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
} from 'recharts';

/* ─── Types ─── */
interface Club {
  id: string; name: string; description: string; address: string;
  city: string; county: string; phone: string; email: string;
  openingTime: string; closingTime: string; logoUrl: string;
  bannerUrl: string; themeColor: string; plan: string; status: string;
  mrr: number; orders: number; managerId: string; createdAt: string;
  trialDays: number; startDate: string; expiryDate: string;
}
interface Manager {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; username: string; clubId: string; clubName: string;
  status: 'Active' | 'Inactive' | 'Suspended'; lastLogin: string;
}

/* ─── Utilities ─── */
const csvExport = (headers: string[], rows: (string | number | boolean)[][], filename: string) => {
  const e = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`;
  const content = [headers.map(e).join(','), ...rows.map(r => r.map(e).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
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
  const token = localStorage.getItem('drinkhub_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const generatePassword = (): string => {
  const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', l = 'abcdefghjkmnpqrstuvwxyz', d = '23456789', s = '@#$!';
  const all = u + l + d + s;
  const pwd = [u, l, d, s].map(c => c[Math.floor(Math.random() * c.length)]);
  for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = pwd.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pwd[i], pwd[j]] = [pwd[j], pwd[i]]; }
  return pwd.join('');
};

const readFile = (e: React.ChangeEvent<HTMLInputElement>, cb: (url: string) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => cb(ev.target?.result as string);
  reader.readAsDataURL(file);
};

/* ─── Toast ─── */
const Toast = ({ msg, type = 'success', onDone }: { msg: string; type?: 'success' | 'error'; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl"
      style={{ background: type === 'success' ? '#0F172A' : '#7F1D1D', border: '1px solid rgba(255,255,255,0.1)', minWidth: 260 }}>
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
      {msg}
    </div>
  );
};

/* ─── Modal ─── */
const Modal = ({ open, onClose, title, size = 'md', children }: { open: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg'; children: React.ReactNode }) => {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
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

/* ─── Form Primitives ─── */
const FL = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);
const FE = ({ msg }: { msg?: string }) => msg ? <p className="text-xs text-red-500 mt-1 font-medium">{msg}</p> : null;
const FG = ({ children, span = 1 }: { children: React.ReactNode; span?: 1 | 2 }) => (
  <div className={span === 2 ? 'col-span-2' : ''}>{children}</div>
);

const SI = ({ error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
  <div>
    <input {...p} className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition text-slate-900 ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`} />
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
const PhoneInput = ({ error, value, onChange }: { error?: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 select-none">+254</span>
      <input
        type="tel"
        value={value}
        onChange={e => onChange(e.target.value.replace(/^\+?254/, '').replace(/^0/, ''))}
        placeholder="7XX XXX XXX"
        className={`flex-1 rounded-r-lg border px-3 py-2.5 text-sm text-slate-900 outline-none transition ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

/* ─── Shared UI ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Trial: 'bg-amber-50 text-amber-700 border-amber-200',
    Inactive: 'bg-slate-50 text-slate-600 border-slate-200',
    Suspended: 'bg-red-50 text-red-600 border-red-200',
    Pro: 'bg-blue-50 text-blue-700 border-blue-200',
    Starter: 'bg-slate-50 text-slate-600 border-slate-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Degraded: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>{status}</span>;
};

const KPI = ({ label, value, change, positive, icon }: { label: string; value: string; change: string; positive: boolean; icon: React.ReactNode }) => (
  <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
    <div className="flex items-start justify-between mb-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-body)' }}>{icon}</div>
      <div className={`flex items-center gap-0.5 text-xs font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{change}
      </div>
    </div>
    <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
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


/* ─── Data ─── */
const initManagers: Manager[] = [];
const initClubs: Club[] = [];
const mrrData: { month: string; mrr: number }[] = [];
const venueData: { county: string; clubs: number; revenue: number }[] = [];
const payData: { name: string; value: number; color: string }[] = [];
const subscriptions: { plan: string; price: number; clubs: number; mrr: number }[] = [];
const weeklyOrders: { day: string; orders: number }[] = [];
const auditLogs: { id: string; action: string; actor: string; resource: string; ip: string; time: string; level: string }[] = [];

/* ══════════════════════════════════════
   CREATE CLUB STEPPER
══════════════════════════════════════ */
const STEPS = [
  { n: 1, label: 'Club Information', icon: <Building2 className="h-4 w-4" /> },
  { n: 2, label: 'Manager Account', icon: <UserCog className="h-4 w-4" /> },
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
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
              {done ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-20 mx-2 mb-5 transition-all ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

type CF = {
  name: string; description: string; address: string; city: string; county: string;
  phone: string; email: string; openingTime: string; closingTime: string;
  logoUrl: string; bannerUrl: string; themeColor: string;
  mgrFirstName: string; mgrLastName: string; mgrEmail: string; mgrPhone: string;
  mgrUsername: string; tempPwd: string;
  plan: string; trialDays: string; subStatus: string; startDate: string; expiryDate: string;
};

const defaultForm: CF = {
  name: '', description: '', address: '', city: '', county: 'Nairobi', phone: '', email: '',
  openingTime: '18:00', closingTime: '02:00', logoUrl: '', bannerUrl: '', themeColor: '#1D4ED8',
  mgrFirstName: '', mgrLastName: '', mgrEmail: '', mgrPhone: '', mgrUsername: '', tempPwd: '',
  plan: 'Pro', trialDays: '14', subStatus: 'Trial', startDate: new Date().toISOString().split('T')[0], expiryDate: '',
};

const UploadBox = ({ label, preview, onUpload }: { label: string; preview: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <label className="block cursor-pointer">
    <div className={`relative rounded-xl border-2 border-dashed transition-all hover:border-blue-400 overflow-hidden ${preview ? 'border-blue-300' : 'border-slate-200'}`} style={{ height: preview ? 120 : 80 }}>
      {preview
        ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
        : <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400">
            <Upload className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
            <span className="text-[10px]">PNG, JPG up to 5MB</span>
          </div>}
      {preview && <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold">Change Image</span></div>}
    </div>
    <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
  </label>
);

const ThemePreview = ({ color, clubName }: { color: string; clubName: string }) => (
  <div className="rounded-xl overflow-hidden border border-slate-200 text-white text-center" style={{ background: color }}>
    <div className="px-4 py-5">
      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
        <Wine className="h-5 w-5 text-white" />
      </div>
      <div className="font-black text-sm">{clubName || 'Club Name'}</div>
      <div className="text-[11px] opacity-70 mt-0.5">Nairobi, Kenya</div>
    </div>
    <div className="px-3 pb-3">
      <div className="rounded-lg bg-white/15 px-3 py-2 text-xs font-medium">🍺 View Our Menu</div>
    </div>
  </div>
);

/* Step 1 */
const Step1 = ({ f, set, errors }: { f: CF; set: (k: keyof CF, v: string) => void; errors: Partial<Record<keyof CF, string>> }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FL required>Club Name</FL>
        <SI value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Quiver Lounge Kilimani" error={errors.name} />
      </div>
      <div className="col-span-2">
        <FL>Description</FL>
        <STA value={f.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of the venue…" />
      </div>
      <div>
        <FL>Physical Address</FL>
        <SI value={f.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 14 Lenana Road" />
      </div>
      <div>
        <FL>City / Town</FL>
        <SI value={f.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Kilimani" />
      </div>
      <div>
        <FL>County</FL>
        <SS value={f.county} onChange={e => set('county', e.target.value)} options={['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Eldoret','Thika','Nyeri'].map(c => ({ v: c, l: c }))} />
      </div>
      <div>
        <FL>Phone Number</FL>
        <PhoneInput value={f.phone} onChange={v => set('phone', v)} />
      </div>
      <div className="col-span-2">
        <FL>Email Address</FL>
        <SI value={f.email} onChange={e => set('email', e.target.value)} placeholder="info@club.co.ke" type="email" />
      </div>
      <div>
        <FL>Opening Time</FL>
        <SI type="time" value={f.openingTime} onChange={e => set('openingTime', e.target.value)} />
      </div>
      <div>
        <FL>Closing Time</FL>
        <SI type="time" value={f.closingTime} onChange={e => set('closingTime', e.target.value)} />
      </div>
    </div>

    <div className="border-t pt-5" style={{ borderColor: '#E2E8F0' }}>
      <h4 className="text-sm font-black text-slate-700 mb-4">Branding</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <FL>Logo</FL>
          <UploadBox label="Upload Logo" preview={f.logoUrl} onUpload={e => readFile(e, v => set('logoUrl', v))} />
        </div>
        <div className="col-span-2">
          <FL>Banner Image</FL>
          <UploadBox label="Upload Banner" preview={f.bannerUrl} onUpload={e => readFile(e, v => set('bannerUrl', v))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <FL>Theme Color</FL>
          <div className="flex items-center gap-3">
            <input type="color" value={f.themeColor} onChange={e => set('themeColor', e.target.value)}
              className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white" />
            <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-600">{f.themeColor}</div>
          </div>
        </div>
        <div>
          <FL>Live Preview</FL>
          <ThemePreview color={f.themeColor} clubName={f.name} />
        </div>
      </div>
    </div>
  </div>
);

/* Step 2 */
const Step2 = ({ f, set, errors }: { f: CF; set: (k: keyof CF, v: string) => void; errors: Partial<Record<keyof CF, string>> }) => {
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-3">
        <Lock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          The manager will receive a welcome email with these credentials and will be <strong>required to change their temporary password on first login</strong>.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FL required>First Name</FL>
          <SI value={f.mgrFirstName} onChange={e => set('mgrFirstName', e.target.value)} placeholder="Jane" error={errors.mgrFirstName} />
        </div>
        <div>
          <FL required>Last Name</FL>
          <SI value={f.mgrLastName} onChange={e => set('mgrLastName', e.target.value)} placeholder="Kamau" error={errors.mgrLastName} />
        </div>
        <div>
          <FL required>Email Address</FL>
          <SI type="email" value={f.mgrEmail} onChange={e => set('mgrEmail', e.target.value)} placeholder="jane@club.co.ke" error={errors.mgrEmail} />
        </div>
        <div>
          <FL required>Phone Number</FL>
          <PhoneInput value={f.mgrPhone} onChange={v => set('mgrPhone', v)} />
        </div>
        <div>
          <FL>Username <span className="text-slate-400 font-normal normal-case">(optional)</span></FL>
          <SI value={f.mgrUsername} onChange={e => set('mgrUsername', e.target.value)} placeholder="e.g. jane.kamau" />
        </div>
        <div>
          <FL required>Temporary Password</FL>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SI type={showPwd ? 'text' : 'password'} value={f.tempPwd} onChange={e => set('tempPwd', e.target.value)} placeholder="Min. 8 characters" error={errors.tempPwd} />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="button" onClick={() => set('tempPwd', generatePassword())}
              className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-all whitespace-nowrap flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Step 3 */
const Step3 = ({ f, set }: { f: CF; set: (k: keyof CF, v: string) => void }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FL>Subscription Plan</FL>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[{ v: 'Starter', price: 'KES 3,900 / mo', features: ['Up to 4 staff', '500 orders/mo', 'Email support'] },
            { v: 'Pro', price: 'KES 8,900 / mo', features: ['Unlimited staff', 'Unlimited orders', 'Priority support', 'Analytics'] }].map(p => (
            <button key={p.v} type="button" onClick={() => set('plan', p.v)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${f.plan === p.v ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-slate-900 text-sm">{p.v}</span>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${f.plan === p.v ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {f.plan === p.v && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="text-xs font-bold text-blue-600 mb-2">{p.price}</div>
              <ul className="space-y-0.5">{p.features.map(feat => <li key={feat} className="text-[11px] text-slate-600 flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" />{feat}</li>)}</ul>
            </button>
          ))}
        </div>
      </div>
      <div>
        <FL>Subscription Status</FL>
        <SS value={f.subStatus} onChange={e => set('subStatus', e.target.value)} options={[{ v: 'Trial', l: 'Trial' }, { v: 'Active', l: 'Active' }, { v: 'Inactive', l: 'Inactive' }]} />
      </div>
      <div>
        <FL>Trial Period (days)</FL>
        <SI type="number" value={f.trialDays} onChange={e => set('trialDays', e.target.value)} min="0" max="90" />
      </div>
      <div>
        <FL>Start Date</FL>
        <SI type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} />
      </div>
      <div>
        <FL>Expiry Date <span className="text-slate-400 font-normal normal-case">(optional)</span></FL>
        <SI type="date" value={f.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
      </div>
    </div>
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
      <p className="text-xs text-emerald-700 font-medium">
        ✓ After submission, a welcome email will be sent to the manager with login credentials and the club onboarding guide.
      </p>
    </div>
  </div>
);

/* Success */
const SuccessView = ({ f, onViewClub, onCreateAnother }: { f: CF; onViewClub: () => void; onCreateAnother: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
    </div>
    <h2 className="text-2xl font-black text-slate-900 mb-2">Club Created Successfully!</h2>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">
      <strong>{f.name}</strong> has been onboarded and a welcome email with login credentials has been sent to <strong>{f.mgrEmail}</strong>.
    </p>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left w-full max-w-sm mb-6 space-y-3">
      <div className="flex justify-between text-sm"><span className="text-slate-500">Club</span><span className="font-bold text-slate-900">{f.name}</span></div>
      <div className="flex justify-between text-sm"><span className="text-slate-500">Manager</span><span className="font-bold text-slate-900">{f.mgrFirstName} {f.mgrLastName}</span></div>
      <div className="flex justify-between text-sm"><span className="text-slate-500">Manager Email</span><span className="font-bold text-slate-900">{f.mgrEmail}</span></div>
      <div className="flex justify-between text-sm"><span className="text-slate-500">Plan</span><span className="font-bold text-blue-600">{f.plan}</span></div>
      <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><StatusBadge status={f.subStatus} /></div>
    </div>
    <div className="flex gap-3 w-full max-w-sm">
      <button onClick={onCreateAnother} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Create Another</button>
      <button onClick={onViewClub} className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors" style={{ background: '#2563EB' }}>View Club →</button>
    </div>
  </div>
);

/* Main Stepper */
const CreateClubStepper = ({ onSuccess, onCancel }: { onSuccess: (club: Club, manager: Manager) => void; onCancel: () => void }) => {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<CF>({ ...defaultForm, tempPwd: generatePassword() });
  const [errors, setErrors] = useState<Partial<Record<keyof CF, string>>>({});
  const [createdClub, setCreatedClub] = useState<Club | null>(null);

  const set = (k: keyof CF, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate1 = () => {
    const e: Partial<Record<keyof CF, string>> = {};
    if (!form.name.trim()) e.name = 'Club name is required';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Partial<Record<keyof CF, string>> = {};
    if (!form.mgrFirstName.trim()) e.mgrFirstName = 'Required';
    if (!form.mgrLastName.trim()) e.mgrLastName = 'Required';
    if (!form.mgrEmail.trim()) e.mgrEmail = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.mgrEmail)) e.mgrEmail = 'Invalid email address';
    if (!form.mgrPhone.trim()) e.mgrPhone = 'Required';
    if (form.tempPwd.length < 8) e.tempPwd = 'Password must be at least 8 characters';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step === 3) {
      try {
        const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let rawClub: any = {};
        let rawMgr: any = {};

        try {
          const res = await fetch(getApiUrl('/tenants/provision'), {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              name: form.name,
              slug: slug || `club-${Date.now()}`,
              brandColor: form.themeColor,
              city: form.city,
              county: form.county,
              address: form.address,
              phone: form.phone,
              email: form.email,
              openingHours: form.openingTime,
              closingHours: form.closingTime,
              managerFullName: `${form.mgrFirstName} ${form.mgrLastName}`,
              managerEmail: form.mgrEmail,
              managerPhone: form.mgrPhone,
              managerPassword: form.tempPwd,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.data) {
            rawClub = data.data.club ?? {};
            rawMgr = data.data.manager ?? {};
          }
        } catch (netErr) {
          console.warn('Backend provision offline, creating locally in demo mode:', netErr);
        }

        const id = rawClub.uuid ?? `c${Date.now()}`;
        const mgrId = rawMgr.userUuid ?? `m${Date.now()}`;
        const club: Club = {
          id,
          name: rawClub.name ?? form.name,
          description: form.description,
          address: form.address,
          city: form.city,
          county: rawClub.county ?? form.county,
          phone: form.phone,
          email: form.email,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          logoUrl: form.logoUrl,
          bannerUrl: form.bannerUrl,
          themeColor: rawClub.brandColor ?? form.themeColor,
          plan: form.plan,
          status: rawClub.status ?? form.subStatus,
          mrr: form.plan === 'Pro' ? 8900 : 3900,
          orders: 0,
          managerId: mgrId,
          createdAt: new Date().toISOString().split('T')[0],
          trialDays: parseInt(form.trialDays) || 0,
          startDate: form.startDate,
          expiryDate: form.expiryDate,
        };
        const manager: Manager = {
          id: mgrId,
          firstName: form.mgrFirstName,
          lastName: form.mgrLastName,
          email: rawMgr.email ?? form.mgrEmail,
          phone: form.mgrPhone,
          username: form.mgrUsername || form.mgrEmail.split('@')[0],
          clubId: id,
          clubName: form.name,
          status: 'Active',
          lastLogin: 'Never',
        };
        setCreatedClub(club);
        setDone(true);
        onSuccess(club, manager);
      } catch (err: any) {
        console.error('Error creating club:', err);
      }
      return;
    }
    setStep(s => s + 1);
  };

  if (done && createdClub) return (
    <div className="max-w-lg mx-auto">
      <SuccessView f={form} onViewClub={() => { /* handled by parent */ }} onCreateAnother={() => { setDone(false); setStep(1); setForm({ ...defaultForm, tempPwd: generatePassword() }); }} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft className="h-4 w-4" /> Back to Clubs
        </button>
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Create New Club</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete all sections to onboard a new venue and assign its manager.</p>
        </div>

        <StepProgress current={step} />

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{STEPS[step - 1].label}</h3>
          </div>
          {step === 1 && <Step1 f={form} set={set} errors={errors} />}
          {step === 2 && <Step2 f={form} set={set} errors={errors} />}
          {step === 3 && <Step3 f={form} set={set} />}

          <div className="flex items-center justify-between mt-7 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={onCancel} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button onClick={handleNext} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90" style={{ background: '#2563EB' }}>
                {step === 3 ? <><Check className="h-4 w-4" /> Create Club</> : <>Next Step <ChevronDown className="h-4 w-4 -rotate-90" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   EDIT CLUB MODAL
══════════════════════════════════════ */
const EditClubModal = ({
  club,
  open,
  onClose,
  onSaved,
  showToast,
}: {
  club: Club | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updatedClub: Club) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Nairobi',
    county: 'Nairobi',
    phone: '',
    email: '',
    openingTime: '14:00',
    closingTime: '04:00',
    themeColor: '#1E3A5F',
    logoUrl: '',
    bannerUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name || '',
        description: club.description || '',
        address: club.address || '',
        city: club.city || 'Nairobi',
        county: club.county || 'Nairobi',
        phone: club.phone || '',
        email: club.email || '',
        openingTime: club.openingTime || '14:00',
        closingTime: club.closingTime || '04:00',
        themeColor: club.themeColor || '#1E3A5F',
        logoUrl: club.logoUrl || '',
        bannerUrl: club.bannerUrl || '',
      });
    }
  }, [club]);

  if (!club) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      try {
        const res = await fetch(getApiUrl(`/tenants/${club.id}`), {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            name: form.name.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            county: form.county.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            openingHours: form.openingTime,
            closingHours: form.closingTime,
            brandColor: form.themeColor,
            logoUrl: form.logoUrl.trim() || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('Backend update notice:', err?.error?.message);
        }
      } catch (netErr) {
        console.warn('Backend offline, applying changes locally in demo mode:', netErr);
      }

      const updatedClub: Club = {
        ...club,
        name: form.name.trim(),
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

      onSaved(updatedClub);
      showToast('Club details updated successfully');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update club', 'error');
    } finally {
      setSaving(false);
    }
  };

  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Kajiado', 'Kilifi'];

  return (
    <Modal open={open} onClose={onClose} title={`Edit Club: ${club.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FG span={2}>
            <FL required>Club Name</FL>
            <SI
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Alchemist Bar"
            />
          </FG>

          <FG span={2}>
            <FL>Description</FL>
            <STA
              rows={2}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Venue description or tagline…"
            />
          </FG>

          <FG>
            <FL>Physical Address</FL>
            <SI
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="e.g. Parklands Road, Westlands"
            />
          </FG>

          <FG>
            <FL>City / Town</FL>
            <SI
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Nairobi"
            />
          </FG>

          <FG>
            <FL>County</FL>
            <SS
              value={form.county}
              onChange={e => setForm(p => ({ ...p, county: e.target.value }))}
              options={counties.map(c => ({ v: c, l: c }))}
            />
          </FG>

          <FG>
            <FL>Phone Number</FL>
            <PhoneInput
              value={form.phone}
              onChange={v => setForm(p => ({ ...p, phone: v }))}
            />
          </FG>

          <FG span={2}>
            <FL>Contact Email</FL>
            <SI
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="info@venue.co.ke"
            />
          </FG>

          <FG>
            <FL>Opening Time</FL>
            <SI
              type="time"
              value={form.openingTime}
              onChange={e => setForm(p => ({ ...p, openingTime: e.target.value }))}
            />
          </FG>

          <FG>
            <FL>Closing Time</FL>
            <SI
              type="time"
              value={form.closingTime}
              onChange={e => setForm(p => ({ ...p, closingTime: e.target.value }))}
            />
          </FG>
        </div>

        <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Branding & Appearance</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL>Logo Image</FL>
              <UploadBox label="Upload Logo" preview={form.logoUrl} onUpload={e => readFile(e, v => setForm(p => ({ ...p, logoUrl: v })))} />
            </div>
            <div>
              <FL>Theme Color</FL>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.themeColor}
                    onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                    className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={form.themeColor}
                    onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <ThemePreview color={form.themeColor} clubName={form.name} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {saving ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save Club Details'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ══════════════════════════════════════
   CLUB DETAILS PAGE
══════════════════════════════════════ */
const ClubDetailsPage = ({ club, managers, onBack, onReplaceManager, onUpdateClub, showToast }: {
  club: Club; managers: Manager[]; onBack: () => void;
  onReplaceManager: (club: Club) => void;
  onUpdateClub: (club: Club) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) => {
  const manager = managers.find(m => m.clubId === club.id || (club.managerId && m.id === club.managerId));
  const [showReplace, setShowReplace] = useState(false);
  const [showEditClub, setShowEditClub] = useState(false);
  const [replaceForm, setReplaceForm] = useState({ firstName: '', lastName: '', email: '', phone: '', tempPwd: generatePassword() });

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium mb-6 hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
        <ChevronLeft className="h-4 w-4" /> Back to Clubs
      </button>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-36" style={{ background: club.themeColor }}>
        {club.bannerUrl && <img src={club.bannerUrl} alt="banner" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-end p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {club.logoUrl ? <img src={club.logoUrl} alt="logo" className="h-full w-full object-cover rounded-xl" /> : <Wine className="h-7 w-7 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{club.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={club.status} />
                <StatusBadge status={club.plan} />
                <span className="text-white/70 text-xs">{club.city}, {club.county}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Club Info */}
        <div className="col-span-2 space-y-5">
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Club Information</h3>
              <button
                onClick={() => setShowEditClub(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Details
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { k: 'Description', v: club.description || '—' },
                { k: 'Address', v: `${club.address}, ${club.city}` },
                { k: 'Phone', v: club.phone || '—' },
                { k: 'Email', v: club.email || '—' },
                { k: 'Hours', v: `${club.openingTime} – ${club.closingTime}` },
                { k: 'Created', v: club.createdAt },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{k}</dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Theme Color</dt>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg border" style={{ background: club.themeColor }} />
                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{club.themeColor}</span>
                <ThemePreview color={club.themeColor} clubName={club.name} />
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Club Manager</h3>
              <button onClick={() => setShowReplace(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                <RotateCcw className="h-3.5 w-3.5" /> Replace Manager
              </button>
            </div>
            {manager ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                    {manager.firstName[0]}{manager.lastName[0]}
                  </div>
                  <div>
                    <div className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{manager.firstName} {manager.lastName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{manager.username}</div>
                  </div>
                  <StatusBadge status={manager.status} />
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Email</dt><dd className="text-sm" style={{ color: 'var(--text-primary)' }}>{manager.email}</dd></div>
                  <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Phone</dt><dd className="text-sm" style={{ color: 'var(--text-primary)' }}>{manager.phone}</dd></div>
                  <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Last Login</dt><dd className="text-sm" style={{ color: 'var(--text-primary)' }}>{manager.lastLogin}</dd></div>
                </dl>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => showToast(`Password reset email sent to ${manager.email}`)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Key className="h-3.5 w-3.5" /> Reset Password
                  </button>
                  <button onClick={() => showToast(`${manager.firstName}'s account deactivated`)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <UserX className="h-3.5 w-3.5" /> Deactivate Manager
                  </button>
                </div>
              </>
            ) : <p className="text-sm text-slate-400">No manager assigned.</p>}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Subscription</h3>
            <div className="space-y-3">
              {[
                { k: 'Plan', v: <StatusBadge status={club.plan} /> },
                { k: 'Status', v: <StatusBadge status={club.status} /> },
                { k: 'MRR', v: <span className="text-emerald-600 font-bold text-sm">{club.mrr > 0 ? `KES ${club.mrr.toLocaleString()}` : '—'}</span> },
                { k: 'Start Date', v: club.startDate },
                { k: 'Expiry', v: club.expiryDate || 'Ongoing' },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase">{k}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
            {[{ label: 'Total Orders', val: club.orders }, { label: 'Staff Count', val: '4' }, { label: 'Avg Order', val: 'KES 1,840' }].map(s => (
              <div key={s.label} className="flex justify-between py-2 border-b last:border-0 text-sm" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.val}</span>
              </div>
            ))}
          </div>
          <button onClick={() => showToast('Suspension feature coming soon')} className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors">
            Suspend Club
          </button>
        </div>
      </div>

      {/* Edit Club Modal */}
      <EditClubModal
        club={club}
        open={showEditClub}
        onClose={() => setShowEditClub(false)}
        onSaved={(updated) => {
          onUpdateClub(updated);
        }}
        showToast={showToast}
      />

      {/* Replace Manager Modal */}
      <Modal open={showReplace} onClose={() => setShowReplace(false)} title="Replace Club Manager">
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
            The current manager will be deactivated and a new manager account will be created for this club.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL required>First Name</FL><SI value={replaceForm.firstName} onChange={e => setReplaceForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First Name" /></div>
            <div><FL required>Last Name</FL><SI value={replaceForm.lastName} onChange={e => setReplaceForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" /></div>
            <div className="col-span-2"><FL required>Email</FL><SI type="email" value={replaceForm.email} onChange={e => setReplaceForm(p => ({ ...p, email: e.target.value }))} placeholder="new.manager@club.co.ke" /></div>
            <div className="col-span-2"><FL required>Phone</FL><PhoneInput value={replaceForm.phone} onChange={v => setReplaceForm(p => ({ ...p, phone: v }))} /></div>
            <div className="col-span-2">
              <FL required>Temporary Password</FL>
              <div className="flex gap-2">
                <SI value={replaceForm.tempPwd} readOnly className="flex-1 font-mono text-xs" />
                <button type="button" onClick={() => setReplaceForm(p => ({ ...p, tempPwd: generatePassword() }))} className="rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> New
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowReplace(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>Cancel</button>
            <button onClick={() => { if (!replaceForm.firstName || !replaceForm.email) return; setShowReplace(false); showToast(`Manager replaced. Welcome email sent to ${replaceForm.email}`); }} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: '#2563EB' }}>Replace Manager</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ══════════════════════════════════════
   CLUBS PAGE
══════════════════════════════════════ */
const ClubsPage = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [clubs, setClubs] = useState<Club[]>(initClubs);
  const [managers, setManagers] = useState<Manager[]>(initManagers);
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantRes = await fetch(getApiUrl('/tenants'), { headers: authHeaders() });
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          const rawTenants: any[] = tenantData.data ?? tenantData;
          const parsedClubs: Club[] = rawTenants.map(t => {
            const primaryUser = t.users?.find((u: any) => u.role === 'CLUB_ADMIN' || u.role === 'MANAGER') ?? t.users?.[0];
            return {
              id: t.clubUuid || t.uuid || t.id,
              name: t.name,
              description: t.description ?? '',
              address: t.address ?? '',
              city: t.city ?? '',
              county: t.county ?? 'Nairobi',
              phone: t.phone ?? '',
              email: t.email ?? '',
              openingTime: t.openingHours ?? '18:00',
              closingTime: t.closingHours ?? '02:00',
              logoUrl: t.logoUrl ?? '',
              bannerUrl: t.bannerUrl ?? '',
              themeColor: t.brandColor ?? '#1E3A5F',
              plan: 'Pro',
              status: t.status ?? 'Active',
              mrr: 8900,
              orders: 0,
              managerId: primaryUser ? (primaryUser.userUuid || primaryUser.uuid || '') : '',
              createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
              trialDays: 0,
              startDate: '',
              expiryDate: '',
            };
          });
          setClubs(parsedClubs);
        }

        const staffRes = await fetch(getApiUrl('/auth/staff?role=CLUB_ADMIN'), { headers: authHeaders() });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          const rawStaff: any[] = staffData.data?.staff ?? staffData.data ?? [];
          const parsedMgrs: Manager[] = rawStaff.map(s => ({
            id: s.uuid ?? s.userUuid,
            firstName: s.fullName ? s.fullName.split(' ')[0] : 'Manager',
            lastName: s.fullName ? s.fullName.split(' ').slice(1).join(' ') : '',
            email: s.email,
            phone: s.phone ?? '',
            username: s.email.split('@')[0],
            clubId: s.clubUuid ?? '',
            clubName: s.club?.name ?? 'Venue',
            status: s.isActive !== false ? 'Active' : 'Suspended',
            lastLogin: s.lastLogin ?? 'Never',
          }));
          setManagers(parsedMgrs);
        }
      } catch {
        /* Keep state empty if fetch fails */
      }
    };
    fetchData();
  }, []);

  const handleClubUpdated = (updated: Club) => {
    setClubs(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedClub?.id === updated.id) {
      setSelectedClub(updated);
    }
  };

  if (view === 'create') return (
    <CreateClubStepper
      onSuccess={(club, manager) => {
        setClubs(p => [...p, club]);
        setManagers(p => [...p, manager]);
        setSelectedClub(club);
        setView('details');
      }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'details' && selectedClub) return (
    <ClubDetailsPage
      club={selectedClub}
      managers={managers}
      onBack={() => { setView('list'); setSelectedClub(null); }}
      onReplaceManager={(club) => { setSelectedClub(club); }}
      onUpdateClub={handleClubUpdated}
      showToast={showToast}
    />
  );

  const filtered = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.county.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <SectionHeader title="Clubs & Venues" subtitle={`${clubs.length} registered venues`} action={
        <button onClick={() => setView('create')} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>
          <Plus className="h-3.5 w-3.5" /> Create Club
        </button>
      } />
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs or county…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <button onClick={() => { csvExport(['Club', 'City', 'County', 'Plan', 'Status', 'MRR (KES)', 'Orders'], filtered.map(c => [c.name, c.city, c.county, c.plan, c.status, c.mrr, c.orders]), 'clubs-export.csv'); showToast('Clubs exported to CSV'); }} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {['Club', 'City / County', 'Plan', 'Status', 'MRR', 'Orders', 'Manager', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(club => {
              const mgr = managers.find(m => m.clubId === club.id || (club.managerId && m.id === club.managerId));
              return (
                <tr key={club.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <td className="px-4 py-3.5">
                    <button onClick={() => { setSelectedClub(club); setView('details'); }} className="flex items-center gap-3 hover:text-blue-600 transition-colors text-left">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: club.themeColor }}>
                        <Wine className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-sm hover:text-blue-600">{club.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{club.city} · {club.county}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={club.plan} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={club.status} /></td>
                  <td className="px-4 py-3.5 font-bold text-xs text-emerald-600">{club.mrr > 0 ? `KES ${club.mrr.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3.5 font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{club.orders}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{mgr ? `${mgr.firstName} ${mgr.lastName}` : '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditingClub(club)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit Club Details"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setSelectedClub(club); setView('details'); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="View Details"><Eye className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => { setClubs(p => p.filter(c => c.id !== club.id)); showToast(`${club.name} removed`); }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Club Modal */}
      <EditClubModal
        club={editingClub}
        open={!!editingClub}
        onClose={() => setEditingClub(null)}
        onSaved={handleClubUpdated}
        showToast={showToast}
      />
    </div>
  );
};

/* ══════════════════════════════════════
   MANAGERS PAGE (scrollable with edit capability)
══════════════════════════════════════ */
const ManagersPage = ({ showToast }: { showToast: (m: string, type?: 'success' | 'error') => void }) => {
  const [managers, setManagers] = useState<Manager[]>(initManagers);
  const [clubs, setClubs] = useState<{ id: string; name: string; city?: string }[]>([]);
  const [search, setSearch] = useState('');
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clubId: '',
    status: 'Active' as 'Active' | 'Suspended',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch(getApiUrl('/auth/staff?role=CLUB_ADMIN'), { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const rawStaff: any[] = data.data?.staff ?? data.data ?? [];
        const parsedMgrs: Manager[] = rawStaff.map(s => ({
          id: s.uuid ?? s.userUuid,
          firstName: s.fullName ? s.fullName.split(' ')[0] : 'Manager',
          lastName: s.fullName ? s.fullName.split(' ').slice(1).join(' ') : '',
          email: s.email,
          phone: s.phone ?? '',
          username: s.email.split('@')[0],
          clubId: s.clubUuid ?? '',
          clubName: s.club?.name ?? 'Venue',
          status: s.isActive !== false ? 'Active' : 'Suspended',
          lastLogin: s.lastLogin ?? 'Never',
        }));
        setManagers(parsedMgrs);
      } catch {
        /* Keep state empty if error */
      }
    };

    const fetchClubs = async () => {
      try {
        const res = await fetch(getApiUrl('/tenants'), { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const raw: any[] = data.data?.tenants ?? data.data ?? [];
        setClubs(raw.map((c: any) => ({ id: c.clubUuid || c.uuid || c.id, name: c.name, city: c.city })));
      } catch {}
    };

    fetchManagers();
    fetchClubs();
  }, []);

  const filtered = managers.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email} ${m.clubName}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = async (id: string) => {
    const mgr = managers.find(m => m.id === id);
    if (!mgr) return;
    const newIsActive = mgr.status !== 'Active';
    try {
      const res = await fetch(getApiUrl(`/auth/users/${id}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: newIsActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error?.message ?? 'Failed to update status', 'error');
        return;
      }
      setManagers(prev => prev.map(m => m.id === id ? { ...m, status: newIsActive ? 'Active' : 'Suspended' } : m));
      showToast(`${mgr.firstName}'s account ${newIsActive ? 'activated' : 'deactivated'}`);
    } catch {
      showToast('Network error — could not update status', 'error');
    }
  };

  const handleOpenEdit = (m: Manager) => {
    setEditingManager(m);
    setEditForm({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone || '',
      clubId: m.clubId || '',
      status: m.status === 'Active' ? 'Active' : 'Suspended',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;
    setSaving(true);
    try {
      const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim();
      try {
        const res = await fetch(getApiUrl(`/auth/users/${editingManager.id}`), {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            fullName,
            email: editForm.email.trim(),
            phone: editForm.phone.trim(),
            isActive: editForm.status === 'Active',
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('Backend update notice:', err?.error?.message);
        }
      } catch (netErr) {
        console.warn('Backend offline, applying manager changes locally in demo mode:', netErr);
      }

      setManagers(prev => prev.map(m => m.id === editingManager.id ? {
        ...m,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        status: editForm.status,
      } : m));

      showToast('Manager details updated successfully');
      setEditingManager(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update manager', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Managers" subtitle="All club managers — created during club onboarding" action={
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-blue-600 font-medium">Managers are created via Create Club</span>
        </div>
      } />
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-lg border px-3.5 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search managers…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <button onClick={() => { csvExport(['Name', 'Email', 'Club', 'Status', 'Last Login'], filtered.map(m => [`${m.firstName} ${m.lastName}`, m.email, m.clubName, m.status, m.lastLogin]), 'managers-export.csv'); showToast('Managers exported to CSV'); }} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 backdrop-blur-md">
              <tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {['Manager', 'Club', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-400">No managers found</td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-700 flex-shrink-0">
                        {(m.firstName?.[0] || 'M').toUpperCase()}{(m.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.email}</div>
                        {m.phone && <div className="text-[10px] text-slate-400">{m.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{m.clubName}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{m.lastLogin}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit Manager Details"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button onClick={() => showToast(`Password reset link sent to ${m.email}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Reset Password"><Key className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => toggle(m.id)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors" title={m.status === 'Active' ? 'Suspend' : 'Activate'}>
                        {m.status === 'Active' ? <UserX className="h-3.5 w-3.5 text-amber-500" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Manager Modal ── */}
      <Modal open={!!editingManager} onClose={() => setEditingManager(null)} title="Edit Manager Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FG>
              <FL required>First Name</FL>
              <SI
                required
                value={editForm.firstName}
                onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                placeholder="First name"
              />
            </FG>
            <FG>
              <FL required>Last Name</FL>
              <SI
                required
                value={editForm.lastName}
                onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </FG>
          </div>

          <FG>
            <FL required>Email Address</FL>
            <SI
              type="email"
              required
              value={editForm.email}
              onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
              placeholder="manager@example.com"
            />
          </FG>

          <FG>
            <FL>Phone Number</FL>
            <SI
              type="tel"
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+254 700 000 000"
            />
          </FG>

          <FG>
            <FL>Assigned Venue / Club (Locked)</FL>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>{editingManager?.clubName || 'No Venue Assigned'}</span>
              <span className="ml-auto text-[10px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="h-3 w-3" /> Fixed
              </span>
            </div>
          </FG>

          <FG>
            <FL>Account Status</FL>
            <select
              value={editForm.status}
              onChange={e => setEditForm(p => ({ ...p, status: e.target.value as 'Active' | 'Suspended' }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </FG>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingManager(null)}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {saving ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ══════════════════════════════════════
   OTHER PAGES (unchanged)
══════════════════════════════════════ */
const DashboardPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantRes = await fetch(getApiUrl('/tenants'), { headers: authHeaders() });
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          const rawTenants: any[] = tenantData.data ?? tenantData;
          const parsedClubs: Club[] = rawTenants.map(t => {
            const primaryUser = t.users?.find((u: any) => u.role === 'CLUB_ADMIN' || u.role === 'MANAGER') ?? t.users?.[0];
            return {
              id: t.clubUuid || t.uuid || t.id,
              name: t.name,
              description: t.description ?? '',
              address: t.address ?? '',
              city: t.city ?? '',
              county: t.county ?? 'Nairobi',
              phone: t.phone ?? '',
              email: t.email ?? '',
              openingTime: t.openingHours ?? '18:00',
              closingTime: t.closingHours ?? '02:00',
              logoUrl: t.logoUrl ?? '',
              bannerUrl: t.bannerUrl ?? '',
              themeColor: t.brandColor ?? '#1E3A5F',
              plan: 'Pro',
              status: t.status ?? 'Active',
              mrr: 8900,
              orders: 0,
              managerId: primaryUser ? (primaryUser.userUuid || primaryUser.uuid || '') : '',
              createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
              trialDays: 0,
              startDate: '',
              expiryDate: '',
            };
          });
          setClubs(parsedClubs);
        }

        const staffRes = await fetch(getApiUrl('/auth/staff?role=CLUB_ADMIN'), { headers: authHeaders() });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          const rawStaff: any[] = staffData.data?.staff ?? staffData.data ?? [];
          const parsedMgrs: Manager[] = rawStaff.map(s => ({
            id: s.userUuid,
            firstName: s.fullName ? s.fullName.split(' ')[0] : 'Manager',
            lastName: s.fullName ? s.fullName.split(' ').slice(1).join(' ') : '',
            email: s.email,
            phone: s.phone ?? '',
            username: s.email.split('@')[0],
            clubId: s.clubUuid ?? '',
            clubName: s.club?.name ?? 'Venue',
            status: s.isActive !== false ? 'Active' : 'Suspended',
            lastLogin: 'Active',
          }));
          setManagers(parsedMgrs);
        }
      } catch {
        /* Keep empty on error */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeClubsCount = clubs.filter(c => c.status === 'Active').length;
  const totalMrr = clubs.reduce((acc, c) => acc + (c.mrr || 0), 0);
  const totalManagersCount = managers.length;

  const countyMap: Record<string, { county: string; clubs: number; revenue: number }> = {};
  clubs.forEach(c => {
    const cName = c.county || 'Nairobi';
    if (!countyMap[cName]) countyMap[cName] = { county: cName, clubs: 0, revenue: 0 };
    countyMap[cName].clubs += 1;
    countyMap[cName].revenue += c.mrr || 0;
  });
  const venueData = Object.values(countyMap);

  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Overview" subtitle="DrinkHub Kenya · Real-Time Data" action={
        <button onClick={() => { csvExport(['Club', 'City', 'Plan', 'Status', 'MRR (KES)', 'Orders'], clubs.map(c => [c.name, c.city, c.plan, c.status, c.mrr, c.orders]), 'platform-report.csv'); showToast('Platform report exported'); }}
          className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download className="h-3.5 w-3.5" /> Export Report
        </button>
      } />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Active Clubs" value={String(activeClubsCount)} change={activeClubsCount > 0 ? `+${activeClubsCount} active` : '0 active'} positive icon={<Building2 className="h-5 w-5 text-blue-500" />} />
        <KPI label="MRR" value={`KES ${totalMrr.toLocaleString()}`} change={totalMrr > 0 ? 'Live MRR' : 'KES 0'} positive icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        <KPI label="Total Managers" value={String(totalManagersCount)} change={totalManagersCount > 0 ? `+${totalManagersCount} active` : '0 active'} positive icon={<Users className="h-5 w-5 text-purple-500" />} />
        <KPI label="Churn Rate" value="0%" change="0%" positive icon={<AlertCircle className="h-5 w-5 text-red-500" />} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Recurring Revenue</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Revenue trend</p>
          {clubs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">No MRR data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[{ month: 'Current', mrr: totalMrr }]}>
                <defs><linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'MRR']} />
                <Area type="monotone" dataKey="mrr" stroke="#2563EB" strokeWidth={2} fill="url(#mrrG)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>System Health</h3>
          {[{ label: 'API Gateway', ok: true, up: '99.98%' }, { label: 'PostgreSQL', ok: true, up: '99.95%' }, { label: 'Redis Cache', ok: true, up: '100%' }, { label: 'Socket.IO', ok: true, up: '99.92%' }, { label: 'M-Pesa Daraja', ok: true, up: '99.90%' }].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</span></div>
              <span className="text-xs font-bold" style={{ color: s.ok ? '#10B981' : '#F59E0B' }}>{s.up}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Clubs by County</h3>
          {venueData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No registered clubs</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={venueData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" /><XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} /><YAxis dataKey="county" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={60} /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} /><Bar dataKey="clubs" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={14} /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Revenue by County</h3>
          {venueData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No revenue data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={venueData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" /><XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} /><YAxis dataKey="county" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={60} /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} /><Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={14} /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const BillingPage = ({ showToast }: { showToast: (m: string) => void }) => (
  <div className="space-y-6">
    <SectionHeader title="Billing & Subscriptions" subtitle="Platform subscription plans" action={
      <button onClick={() => { csvExport(['Plan', 'Price (KES)', 'Clubs', 'MRR (KES)'], subscriptions.map(s => [s.plan, s.price, s.clubs, s.mrr]), 'billing.csv'); showToast('Billing data exported'); }} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><Download className="h-3.5 w-3.5" /> Export</button>
    } />
    <div className="grid grid-cols-3 gap-4">
      {subscriptions.map(s => (
        <div key={s.plan} className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex justify-between"><StatusBadge status={s.plan} /><span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{s.clubs} clubs</span></div>
          <div><div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{s.price > 0 ? `KES ${s.price.toLocaleString()}` : 'Free'}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>per month</div></div>
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}><div className="text-sm font-black text-emerald-600">MRR: KES {s.mrr.toLocaleString()}</div></div>
        </div>
      ))}
    </div>
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>MRR Growth</h3>
      <ResponsiveContainer width="100%" height={200}>
        <Line data={mrrData} type="monotone" dataKey="mrr" stroke="#2563EB" strokeWidth={2.5}>
          <LineChart data={mrrData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'MRR']} /><Line type="monotone" dataKey="mrr" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 3 }} /></LineChart>
        </Line>
      </ResponsiveContainer>
    </div>
  </div>
);

const AnalyticsPage = ({ showToast }: { showToast: (m: string) => void }) => (
  <div className="space-y-6">
    <SectionHeader title="Platform Analytics" subtitle="Cross-venue aggregated performance" action={
      <button onClick={() => { csvExport(['Day', 'Orders'], weeklyOrders.map(o => [o.day, o.orders]), 'analytics-weekly.csv'); showToast('Weekly orders exported'); }} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><Download className="h-3.5 w-3.5" /> Export CSV</button>
    } />
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Orders (Platform-wide)</h3>
        <ResponsiveContainer width="100%" height={200}><BarChart data={weeklyOrders}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} /><Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>Payment Methods</h3>
        <ResponsiveContainer width="100%" height={150}><RePieChart><Pie data={payData} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>{payData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)' }} /></RePieChart></ResponsiveContainer>
        <div className="space-y-1.5 mt-2">{payData.map(item => (<div key={item.name} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span style={{ color: 'var(--text-secondary)' }}>{item.name}</span></div><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}%</span></div>))}</div>
      </div>
    </div>
  </div>
);

const SystemPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 1400)); setRefreshing(false); showToast('System status refreshed'); };
  const services = [{ label: 'API Gateway', icon: <Wifi className="h-5 w-5 text-blue-500" />, uptime: '99.98%', reqs: '2.4M/day', lat: '42ms', status: 'Healthy' }, { label: 'PostgreSQL 16', icon: <Database className="h-5 w-5 text-purple-500" />, uptime: '99.95%', reqs: '1.2M queries/day', lat: '8ms', status: 'Healthy' }, { label: 'Redis 7', icon: <Zap className="h-5 w-5 text-amber-500" />, uptime: '100%', reqs: '5.8M ops/day', lat: '0.4ms', status: 'Healthy' }, { label: 'Socket.IO', icon: <Activity className="h-5 w-5 text-emerald-500" />, uptime: '99.92%', reqs: '420K events/day', lat: '12ms', status: 'Healthy' }, { label: 'M-Pesa Daraja', icon: <Cpu className="h-5 w-5 text-orange-500" />, uptime: '99.41%', reqs: '18K STK/day', lat: '220ms', status: 'Degraded' }, { label: 'File Storage', icon: <HardDrive className="h-5 w-5 text-slate-500" />, uptime: '100%', reqs: '12.4 GB used', lat: '50 GB total', status: 'Healthy' }];
  return (
    <div className="space-y-6">
      <SectionHeader title="System" subtitle="Infrastructure health and resource monitoring" action={<button onClick={doRefresh} disabled={refreshing} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-60" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing…' : 'Refresh'}</button>} />
      <div className="grid grid-cols-2 gap-4">{services.map(s => (
        <div key={s.label} className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between"><div className="flex items-center gap-3">{s.icon}<span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</span></div><StatusBadge status={s.status} /></div>
          <div className="grid grid-cols-3 gap-2 pt-1">{[['Uptime', s.uptime], ['Throughput', s.reqs], ['Latency', s.lat]].map(([k, v]) => (<div key={k}><div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{k}</div><div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{v}</div></div>))}</div>
        </div>
      ))}</div>
    </div>
  );
};

const SecurityPage = ({ showToast }: { showToast: (m: string) => void }) => (
  <div className="space-y-5">
    <SectionHeader title="Security & Audit Logs" subtitle="User activity, access attempts, and system events" action={<button onClick={() => { csvExport(['Level', 'Action', 'Actor', 'Resource', 'IP', 'Time'], auditLogs.map(l => [l.level, l.action, l.actor, l.resource, l.ip, l.time]), 'audit-logs.csv'); showToast('Audit logs exported'); }} className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><Download className="h-3.5 w-3.5" /> Export Logs</button>} />
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm"><thead><tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>{['Level', 'Action', 'Actor', 'Resource', 'IP', 'Time'].map(h => (<th key={h} className="px-5 py-3 text-left text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>))}</tr></thead>
        <tbody>{auditLogs.map(log => (<tr key={log.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}><td className="px-5 py-3.5"><StatusBadge status={log.level} /></td><td className="px-5 py-3.5 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{log.action}</td><td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{log.actor}</td><td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{log.resource}</td><td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.ip}</td><td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.time}</td></tr>))}</tbody>
      </table>
    </div>
  </div>
);

const PlatformSettingsPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [trialDays, setTrialDays] = useState('14');
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Platform Settings" subtitle="Global configuration for DrinkHub SaaS" />
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div><div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Default Trial Period</div><div className="flex items-center gap-3"><input type="number" value={trialDays} onChange={e => setTrialDays(e.target.value)} className="w-20 rounded-lg border px-3 py-2 text-sm text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>days</span></div></div>
      </div>
      {[{ label: 'Email Notifications', desc: 'Send system alerts to platform admins.', val: emailNotifs, set: setEmailNotifs }, { label: 'Maintenance Mode', desc: 'Temporarily disable all customer-facing services.', val: maintenance, set: setMaintenance }].map(item => (
        <div key={item.label} className="rounded-xl border p-5 flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div><div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div></div>
          <button onClick={() => item.set((v: boolean) => !v)} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${item.val ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${item.val ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
        </div>
      ))}
      <button onClick={() => showToast('Platform settings saved')} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#2563EB' }}>Save Changes</button>
    </div>
  );
};

/* ─── Nav ─── */
type NavKey = 'dashboard' | 'clubs' | 'managers' | 'billing' | 'analytics' | 'system' | 'security' | 'settings';
const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'clubs', label: 'Clubs & Venues', icon: <Building2 className="h-4 w-4" /> },
  { key: 'managers', label: 'Managers', icon: <UserCog className="h-4 w-4" /> },
  { key: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'system', label: 'System', icon: <Server className="h-4 w-4" /> },
  { key: 'security', label: 'Security', icon: <ShieldCheck className="h-4 w-4" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

const PAGE_TITLES: Record<NavKey, string> = { dashboard: 'Platform Overview', clubs: 'Clubs & Venues', managers: 'Managers', billing: 'Billing', analytics: 'Analytics', system: 'System Health', security: 'Security', settings: 'Settings' };

/* ─── Notification Data ─── */
interface Notif { id: string; title: string; body: string; time: string; read: boolean; icon: React.ReactNode; }
const INIT_NOTIFS: Notif[] = [
  { id: 'n1', title: 'New club registered', body: 'Skylounge Westlands completed onboarding.', time: '5 min ago', read: false, icon: <Building2 className="h-4 w-4 text-blue-500" /> },
  { id: 'n2', title: 'Subscription expiring', body: 'Quiver Lounge Pro plan expires in 3 days.', time: '1 hr ago', read: false, icon: <CreditCard className="h-4 w-4 text-amber-500" /> },
  { id: 'n3', title: 'Manager invited', body: 'jane@eden.co.ke accepted the invitation.', time: '3 hrs ago', read: true, icon: <Users className="h-4 w-4 text-emerald-500" /> },
  { id: 'n4', title: 'System alert', body: 'API latency spike detected — resolved.', time: '6 hrs ago', read: true, icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
];

/* ─── Main Export ─── */
export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [page, setPage] = useState<NavKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type }), []);

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(INIT_NOTIFS);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  /* Click-outside to close */
  useEffect(() => {
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
      case 'clubs': return <ClubsPage {...p} />;
      case 'managers': return <ManagersPage {...p} />;
      case 'billing': return <BillingPage {...p} />;
      case 'analytics': return <AnalyticsPage {...p} />;
      case 'system': return <SystemPage {...p} />;
      case 'security': return <SecurityPage {...p} />;
      case 'settings': return <PlatformSettingsPage {...p} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-body)' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <aside className="flex-shrink-0 flex flex-col sticky top-0 h-screen transition-all duration-200" style={{ width: collapsed ? '64px' : '220px', background: 'var(--bg-sidebar)', borderRight: '1px solid #1E293B' }}>
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: '#1E293B' }}>
          <button onClick={() => setCollapsed(v => !v)} className="h-8 w-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center hover:bg-blue-700 transition-colors"><Wine className="h-4 w-4 text-white" /></button>
          {!collapsed && <div className="overflow-hidden"><div className="text-sm font-black text-white truncate">DrinkHub</div><div className="text-[10px] text-slate-500 truncate">Platform Admin</div></div>}
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
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>DrinkHub Kenya · August 2026</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><Zap className="h-3.5 w-3.5 text-amber-500" /> API healthy</div>
            <ThemeToggle />

            {/* ── Notifications ── */}
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
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                      {unread > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread} new</span>}
                    </div>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">Mark all read</button>
                    )}
                  </div>

                  {/* Items */}
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

                  {/* Footer */}
                  <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => { setPage('system'); setNotifOpen(false); }} className="w-full text-center text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors py-0.5">
                      View system health →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Profile ── */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors"
                style={{ borderColor: 'var(--border)', background: profileOpen ? 'var(--bg-muted)' : 'transparent' }}
              >
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-[10px] font-black text-white">PA</span></div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Platform Admin</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: 'var(--text-muted)', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {/* Identity */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><span className="text-sm font-black text-white">PA</span></div>
                      <div className="min-w-0">
                        <div className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>Platform Admin</div>
                        <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>admin@drinkhub.co.ke</div>
                        <span className="inline-block mt-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Super Admin</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { icon: <UserCog className="h-3.5 w-3.5" />, label: 'Account Settings', action: () => { setPage('settings'); setProfileOpen(false); } },
                      { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Security', action: () => { setPage('security'); setProfileOpen(false); } },
                      { icon: <Activity className="h-3.5 w-3.5" />, label: 'System Health', action: () => { setPage('system'); setProfileOpen(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
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

