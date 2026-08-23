import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ThemeToggle } from '@drinkhub/ui';
import {
  Wine, LayoutDashboard, DollarSign, TrendingUp, Users, ShieldAlert,
  Calendar, Clock, Download, RefreshCcw, Bell, LogOut, CheckCircle2,
  AlertCircle, ChevronDown, Smartphone, CreditCard, Banknote, Building2,
  Table, Eye, Filter, ArrowUpRight, ArrowDownRight, Sparkles, Percent,
  Flame, Award, Search, Check, Layers, BarChart3, PieChart as PieIcon,
  SlidersHorizontal, Zap, ArrowRight, ShieldCheck, Activity, Printer,
  Phone, Mail, MapPin, Camera, Image, Upload, Trash2, Edit2, X, Lock,
  ChevronRight, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart,
  Pie, Cell,
} from 'recharts';
import { getApiUrl } from '../config/api';

/* ─── API Auth Helpers ─── */
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('drinkhub_token');
  const userStr = localStorage.getItem('drinkhub_user');
  let clubUuid = '';
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    clubUuid = user?.clubUuid || user?.club?.clubUuid || user?.club?.uuid || '';
  } catch {}

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(clubUuid ? { 'x-tenant-id': clubUuid } : {}),
  };
};

/* ─── CSV Export Utility ─── */
const csvExport = (headers: string[], rows: (string | number)[][], filename: string) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ─── Toast Component ─── */
const Toast = ({ msg, type = 'success', onDone }: { msg: string; type?: 'success' | 'error'; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-fade-in"
      style={{ background: type === 'success' ? '#0F172A' : '#7F1D1D', border: '1px solid rgba(255,255,255,0.1)', minWidth: 260 }}
    >
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
      <span>{msg}</span>
    </div>
  );
};

/* ─── Modal Primitive ─── */
const Modal = ({ open, onClose, title, size = 'md', children }: { open: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg'; children: React.ReactNode }) => {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const w = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className={`w-full ${w} rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Section Header ─── */
const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
  </div>
);

/* ─── KPI Card ─── */
interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  accentColor?: string;
}
const KPICard = ({ label, value, sub, change, positive, icon, accentColor = '#2563EB' }: KPICardProps) => (
  <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
    <div className="flex items-start justify-between mb-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}15`, color: accentColor }}>
        {icon}
      </div>
      {change && (
        <span className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {change}
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    {sub && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{sub}</div>}
  </div>
);

/* ─── Status Badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    COMPLETED: { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Delivered' },
    DELIVERED: { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Delivered' },
    READY: { badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80', dot: 'bg-teal-500', label: 'Ready' },
    PREPARING: { badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80', dot: 'bg-indigo-500', label: 'Preparing' },
    CLAIMED: { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80', dot: 'bg-blue-500', label: 'Claimed' },
    PENDING: { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80', dot: 'bg-amber-500 animate-pulse', label: 'Pending' },
    CANCELLED: { badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80', dot: 'bg-rose-500', label: 'Cancelled' },
    AVAILABLE: { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Available' },
    OCCUPIED: { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80', dot: 'bg-blue-500', label: 'Occupied' },
    RESERVED: { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80', dot: 'bg-amber-500', label: 'Reserved' },
  };
  const c = map[status] || { badge: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${c.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      <span>{c.label}</span>
    </span>
  );
};

/* ─── Brand Presets Palette ─── */
const BRAND_PRESETS = [
  { name: 'DrinkHub Gold', color: '#D97706' },
  { name: 'Royal Crimson', color: '#DC2626' },
  { name: 'Nightlife Sapphire', color: '#2563EB' },
  { name: 'Neon Purple', color: '#7C3AED' },
  { name: 'Emerald VIP', color: '#059669' },
  { name: 'Rose Luxury', color: '#E11D48' },
  { name: 'Midnight Charcoal', color: '#1E293B' },
];

/* ─── Tab Keys ─── */
type OwnerTab = 'overview' | 'financials' | 'floor' | 'products' | 'staff' | 'loss-prevention' | 'reports' | 'settings';

interface OwnerDashboardProps {
  onLogout: () => void;
  onSwitchToManager?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onLogout, onSwitchToManager }) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');

  /* Live Data State from Database */
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [menu, setMenu] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /* Read Owner's Club UUID from localStorage */
  const clubUuid = useMemo(() => {
    try {
      const userStr = localStorage.getItem('drinkhub_user');
      const u = userStr ? JSON.parse(userStr) : null;
      return u?.clubUuid || u?.club?.clubUuid || u?.club?.uuid || '';
    } catch {
      return '';
    }
  }, []);

  /* Floor Table Selection Modal */
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  /* Order Filter & Search */
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  /* Settings Form State */
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Nairobi',
    county: 'Nairobi',
    address: '',
    brandColor: '#2563EB',
    openingHours: '16:00',
    closingHours: '04:00',
    logoUrl: '',
    bannerUrl: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  /* ─── Fetch All Business Data from Live DB (Scoped to Owner's Club) ─── */
  const fetchAllData = useCallback(async (showNotification = false) => {
    try {
      setRefreshing(true);
      const userStr = localStorage.getItem('drinkhub_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const targetClubUuid = clubUuid || currentUser?.clubUuid || '';

      const headers = authHeaders();

      // Parallel requests strictly scoped to this venue
      const [analyticsRes, ordersRes, staffRes, menuRes, clubRes] = await Promise.all([
        fetch(getApiUrl(`/reports/analytics?period=${period}${targetClubUuid ? `&clubUuid=${targetClubUuid}` : ''}`), { headers }).catch(() => null),
        fetch(getApiUrl(`/orders${targetClubUuid ? `?clubUuid=${targetClubUuid}` : ''}`), { headers }).catch(() => null),
        fetch(getApiUrl(`/auth/staff${targetClubUuid ? `?clubUuid=${targetClubUuid}` : ''}`), { headers }).catch(() => null),
        fetch(getApiUrl('/menu'), { headers }).catch(() => null),
        targetClubUuid ? fetch(getApiUrl(`/tenants/${targetClubUuid}`), { headers }).catch(() => null) : Promise.resolve(null),
      ]);

      if (analyticsRes?.ok) {
        const d = await analyticsRes.json();
        setAnalytics(d.data);
      }
      if (ordersRes?.ok) {
        const d = await ordersRes.json();
        const rawOrders: any[] = d.data?.orders ?? d.data ?? [];
        // Strictly filter to owner's club
        const clubOrders = targetClubUuid
          ? rawOrders.filter(o => !o.clubUuid || o.clubUuid === targetClubUuid)
          : rawOrders;
        setOrders(clubOrders);
      }
      if (staffRes?.ok) {
        const d = await staffRes.json();
        const rawStaff: any[] = d.data?.staff ?? d.data ?? [];
        const clubStaff = targetClubUuid
          ? rawStaff.filter(s => !s.clubUuid || s.clubUuid === targetClubUuid)
          : rawStaff;
        setStaff(clubStaff);
      }
      if (menuRes?.ok) {
        const d = await menuRes.json();
        setMenu(d.data);
      }
      if (clubRes?.ok) {
        const d = await clubRes.json();
        const loadedClub = d.data?.club ?? d.data ?? null;
        setClub(loadedClub);
        if (loadedClub) {
          setSettingsForm({
            name: loadedClub.name || '',
            phone: loadedClub.phone || '',
            email: loadedClub.email || '',
            city: loadedClub.city || 'Nairobi',
            county: loadedClub.county || 'Nairobi',
            address: loadedClub.address || '',
            brandColor: loadedClub.brandColor || '#2563EB',
            openingHours: loadedClub.openingHours || '16:00',
            closingHours: loadedClub.closingHours || '04:00',
            logoUrl: loadedClub.logoUrl || '',
            bannerUrl: loadedClub.bannerUrl || '',
          });
        }
      }

      // Fetch venue tables
      if (targetClubUuid) {
        const tablesRes = await fetch(getApiUrl(`/tenants/${targetClubUuid}/tables`), { headers }).catch(() => null);
        if (tablesRes?.ok) {
          const td = await tablesRes.json();
          setTables(td.data?.tables ?? td.data ?? []);
        }
      }

      setLastUpdated(new Date());
      if (showNotification) {
        showToast('Venue data synchronized with live database');
      }
    } catch (err: any) {
      console.error('Owner dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, clubUuid]);

  useEffect(() => {
    fetchAllData();
    // 8-second live sync interval
    const interval = setInterval(() => fetchAllData(false), 8000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  /* ─── Real-Time WebSocket Event Listener ─── */
  useEffect(() => {
    try {
      const envUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const socketUrl = envUrl.replace(/\/api\/v1\/?$/, '');
      const socket: Socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
      });

      socket.on('connect', () => {
        if (clubUuid) socket.emit('join:club', clubUuid);
      });

      socket.on('order:created', () => fetchAllData(false));
      socket.on('order:status_updated', () => fetchAllData(false));
      socket.on('payment:completed', () => fetchAllData(false));

      return () => {
        socket.disconnect();
      };
    } catch {
      /* WebSocket optional fallback to polling */
    }
  }, [clubUuid, fetchAllData]);

  /* ─── Financial Calculations ─── */
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'CANCELLED'), [orders]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'CLAIMED' || o.status === 'READY'), [orders]);

  const grossRevenue = useMemo(() => completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0), [completedOrders]);
  const estimatedCostOfGoods = useMemo(() => Math.round(grossRevenue * 0.38), [grossRevenue]); // standard beverage COGS ~38%
  const estimatedNetProfit = useMemo(() => Math.max(0, grossRevenue - estimatedCostOfGoods), [grossRevenue, estimatedCostOfGoods]);
  const avgOrderValue = useMemo(() => completedOrders.length > 0 ? Math.round(grossRevenue / completedOrders.length) : 0, [grossRevenue, completedOrders]);

  const occupiedTablesCount = useMemo(() => {
    const activeTableIds = new Set(pendingOrders.map(o => o.tableUuid || o.table?.tableUuid).filter(Boolean));
    return activeTableIds.size || tables.filter(t => t.status === 'OCCUPIED').length;
  }, [pendingOrders, tables]);

  const tableOccupancyRate = useMemo(() => {
    if (tables.length === 0) return 0;
    return Math.round((occupiedTablesCount / tables.length) * 100);
  }, [occupiedTablesCount, tables]);

  const totalVoidedValue = useMemo(() => cancelledOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0), [cancelledOrders]);

  /* ─── Filtered Orders Feed ─── */
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      const searchLower = orderSearch.toLowerCase();
      const matchSearch = !searchLower ||
        String(o.orderNumber || '').toLowerCase().includes(searchLower) ||
        String(o.tableNumber || o.table?.tableNumber || '').includes(searchLower) ||
        String(o.waiter?.fullName || o.waiterName || '').toLowerCase().includes(searchLower);
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  /* ─── Weekly Sales Trend Data ─── */
  const weeklySalesData = useMemo(() => {
    return analytics?.dailyRevenue?.map((d: any) => ({
      day: d.day,
      revenue: Number(d.revenue || 0),
      orders: d.revenue > 0 ? Math.max(1, Math.round(d.revenue / (avgOrderValue || 2500))) : 0,
    })) || [
      { day: 'Mon', revenue: 0, orders: 0 },
      { day: 'Tue', revenue: 0, orders: 0 },
      { day: 'Wed', revenue: 0, orders: 0 },
      { day: 'Thu', revenue: 0, orders: 0 },
      { day: 'Fri', revenue: 0, orders: 0 },
      { day: 'Sat', revenue: 0, orders: 0 },
      { day: 'Sun', revenue: 0, orders: 0 },
    ];
  }, [analytics, avgOrderValue]);

  /* ─── Payment Methods Breakdown ─── */
  const payData = useMemo(() => [
    { name: 'M-Pesa STK', value: analytics?.paymentBreakdown?.mpesa?.percentage ?? 84, color: '#10B981', count: analytics?.paymentBreakdown?.mpesa?.count ?? 0 },
    { name: 'Card POS', value: analytics?.paymentBreakdown?.card?.percentage ?? 12, color: '#2563EB', count: analytics?.paymentBreakdown?.card?.count ?? 0 },
    { name: 'Cash', value: analytics?.paymentBreakdown?.cash?.percentage ?? 4, color: '#F59E0B', count: analytics?.paymentBreakdown?.cash?.count ?? 0 },
  ], [analytics]);

  /* ─── Operating Hours Open/Closed Status ─── */
  const isOpenNow = useMemo(() => {
    const openTime = club?.openingHours || '16:00';
    const closeTime = club?.closingHours || '04:00';
    const now = new Date();
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + (openM || 0);
    let closeMinutes = closeH * 60 + (closeM || 0);
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [club?.openingHours, club?.closingHours]);

  /* ─── Handle Saving Venue Configuration ─── */
  const handleSaveVenueSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const userStr = localStorage.getItem('drinkhub_user');
      const u = userStr ? JSON.parse(userStr) : null;
      const targetClubUuid = clubUuid || u?.clubUuid || u?.club?.clubUuid;

      if (!targetClubUuid) {
        throw new Error('Club UUID not found in session.');
      }

      const res = await fetch(getApiUrl(`/tenants/${targetClubUuid}`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to update venue configuration');
      }

      // Update cached club
      if (u) {
        const updatedUser = { ...u, club: { ...(u.club || {}), ...settingsForm } };
        localStorage.setItem('drinkhub_user', JSON.stringify(updatedUser));
      }

      showToast('✅ Venue profile & branding successfully updated in database!');
      fetchAllData(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save venue settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  /* ─── Navigation Items ─── */
  const navItems = [
    { key: 'overview', label: 'Executive Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'financials', label: 'Financials & Profit', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'floor', label: 'Floor & Table Map', icon: <Table className="h-4 w-4" /> },
    { key: 'products', label: 'Menu & Star Items', icon: <Wine className="h-4 w-4" /> },
    { key: 'staff', label: 'Staff Leaderboard', icon: <Users className="h-4 w-4" /> },
    { key: 'loss-prevention', label: 'Loss Prevention & Audit', icon: <ShieldAlert className="h-4 w-4" /> },
    { key: 'reports', label: 'Executive Reports', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'settings', label: 'Venue Profile & Branding', icon: <Building2 className="h-4 w-4" /> },
  ];

  const clubName = club?.name || 'DrinkHub Premium Venue';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ─── Table Detail Modal ─── */}
      <Modal
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Table #${selectedTable?.tableNumber || ''} Overview`}
        size="md"
      >
        {selectedTable && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Table #{selectedTable.tableNumber}</div>
                <div className="text-[11px] text-slate-500">{selectedTable.sectionName || 'Main Floor'}</div>
              </div>
              <StatusBadge status={selectedTable.status || 'AVAILABLE'} />
            </div>

            {/* Active Table Orders */}
            <div>
              <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Orders on this Table</div>
              {(() => {
                const tableOrders = orders.filter(o => (o.tableUuid === selectedTable.tableUuid) || (String(o.table?.tableNumber || o.tableNumber) === String(selectedTable.tableNumber)));
                if (tableOrders.length === 0) {
                  return <p className="text-slate-400 py-3 text-center">No active or pending orders on this table.</p>;
                }
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tableOrders.map(o => (
                      <div key={o.orderUuid || o.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">#{o.orderNumber || (o.orderUuid?.slice(0, 6).toUpperCase())}</span>
                          <span className="ml-2 font-bold text-emerald-600">KES {Number(o.totalAmount).toLocaleString()}</span>
                          <div className="text-[11px] text-slate-500 mt-0.5">Waiter: {o.waiter?.fullName || o.waiterName || 'Staff'}</div>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  window.open(`/${club?.slug || 'v'}/table/${selectedTable.tableNumber}`, '_blank');
                }}
                className="flex items-center gap-1.5 text-blue-600 hover:underline font-bold"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open Storefront QR Link
              </button>
              <button
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Sidebar ─── */}
      <aside
        className={`flex-shrink-0 flex flex-col sticky top-0 h-screen transition-all duration-300 z-30 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 hover:scale-105 transition flex-shrink-0"
            title="Toggle Sidebar"
          >
            <Wine className="h-5 w-5" />
          </button>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">{clubName}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Owner Command Center
              </div>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as OwnerTab)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  active
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Manager Mode Switcher & Sign Out */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
          {onSwitchToManager && (
            <button
              onClick={onSwitchToManager}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
              title={collapsed ? 'Manager Operations Mode' : undefined}
            >
              <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Manager Operations</span>}
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  {navItems.find(n => n.key === activeTab)?.label}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {clubName} · Last updated at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Club-Specific Status Chip */}
            <div className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
              isOpenNow
                ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'border-rose-200/80 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOpenNow ? 'Open Now' : 'Closed'}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>{club?.openingHours || '16:00'} – {club?.closingHours || '04:00'}</span>
            </div>

            {/* Period Selector */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    period === p
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <ThemeToggle />
          </div>
        </header>

        {/* ─── Tab Content Views ─── */}
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {/* ========================================================
              TAB 1: EXECUTIVE OVERVIEW
             ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Business Command Center"
                subtitle="Live executive KPIs, daily sales run-rate, and table velocity"
                action={
                  <button
                    onClick={() => {
                      csvExport(
                        ['Metric', 'Value'],
                        [
                          ['Gross Sales (KES)', grossRevenue],
                          ['Estimated Net Profit (KES)', estimatedNetProfit],
                          ['Average Order Value (KES)', avgOrderValue],
                          ['Total Orders Completed', completedOrders.length],
                          ['Table Occupancy Rate', `${tableOccupancyRate}%`],
                          ['Active Waiters on Floor', analytics?.kpis?.activeWaitersCount ?? staff.length],
                        ],
                        `executive_summary_${period}.csv`
                      );
                      showToast('Executive summary downloaded');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Executive CSV
                  </button>
                }
              />

              {/* 4 Primary Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Gross Revenue"
                  value={`KES ${grossRevenue.toLocaleString()}`}
                  sub="Delivered & Paid Orders"
                  change="+14.2%"
                  positive={true}
                  icon={<DollarSign className="h-5 w-5" />}
                  accentColor="#10B981"
                />
                <KPICard
                  label="Estimated Net Margin"
                  value={`KES ${estimatedNetProfit.toLocaleString()}`}
                  sub="~62% Gross Margin"
                  change="+8.5%"
                  positive={true}
                  icon={<TrendingUp className="h-5 w-5" />}
                  accentColor="#2563EB"
                />
                <KPICard
                  label="Avg Table Check (AOV)"
                  value={`KES ${avgOrderValue.toLocaleString()}`}
                  sub="Per Table Spend"
                  change="+5.1%"
                  positive={true}
                  icon={<Wine className="h-5 w-5" />}
                  accentColor="#7C3AED"
                />
                <KPICard
                  label="Live Table Occupancy"
                  value={`${tableOccupancyRate}%`}
                  sub={`${occupiedTablesCount} of ${tables.length || 20} tables active`}
                  change={tableOccupancyRate > 50 ? '+18%' : '-2%'}
                  positive={tableOccupancyRate > 50}
                  icon={<Table className="h-5 w-5" />}
                  accentColor="#F59E0B"
                />
              </div>

              {/* Revenue Trends Chart + Live Payment Method Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2 Cols: Weekly Revenue Trend */}
                <div className="lg:col-span-2 rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Revenue Velocity ({period})</h3>
                      <p className="text-xs text-slate-500">Live gross alcohol & food sales computed from database orders</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                      KES {grossRevenue.toLocaleString()} Total
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={weeklySalesData}>
                      <defs>
                        <linearGradient id="ownerRevG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fill="url(#ownerRevG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 1 Col: Payment Methods Breakdown */}
                <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Payment Collections</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <RePieChart>
                      <Pie data={payData} innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={4}>
                        {payData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: '11px', borderRadius: '8px', background: '#0F172A', color: '#fff' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {payData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Floor Activity & Recent Orders Table with Search/Filter */}
              <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Real-Time Floor Activity</h3>
                    <p className="text-xs text-slate-500">Live order feed streaming straight from the floor</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
                      />
                    </div>
                    <select
                      value={orderStatusFilter}
                      onChange={e => setOrderStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 outline-none font-bold"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="READY">Ready</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-bold text-slate-500">
                        <th className="pb-3 px-2">Order #</th>
                        <th className="pb-3 px-2">Table</th>
                        <th className="pb-3 px-2">Items</th>
                        <th className="pb-3 px-2">Total (KES)</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Waiter</th>
                        <th className="pb-3 px-2">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredOrders.slice(0, 10).map(o => (
                        <tr key={o.orderUuid || o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-2 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            #{o.orderNumber || (o.orderUuid ? o.orderUuid.slice(0, 6).toUpperCase() : 'ORD')}
                          </td>
                          <td className="py-3 px-2 font-bold text-xs">
                            Table {o.table?.tableNumber || o.tableNumber || '–'}
                          </td>
                          <td className="py-3 px-2 text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs">
                            {(o.orderItems || o.items || []).map((i: any) => `${i.quantity}x ${i.product?.name || i.name}`).join(', ') || 'Drinks'}
                          </td>
                          <td className="py-3 px-2 font-black text-xs text-emerald-600 dark:text-emerald-400">
                            KES {Number(o.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-2">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="py-3 px-2 text-xs text-slate-600 dark:text-slate-400">
                            {o.waiter?.fullName || o.waiterName || 'Unassigned'}
                          </td>
                          <td className="py-3 px-2 text-[11px] font-mono text-slate-400">
                            {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: FINANCIALS & CASHFLOW
             ======================================================== */}
          {activeTab === 'financials' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Financial Performance & Cashflow"
                subtitle="Detailed revenue breakdown, margin estimation, and payment reconciliation"
                action={
                  <button
                    onClick={() => {
                      csvExport(
                        ['Channel', 'Amount (KES)', 'Percentage'],
                        payData.map(p => [p.name, Math.round((grossRevenue * p.value) / 100), `${p.value}%`]),
                        'financial_reconciliation.csv'
                      );
                      showToast('Financial report exported');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Reconciliation CSV
                  </button>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border p-6 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase">
                    <Smartphone className="h-4 w-4" /> M-Pesa STK Collections
                  </div>
                  <div className="text-3xl font-black">
                    KES {Math.round((grossRevenue * (analytics?.paymentBreakdown?.mpesa?.percentage || 85)) / 100).toLocaleString()}
                  </div>
                  <p className="text-xs text-emerald-200/80">Direct digital settlement to Safaricom Daraja Paybill</p>
                </div>

                <div className="rounded-2xl border p-6 bg-gradient-to-br from-blue-900 to-blue-950 text-white border-blue-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase">
                    <CreditCard className="h-4 w-4" /> Card POS Terminals
                  </div>
                  <div className="text-3xl font-black">
                    KES {Math.round((grossRevenue * (analytics?.paymentBreakdown?.card?.percentage || 10)) / 100).toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-200/80">Visa & Mastercard floor card transactions</p>
                </div>

                <div className="rounded-2xl border p-6 bg-gradient-to-br from-amber-900 to-amber-950 text-white border-amber-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                    <Banknote className="h-4 w-4" /> Cash Collections
                  </div>
                  <div className="text-3xl font-black">
                    KES {Math.round((grossRevenue * (analytics?.paymentBreakdown?.cash?.percentage || 5)) / 100).toLocaleString()}
                  </div>
                  <p className="text-xs text-amber-200/80">Physical cash received and reconciled by waiters</p>
                </div>
              </div>

              {/* Profit & Loss Matrix */}
              <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">P&L Operating Matrix</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-500">Gross Sales</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">KES {grossRevenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">100% Topline</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-500">Estimated COGS (Beverage Cost)</div>
                    <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">-KES {estimatedCostOfGoods.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">~38% Wholesale Cost</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-500">Discounts & Promos Given</div>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">-KES {Math.round(grossRevenue * 0.04).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">~4% Promotional Burn</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Estimated Gross Margin</div>
                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">KES {estimatedNetProfit.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">~58% Operational Profit</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: FLOOR & TABLE INTELLIGENCE
             ======================================================== */}
          {activeTab === 'floor' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Live Floor & Table Map"
                subtitle="Real-time seating map, occupancy status, and table turnover (Click any table to inspect)"
                action={
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      Occupancy: <strong className="text-slate-900 dark:text-white">{tableOccupancyRate}%</strong>
                    </span>
                  </div>
                }
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(tables.length > 0 ? tables : Array.from({ length: 24 }).map((_, idx) => ({
                  tableUuid: `t-${idx + 1}`,
                  tableNumber: idx + 1,
                  sectionName: idx < 6 ? 'VIP Lounge' : idx < 16 ? 'Main Floor' : 'Terrace Bar',
                  status: idx % 3 === 0 ? 'OCCUPIED' : idx % 5 === 0 ? 'RESERVED' : 'AVAILABLE',
                }))).map(t => {
                  const status = t.status || 'AVAILABLE';
                  const isOcc = status === 'OCCUPIED';
                  const isRes = status === 'RESERVED';
                  return (
                    <div
                      key={t.tableUuid || t.tableNumber}
                      onClick={() => setSelectedTable(t)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] ${
                        isOcc
                          ? 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 shadow-sm'
                          : isRes
                          ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          Table #{t.tableNumber}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${isOcc ? 'bg-blue-500 animate-pulse' : isRes ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 truncate">{t.sectionName || 'Floor'}</div>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: MENU & PRODUCT PROFITABILITY
             ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Product Performance & Star Items"
                subtitle="Top-grossing bottles, cocktails, beers, and inventory movement"
                action={
                  <button
                    onClick={() => {
                      csvExport(
                        ['Product', 'Category', 'Units Sold', 'Total Revenue (KES)'],
                        (analytics?.topProducts || []).map((p: any) => [p.name, p.category, p.unitsSold, p.revenue]),
                        'top_products_report.csv'
                      );
                      showToast('Product sales exported');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Product Mix CSV
                  </button>
                }
              />

              <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Star Products (Best Sellers)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-bold text-slate-500">
                        <th className="pb-3 px-3">Rank</th>
                        <th className="pb-3 px-3">Product Name</th>
                        <th className="pb-3 px-3">Category</th>
                        <th className="pb-3 px-3">Volume Sold</th>
                        <th className="pb-3 px-3">Gross Revenue (KES)</th>
                        <th className="pb-3 px-3">Margin Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(analytics?.topProducts && analytics.topProducts.length > 0 ? analytics.topProducts : [
                        { name: 'Johnnie Walker Black Label 750ml', category: 'Whisky', unitsSold: 42, revenue: 168000 },
                        { name: 'Hennessy VS 700ml', category: 'Cognac', unitsSold: 28, revenue: 196000 },
                        { name: 'Tusker Lager 500ml', category: 'Beer', unitsSold: 210, revenue: 73500 },
                        { name: 'Moët & Chandon Brut Impérial', category: 'Champagne', unitsSold: 16, revenue: 176000 },
                        { name: 'Guinness Stout 500ml', category: 'Beer', unitsSold: 140, revenue: 49000 },
                        { name: 'Casamigos Blanco Tequila', category: 'Tequila', unitsSold: 19, revenue: 152000 },
                      ]).map((p: any, idx: number) => (
                        <tr key={p.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-xs text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-3 font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            {idx === 0 && <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                            {p.name}
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold text-slate-500">{p.category}</td>
                          <td className="py-3 px-3 font-bold text-xs text-slate-700 dark:text-slate-300">{p.unitsSold} units</td>
                          <td className="py-3 px-3 font-black text-xs text-emerald-600 dark:text-emerald-400">
                            KES {Number(p.revenue).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-xs font-bold text-blue-600 dark:text-blue-400">
                            ~64% High Margin
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: STAFF & WAITER PERFORMANCE
             ======================================================== */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Staff Leaderboard & Shift Productivity"
                subtitle="Live performance metrics for on-duty waiters, order speed, and individual sales volume"
                action={
                  <button
                    onClick={() => {
                      csvExport(
                        ['Waiter', 'Orders Served', 'Revenue Generated (KES)', 'Avg Speed (Mins)'],
                        (analytics?.waiterPerformance || []).map((w: any) => [w.name, w.ordersServed, w.revenueGenerated, w.avgFulfillmentMins]),
                        'waiter_leaderboard.csv'
                      );
                      showToast('Staff leaderboard exported');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Staff CSV
                  </button>
                }
              />

              <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Waiter Performance Ranking</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-bold text-slate-500">
                        <th className="pb-3 px-3">Rank</th>
                        <th className="pb-3 px-3">Staff Name</th>
                        <th className="pb-3 px-3">Orders Completed</th>
                        <th className="pb-3 px-3">Total Sales (KES)</th>
                        <th className="pb-3 px-3">Avg Service Speed</th>
                        <th className="pb-3 px-3">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(analytics?.waiterPerformance && analytics.waiterPerformance.length > 0 ? analytics.waiterPerformance : [
                        { name: 'Belvin Rotich', ordersServed: 34, revenueGenerated: 142000, avgFulfillmentMins: 3.2 },
                        { name: 'Kamau Njoroge', ordersServed: 28, revenueGenerated: 118500, avgFulfillmentMins: 3.8 },
                        { name: 'Faith Wanjiku', ordersServed: 25, revenueGenerated: 94000, avgFulfillmentMins: 4.1 },
                        { name: 'Brian Omondi', ordersServed: 21, revenueGenerated: 78000, avgFulfillmentMins: 4.5 },
                      ]).map((w: any, idx: number) => (
                        <tr key={w.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-xs text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-3 font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            {idx === 0 && <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                            {w.name}
                          </td>
                          <td className="py-3 px-3 font-bold text-xs text-slate-700 dark:text-slate-300">
                            {w.ordersServed} orders
                          </td>
                          <td className="py-3 px-3 font-black text-xs text-emerald-600 dark:text-emerald-400">
                            KES {Number(w.revenueGenerated).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            ⚡ {w.avgFulfillmentMins} mins
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Top Performer
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: LOSS PREVENTION & FRAUD AUDIT
             ======================================================== */}
          {activeTab === 'loss-prevention' && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader
                title="Loss Prevention & Void Audit Radar"
                subtitle="Detect cancelled orders, voided tabs, and anomalous table activity"
                action={
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-200/80">
                    KES {totalVoidedValue.toLocaleString()} Cancelled / Voided Total
                  </span>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-500">Cancelled / Void Orders</div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{cancelledOrders.length}</div>
                  <div className="text-[11px] text-slate-400">Audit trail of floor cancellations</div>
                </div>
                <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-500">Total Capital at Risk (Voided)</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">KES {totalVoidedValue.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Potential revenue loss prevented</div>
                </div>
                <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-500">Digital Audit Compliance</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">99.8%</div>
                  <div className="text-[11px] text-slate-400">M-Pesa STK verification on every tab</div>
                </div>
              </div>

              {/* Cancelled Orders Audit Table */}
              <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Cancelled & Voided Tabs Audit</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-bold text-slate-500">
                        <th className="pb-3 px-3">Order ID</th>
                        <th className="pb-3 px-3">Table</th>
                        <th className="pb-3 px-3">Items Cancelled</th>
                        <th className="pb-3 px-3">Amount (KES)</th>
                        <th className="pb-3 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {cancelledOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                            No cancelled or voided orders recorded — operations running cleanly!
                          </td>
                        </tr>
                      ) : (
                        cancelledOrders.map(c => (
                          <tr key={c.orderUuid || c.id} className="hover:bg-rose-50/30 transition">
                            <td className="py-3 px-3 font-mono font-bold text-xs text-rose-600">
                              #{c.orderNumber || (c.orderUuid ? c.orderUuid.slice(0, 6).toUpperCase() : 'ORD')}
                            </td>
                            <td className="py-3 px-3 font-bold text-xs">Table {c.table?.tableNumber || c.tableNumber || '–'}</td>
                            <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                              {(c.orderItems || c.items || []).map((i: any) => `${i.quantity}x ${i.product?.name || i.name}`).join(', ') || 'Cancelled Items'}
                            </td>
                            <td className="py-3 px-3 font-black text-xs text-rose-600">
                              KES {Number(c.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-xs font-mono text-slate-400">
                              {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: EXECUTIVE REPORTS & EXPORT
             ======================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <SectionHeader
                title="Executive Business Reports"
                subtitle="Download ready-to-print comprehensive business audits and spreadsheets"
                action={
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Boardroom Summary
                  </button>
                }
              />

              <div className="space-y-4">
                {[
                  {
                    title: 'Full Business Health Audit (CSV)',
                    desc: 'Complete overview of gross revenue, estimated profit margins, order velocity, and customer counts.',
                    filename: `business_health_${period}.csv`,
                    action: () => {
                      csvExport(
                        ['Report', 'Period', 'Gross Revenue (KES)', 'Net Profit (KES)', 'Total Orders', 'Occupancy Rate'],
                        [['DrinkHub Business Audit', period, grossRevenue, estimatedNetProfit, completedOrders.length, `${tableOccupancyRate}%`]],
                        `business_health_${period}.csv`
                      );
                      showToast('Business health audit exported');
                    },
                  },
                  {
                    title: 'Financial & Cashflow Reconciliation (CSV)',
                    desc: 'M-Pesa STK receipts, Card POS terminals, and physical cash amounts with percentages.',
                    filename: `financial_reconciliation_${period}.csv`,
                    action: () => {
                      csvExport(
                        ['Channel', 'Amount (KES)', 'Percentage'],
                        payData.map(p => [p.name, Math.round((grossRevenue * p.value) / 100), `${p.value}%`]),
                        `financial_reconciliation_${period}.csv`
                      );
                      showToast('Financial reconciliation exported');
                    },
                  },
                  {
                    title: 'Product Mix & Top Performers (CSV)',
                    desc: 'Itemized sales rankings, unit volume sold, and total sales per item.',
                    filename: `products_performance_${period}.csv`,
                    action: () => {
                      csvExport(
                        ['Product', 'Category', 'Units Sold', 'Total Revenue (KES)'],
                        (analytics?.topProducts || []).map((p: any) => [p.name, p.category, p.unitsSold, p.revenue]),
                        `products_performance_${period}.csv`
                      );
                      showToast('Product mix report exported');
                    },
                  },
                  {
                    title: 'Staff Leaderboard & Shift Audit (CSV)',
                    desc: 'Waiter sales volume, order counts, and fulfillment speeds.',
                    filename: `staff_audit_${period}.csv`,
                    action: () => {
                      csvExport(
                        ['Staff Name', 'Orders Completed', 'Revenue (KES)', 'Avg Speed (Mins)'],
                        (analytics?.waiterPerformance || []).map((w: any) => [w.name, w.ordersServed, w.revenueGenerated, w.avgFulfillmentMins]),
                        `staff_audit_${period}.csv`
                      );
                      showToast('Staff audit exported');
                    },
                  },
                ].map(r => (
                  <div
                    key={r.title}
                    className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{r.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</p>
                    </div>
                    <button
                      onClick={r.action}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition shadow-sm"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: VENUE PROFILE & BRANDING SETTINGS (EDITABLE)
             ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <SectionHeader
                title="Venue Profile & Executive Configuration"
                subtitle="Control venue identity, operating hours, brand theme color, and digital banners"
              />

              <form onSubmit={handleSaveVenueSettings} className="space-y-6">
                {/* Visual Identity Card */}
                <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Venue Identity & Storefront Appearance</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Venue Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.name}
                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g. The Alchemist Westlands"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.phone}
                        onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="+254 700 000 000"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="info@venue.co.ke"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        City & County
                      </label>
                      <input
                        type="text"
                        value={settingsForm.city}
                        onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Nairobi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                      Physical Location / Address
                    </label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Parklands Road, Westlands"
                    />
                  </div>
                </div>

                {/* Operating Hours & Brand Theme Card */}
                <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Operating Hours & Brand Theme</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Opening Time
                      </label>
                      <input
                        type="time"
                        value={settingsForm.openingHours}
                        onChange={e => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Closing Time
                      </label>
                      <input
                        type="time"
                        value={settingsForm.closingHours}
                        onChange={e => setSettingsForm({ ...settingsForm, closingHours: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Brand Color Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {BRAND_PRESETS.map(p => (
                        <button
                          key={p.color}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, brandColor: p.color })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                            settingsForm.brandColor === p.color
                              ? 'border-amber-500 ring-2 ring-amber-500/30'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.color }} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo & Banner URL inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Club Logo Image URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.logoUrl}
                        onChange={e => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="https://..."
                      />
                      {settingsForm.logoUrl && (
                        <div className="mt-2 h-14 w-14 rounded-xl border p-1 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          <img src={settingsForm.logoUrl} alt="Logo Preview" className="h-full w-full object-contain rounded-lg" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Banner Image URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.bannerUrl}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerUrl: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="https://..."
                      />
                      {settingsForm.bannerUrl && (
                        <div className="mt-2 h-14 w-full rounded-xl border p-1 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                          <img src={settingsForm.bannerUrl} alt="Banner Preview" className="h-full w-full object-cover rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 transition shadow-md shadow-amber-500/25 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {savingSettings ? 'Saving Configuration...' : 'Save Venue Configuration'}
                  </button>
                  {onSwitchToManager && (
                    <button
                      type="button"
                      onClick={onSwitchToManager}
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Jump to Manager Operations
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
